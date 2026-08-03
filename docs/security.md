# Security model

## Threat model

The bridge sits between a **remote LLM orchestrator** (ChatGPT) and **your local machine**. The remote side must be treated as untrusted input: prompts can be manipulated, the model can hallucinate destructive commands, and anything the bridge returns may leave your machine. The design goals follow from that:

1. never expose unrestricted terminal access,
2. contain execution to explicitly approved folders,
3. force a human into the loop for irreversible operations,
4. never leak secrets outward,
5. make every action auditable and reversible.

## Layer 1 — Project containment

`SecurityGuard.assertTrustedProject` resolves the requested path with `realpathSync.native` (defeating `..` traversal and symlink tricks) and requires it to be equal to or inside a configured `approved_projects` entry. Every tool that touches disk goes through this check. There is no way to point the bridge at an arbitrary directory from the MCP side.

## Layer 2 — No raw terminal

The bridge itself never exposes a "run this shell command" tool. Code execution happens only inside Claude Code's own permissioned harness, further constrained by the bridge:

- `suggest` → Claude Code plan mode: nothing is written.
- `auto-edit` → `acceptEdits` plus an **allowlist** of tools (`allowed_commands`) — e.g. `Bash(npm test:*)` but not `Bash`.
- `full-auto` → only possible when `allow_full_auto: true` is set in the config file on the machine. A remote caller can never grant this to itself; requested modes are capped at the configured ceiling.

All child processes are spawned with argument arrays (`shell: false`) — there is no shell interpolation anywhere in the bridge.

## Layer 3 — Approval gate for dangerous operations

Task text is screened against `blocked_commands` (rm, sudo, `git push`, deployments, publishes, env mutation, `.env`, ssh keys by default). A match aborts execution and creates a **pending approval** instead. Properties of the approval token:

- single-use (consumed on execution),
- bound to the exact project + task text (a bait-and-switch retry with different text fails),
- expires after 30 minutes,
- resolvable only via `approve_action` or the local dashboard — i.e. by whoever controls those surfaces, which should be you, not the remote model. Keep the dashboard un-tunneled if you want the approval decision strictly local.

## Layer 4 — Secret hygiene

Everything that leaves the bridge (tool results, diffs, logs, dashboard payloads) passes through the sanitizer:

- pattern-based redaction: Anthropic/OpenAI/AWS/GitHub/Slack/Google keys, JWTs, private-key blocks, generic `secret=...` assignments;
- diff hunks touching sensitive files (`.env*`, `id_rsa*`, `*.pem`, `*.key`, `credentials`, `secrets.*`, `.npmrc`, `.netrc`) are withheld entirely and replaced with a marker;
- changed-file lists flag sensitive paths instead of hiding them, so the caller knows something changed without seeing contents;
- the logger itself runs every message through the same redaction, so secrets don't land in log files either.

API keys for fallback providers are read from environment variables — never stored in `config.yaml`.

## Layer 5 — Reversibility & audit

- A git checkpoint commit precedes every delegated task; `rollback_checkpoint` restores it in one call and refuses to reset to anything that isn't a bridge checkpoint.
- Every command execution, approval decision, and task outcome is logged (console + JSON-lines file), with timestamps and redaction applied.
- Checkpoint commits are visible in `git log` as `[claude-bridge] checkpoint: <task>` — an on-repo audit trail.

## Network exposure

The HTTP server binds to `127.0.0.1` only. Exposing it to ChatGPT requires an explicit tunnel — that is a deliberate, revocable action by the operator. Recommendations:

- prefer a tunnel with an authentication layer (Cloudflare Access, Tailscale Funnel with ACLs);
- do not tunnel the dashboard, only `/mcp`, if your tunnel supports path rules — approvals then remain local-only;
- keep `approval_mode: suggest` or `auto-edit` for anything internet-reachable;
- stop the tunnel when not in use.

## Residual risks (be honest with yourself)

- `full-auto` mode disables Claude Code's permission prompts. Only enable `allow_full_auto` on throwaway projects.
- The blocked-command policy screens the *task text*; a sufficiently creative prompt could describe a dangerous action in words that don't match any pattern. The allowlist (`allowed_commands`) is the stronger control — keep it tight.
- Secret redaction is pattern-based and cannot catch every bespoke secret format. Keep real secrets out of approved projects where possible.
- Anyone who can reach your tunnel can invoke tools. Treat the tunnel URL itself as a credential.
