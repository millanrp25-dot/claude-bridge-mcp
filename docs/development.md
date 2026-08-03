# Developer guide

## Project layout

```
src/
  index.ts            entry point (arg parsing, startup, crash guards)
  container.ts        composition root — ALL dependency wiring
  config/             schema.ts (zod) + loader.ts (yaml)
  logging/            Logger (stderr console + JSONL file + ring buffer)
  security/           guard.ts, sanitizer.ts, approvals.ts
  git/                workspace.ts (checkpoints, diffs, rollback)
  executors/          types.ts, claude.ts, httpChat.ts, openai.ts,
                      gemini.ts, ollama.ts, mock.ts, router.ts
  state/              store.ts (task history, usage totals)
  testing/            testRunner.ts (PM detection + test execution)
  tools/              common.ts (ToolContext, safeHandler), one file per
                      tool, registry.ts
  server/             mcpServer.ts (stdio), httpServer.ts (streamable HTTP)
  dashboard/          dashboard.ts (HTML + /api handlers)
tests/
  helpers.ts          testHarness(), makeTempRepo(), silentLogger()
  unit/               sanitizer, security, config, router
  integration/        full tool pipeline against a real temp git repo
```

## Commands

```bash
npm run build       # tsc -> dist/
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run test:watch
```

## Design rules

1. **All wiring lives in `container.ts`.** Modules receive dependencies via constructors/parameters; nothing below the composition root does `new ConcreteService()` of another module.
2. **Tools never throw to the client.** `safeHandler` converts exceptions to `{success:false, reason, next_steps}`. If you add a tool, register it through `safeHandler`.
3. **stdout is sacred.** In stdio mode stdout carries MCP JSON-RPC. Log via the `Logger` (stderr/file) — never `console.log`.
4. **No shell strings.** Spawn processes with `execCommand(cmd, argsArray)`; never concatenate user input into a shell line.
5. **Sanitize at the boundary.** Anything user-visible goes through `Sanitizer` — tool envelopes already do; keep it that way for new outputs.

## Adding an executor

1. Create `src/executors/<name>.ts` implementing `Executor` (extend `HttpChatExecutor` if it's an HTTP chat API — you only implement `isAvailable()` and `complete()`).
2. Add a factory entry in `container.ts` and the name to the `executors.priority` enum in `config/schema.ts`.
3. Decide capabilities honestly: `code: true` means the executor can modify files in `cwd` — only grant that to executors with a real permission story.
4. Add a router test in `tests/unit/router.test.ts` and (if code-capable) an integration test.

## Adding a tool

1. `src/tools/<name>.ts`: export a zod raw-shape input schema + `async function <name>(ctx: ToolContext, args)` returning a `ToolEnvelope`.
2. Register it in `src/tools/registry.ts` with a precise description (the description is what the remote model reads to decide when to call it).
3. Test it through `testHarness()` — you get a real temp git repo and a scriptable `MockExecutor`.

## Testing strategy

- **Unit — security**: path containment (including traversal), policy matching, approval-mode capping, approval token lifecycle, redaction, sensitive-diff withholding.
- **Unit — routing**: availability fallback, capacity-failure fallback, genuine-failure short-circuit, capability filtering.
- **Integration**: the real tool handlers against a real temp git repo, with `MockExecutor` standing in for Claude (its `onExecute` hook mutates files to simulate an edit session). This covers checkpoint → execute → diff → sanitize → envelope, the approval round-trip, and rollback.
- Nothing in the suite calls a real model or the network, so `npm test` is fast and deterministic.

## Release checklist

1. `npm run typecheck && npm test`
2. Bump `version` in `package.json` and `SERVER_VERSION` in `src/server/mcpServer.ts`.
3. `npm run build` and smoke-test both transports (`--transport both`): MCP `initialize`, `tools/list`, dashboard `/api/state`.
4. Update docs for any config/schema change.
