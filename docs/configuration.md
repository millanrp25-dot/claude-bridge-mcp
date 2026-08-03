# Configuration reference

The bridge loads `config.yaml` (or `config.yml` / `claude-bridge.yaml`) from the working directory, or the file passed with `--config`. All values are validated with zod at startup; invalid configs fail fast with a per-field error list.

## Top level

| Key | Type / default | Meaning |
|---|---|---|
| `approved_projects` | `string[]` (required) | Absolute paths of projects the bridge may operate in. Subdirectories are allowed; everything else is rejected. Each must be a git repo for delegation to work. |
| `approval_mode` | `suggest \| auto-edit \| full-auto`, default `auto-edit` | Global ceiling for how much autonomy Claude Code gets. Callers can request less, never more. |
| `allow_full_auto` | `bool`, default `false` | Hard switch: without it, `full-auto` silently degrades to `auto-edit`. |
| `default_timeout_ms` | int, default `600000` | Task timeout when the caller doesn't specify one. |
| `max_timeout_ms` | int, default `1800000` | Ceiling any requested timeout is clamped to. |
| `blocked_commands` | `string[]` of regexes | Case-insensitive patterns; a task matching any of them requires approval. Defaults cover `rm -rf`, `sudo`, `git push`, deploys, publishes, env mutation, `.env`, ssh keys. |
| `allowed_commands` | `string[]` | Claude Code tool patterns passed via `--allowedTools` in auto-edit mode (e.g. `Bash(npm test:*)`). |

## `claude`

| Key | Default | Meaning |
|---|---|---|
| `binary` | `claude` | Claude Code executable (name on PATH or absolute path). |
| `model` | `null` | Optional `--model` override. |
| `max_turns` | `40` | `--max-turns` for headless runs. |

## `executors`

| Key | Meaning |
|---|---|
| `priority` | Order in which providers are tried: any of `claude`, `openai`, `gemini`, `ollama`, `mock`. Claude should stay first — it is the only code-capable executor. |
| `openai.enabled` / `model` / `api_key_env` / `base_url` | OpenAI-compatible chat-completions fallback. The key is read from the named env var, never from the config file. |
| `gemini.enabled` / `model` / `api_key_env` | Google Gemini fallback. |
| `ollama.enabled` / `model` / `base_url` | Local Ollama fallback (availability = `/api/tags` reachable). |

Fallback executors are **analysis-only** (reviews, explanations). They never receive filesystem access.

## `logging`

| Key | Default | Meaning |
|---|---|---|
| `dir` | `./logs` | JSON-lines log directory (one file per day). |
| `level` | `info` | `debug` \| `info` \| `warn` \| `error`. |
| `console` | `true` | Human-readable logging to **stderr** (stdout is the MCP channel). |
| `json` | `true` | Enable file logging. |
| `verbose` | `false` | When true, log full command lines and captured stdout/stderr (still secret-redacted). |

## `server`

| Key | Default | Meaning |
|---|---|---|
| `transport` | `stdio` | `stdio` \| `http` \| `both`. CLI `--transport` overrides. |
| `http_port` | `8765` | Port for `/mcp`, the dashboard, and `/api/*`. Binds to `127.0.0.1` only. |
| `dashboard` | `true` | Serve the dashboard on the HTTP port. |

## Example: locked-down reviewer setup

```yaml
approved_projects:
  - "C:/work/service-a"
approval_mode: suggest        # Claude can only plan; nothing is written
allow_full_auto: false
executors:
  priority: [claude, ollama]
  ollama: { enabled: true, model: "qwen2.5-coder" }
server:
  transport: both
```

## Example: trusted solo-dev setup

```yaml
approved_projects:
  - "C:/work/side-project"
approval_mode: auto-edit
allowed_commands:
  - "Read"
  - "Edit"
  - "Write"
  - "Grep"
  - "Glob"
  - "Bash(npm run:*)"
  - "Bash(npm test:*)"
  - "Bash(git status:*)"
  - "Bash(git diff:*)"
logging:
  verbose: true
```
