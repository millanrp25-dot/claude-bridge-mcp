# claude-bridge-mcp

A production-quality **Model Context Protocol (MCP) server** that lets ChatGPT — or any MCP client — securely delegate coding tasks to a **local Claude Code instance**.

ChatGPT plans and orchestrates; Claude Code executes inside git-checkpointed, security-guarded project folders; the bridge returns structured results (summary, diff, changed files, test output, usage) so the conversation can continue with full context.

> The bridge orchestrates Claude Code — it does **not** bypass Claude limits, permissions, or billing. When Claude is unavailable, analysis work (reviews) can fail over to other configured providers.

```
┌────────────────────────────────────────────┐
│  ChatGPT / any MCP client                  │
│  plans tasks • reads results • iterates    │
└─────────────────────┬──────────────────────┘
                      │ MCP (stdio or Streamable HTTP)
┌─────────────────────▼──────────────────────┐
│  claude-bridge-mcp                         │
│  ┌──────────┐ ┌─────────┐ ┌─────────────┐  │
│  │ Security │ │   Git   │ │  Approvals  │  │
│  │  guard   │ │workspace│ │    queue    │  │
│  └────┬─────┘ └────┬────┘ └──────┬──────┘  │
│       └─────┬──────┴─────────────┘         │
│      ┌──────▼───────┐   ┌───────────────┐  │
│      │   Executor   │   │  Dashboard    │  │
│      │    router    │   │  (localhost)  │  │
│      └──────┬───────┘   └───────────────┘  │
└─────────────┼──────────────────────────────┘
       ┌──────┼──────────┬──────────┐
┌──────▼───┐ ┌▼────────┐ ┌▼───────┐ ┌▼───────┐
│ Claude   │ │ OpenAI  │ │ Gemini │ │ Ollama │
│ Code CLI │ │ (API)   │ │ (API)  │ │ (local)│
│ code+rev │ │ fallback│ │fallback│ │fallback│
└──────────┘ └─────────┘ └────────┘ └────────┘
```

## Features

- **`delegate_to_claude`** — run an engineering task with the local Claude Code CLI: validates the project against an allowlist, creates a git checkpoint, executes headless, returns summary + sanitized diff + changed files + exit code + token/cost usage.
- **`review_changes`** — structured code review (quality, bugs, security, performance, architecture) of any diff or of a project's pending changes.
- **`run_tests`** — detects npm/pnpm/yarn/bun/pytest/cargo/go, installs dependencies if needed, runs tests, returns a structured result.
- **`status`** — current project, branch, modified files, latest task, pending approvals, executor health, estimated usage.
- **`approve_action`** / **`rollback_checkpoint`** — human approval gate for dangerous operations, and one-call rollback to any pre-task checkpoint.
- **Multi-provider routing** — Claude first; OpenAI / Gemini / Ollama as analysis fallbacks when Claude is unavailable or rate-limited.
- **Security by default** — approved-project allowlist, blocked-command policy with single-use approval tokens, secret redaction on every output, no shell-interpolated commands, full audit logging.
- **Web dashboard** — running tasks, logs, token estimates, recent executions, executor health, approval queue with approve/deny buttons.

## Quick start

```bash
git clone <this repo> && cd claude-bridge-mcp
npm install && npm run build
cp config.example.yaml config.yaml   # then edit approved_projects
npm start                            # stdio transport by default
```

Requirements: Node ≥ 20, git, and the [Claude Code CLI](https://claude.com/claude-code) installed and authenticated (`claude --version` must work).

See **[docs/installation.md](docs/installation.md)** for connecting from ChatGPT (Streamable HTTP) and Claude Desktop (stdio).

## The tools

| Tool | What it does | Dangerous-op gate |
|---|---|---|
| `delegate_to_claude` | Execute a coding task via Claude Code | Yes — approval required for rm/sudo/push/deploy/env |
| `review_changes` | Structured review of a diff | Read-only |
| `run_tests` | Install deps + run project tests | Approved projects only |
| `status` | Project/git/task/executor/usage overview | Read-only |
| `approve_action` | Human approve/deny for a flagged task | Human-in-the-loop |
| `rollback_checkpoint` | Hard-reset to a pre-task checkpoint | Checkpoint commits only |

Every tool returns a structured JSON envelope: `success`, `reason` (on failure), payload fields, and `next_steps`. Tools never crash the server — errors become structured failures.

## Typical flow

1. ChatGPT calls `delegate_to_claude` with a project path and a task.
2. The bridge validates the path, checks the task against the blocked-operation policy, creates a git checkpoint, and runs Claude Code headless.
3. The result comes back with a summary, a sanitized diff, and the changed file list.
4. ChatGPT calls `review_changes` and `run_tests`, reads the findings, and either iterates (another `delegate_to_claude`) or asks for `rollback_checkpoint`.

## Documentation

- [Installation & client setup](docs/installation.md)
- [Architecture](docs/architecture.md)
- [Configuration reference](docs/configuration.md)
- [Security model](docs/security.md)
- [Developer guide](docs/development.md)
- [Usage examples](docs/examples.md)

## Development

```bash
npm test          # vitest: unit + integration + security tests
npm run typecheck
npm run build
```

## License

MIT
