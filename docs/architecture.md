# Architecture

## Overview

```
                    ┌───────────────────────────────┐
                    │  MCP client (ChatGPT, etc.)   │
                    └──────┬───────────────┬────────┘
                    stdio  │               │  Streamable HTTP  ── also serves the dashboard
                    ┌──────▼───────────────▼────────┐
                    │  server/  (mcpServer, http)   │
                    └──────────────┬────────────────┘
                    ┌──────────────▼────────────────┐
                    │  tools/   (registry + 6 tools)│   every handler wrapped in safeHandler
                    └┬─────┬─────┬─────┬─────┬─────┬┘
                     │     │     │     │     │     │
        ┌────────────▼┐ ┌──▼───┐ ┌▼────▼──┐ ┌▼─────▼─────┐
        │ security/   │ │ git/ │ │ state/ │ │ testing/   │
        │ guard       │ │ work-│ │ store  │ │ testRunner │
        │ sanitizer   │ │ space│ └────────┘ └────────────┘
        │ approvals   │ └──────┘
        └─────────────┘
                    ┌──────────────▼────────────────┐
                    │  executors/  router           │
                    │  claude │ openai │ gemini │   │
                    │  ollama │ mock                │
                    └───────────────────────────────┘
```

## Module responsibilities

| Module | Responsibility |
|---|---|
| `config/` | YAML loading + zod validation. Everything downstream consumes a typed, validated `BridgeConfig`. |
| `logging/` | Structured logger: console (stderr — stdout belongs to the MCP stdio transport), JSON-lines files, in-memory ring buffer for the dashboard, redaction hook. |
| `security/guard.ts` | The two hard boundaries: approved-project allowlist (realpath-based, traversal-safe) and the blocked-operation policy. Also caps approval modes and timeouts. |
| `security/sanitizer.ts` | Secret redaction (API keys, tokens, private keys, generic `key=value`), sensitive-file diff withholding. Applied to tool output **and** logs. |
| `security/approvals.ts` | Single-use, expiring approval tokens for flagged operations. |
| `git/workspace.ts` | Checkpoints (real commits), diff/changed-file summaries, rollback (restricted to checkpoint commits), branch handling. |
| `executors/` | The provider abstraction. Every executor implements the same `Executor` interface; the router picks by capability + availability and falls through on capacity failures. |
| `state/store.ts` | Task history, per-project checkpoints, usage accumulation. |
| `testing/testRunner.ts` | Package-manager detection, dependency install, test execution, output summarization. |
| `tools/` | The MCP tool surface. Pure orchestration — no direct process/git/network access; everything flows through injected dependencies. |
| `server/` | Transport wiring: stdio and stateless Streamable HTTP (fresh server+transport per request). |
| `dashboard/` | Self-contained HTML dashboard + two JSON endpoints, sharing the same state/approvals/router instances. |
| `container.ts` | The composition root. All dependency injection happens here. |

## Dependency injection

There is no DI framework — wiring is explicit in `container.ts`, which builds a `ToolContext`:

```ts
interface ToolContext {
  config; log; guard; sanitizer; approvals; git; router; store; testRunner;
}
```

Tool handlers receive `ToolContext` as a parameter and never import concrete services. Tests exploit this: `buildContainer(config, { router, log })` swaps in a router backed by `MockExecutor`, letting the full delegate→checkpoint→diff→review pipeline run against a real temp git repo with zero model calls.

## The executor abstraction

```ts
interface Executor {
  name: string;
  capabilities: { code: boolean; analysis: boolean };
  isAvailable(): Promise<boolean>;
  execute(req: ExecutionRequest): Promise<ExecutionResult>;
}
```

Two request kinds keep the routing honest:

- **`code`** — may modify files in a working directory. Only Claude Code (and the test mock) has this capability, because only Claude Code has a permissioned, auditable local tool harness.
- **`analysis`** — text-in/text-out (reviews, failure explanations). Every executor supports it, which is what enables provider fallback.

The router walks executors in configured priority order. A result that looks like a **capacity failure** (timeout, rate limit, overload, quota) falls through to the next provider; a genuine task failure is returned immediately so other providers don't repeat a doomed task.

## The Claude executor

Runs the Claude Code CLI headless:

```
claude -p "<task>" --output-format json --max-turns N <permission flags>
```

Approval-mode mapping (after the guard caps it against config):

| Bridge mode | Claude Code flags |
|---|---|
| `suggest` | `--permission-mode plan` |
| `auto-edit` | `--permission-mode acceptEdits --allowedTools <config list>` |
| `full-auto` | `--dangerously-skip-permissions` (requires `allow_full_auto: true`) |

Analysis requests always run with `--permission-mode plan --disallowedTools Edit,Write,Bash`, regardless of mode — reviews never need write access.

The JSON result is parsed defensively for `result`, `is_error`, `total_cost_usd`, `usage`, `num_turns`, `duration_ms`; if parsing fails the raw stdout is returned instead of crashing.

## Delegation lifecycle

```
validate path ─▶ policy check ─▶ (approval gate) ─▶ branch? ─▶ git checkpoint
      ─▶ router.execute(code) ─▶ diff vs checkpoint ─▶ sanitize ─▶ envelope
```

The checkpoint is a real commit (`git add -A` + `commit --allow-empty --no-verify` with a dedicated author), which gives:

- a stable ref to diff against (staged, unstaged **and** untracked changes all captured),
- a rollback target (`git reset --hard` + `git clean -fd`),
- an audit trail in `git log` (`[claude-bridge] checkpoint: <task>`).

`rollback_checkpoint` refuses any commit whose subject doesn't carry the checkpoint prefix, so it can't be used to hard-reset arbitrary history.

## Error-handling contract

`safeHandler` wraps every tool: thrown errors become `{ success: false, reason, next_steps }` envelopes and are logged — the server never crashes on a tool failure. Process-level `uncaughtException`/`unhandledRejection` handlers log and continue. All outbound text passes through the sanitizer.

## Extending the bridge

- **New executor**: implement `Executor`, add a factory in `container.ts`, list it in `executors.priority`. If it can safely edit files, set `capabilities.code = true`.
- **New tool**: create `src/tools/<name>.ts` exporting a zod input schema + handler taking `ToolContext`, register it in `tools/registry.ts`, and add tests using `testHarness()`.
