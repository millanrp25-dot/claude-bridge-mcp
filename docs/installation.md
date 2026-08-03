# Installation

## Prerequisites

| Requirement | Check |
|---|---|
| Node.js ≥ 20 (latest LTS recommended) | `node --version` |
| git | `git --version` |
| Claude Code CLI, installed & authenticated | `claude --version` |
| (optional) OpenAI / Gemini API keys, Ollama | env vars / `ollama serve` |

## Install

```bash
git clone <repo-url> claude-bridge-mcp
cd claude-bridge-mcp
npm install
npm run build
```

## Configure

```bash
cp config.example.yaml config.yaml
```

Edit `config.yaml` and set `approved_projects` to the absolute paths of the repositories the bridge may touch. **Every project must be a git repository** — checkpoints are mandatory and delegation fails otherwise. See [configuration.md](configuration.md) for every option.

## Run

```bash
npm start                          # transport from config (default: stdio)
node dist/index.js --transport http     # override transport
node dist/index.js --config /path/to/config.yaml
```

Transports:

- **stdio** — for local MCP clients that spawn the process (Claude Desktop, IDEs, MCP inspectors).
- **http** — Streamable HTTP endpoint at `http://127.0.0.1:<port>/mcp` plus the dashboard at `/`. This is the transport remote clients such as ChatGPT need.
- **both** — stdio and HTTP simultaneously.

## Connecting from ChatGPT

ChatGPT connects to MCP servers over HTTP(S) (connectors / developer mode), so the bridge must be reachable from the internet. The server deliberately binds to `127.0.0.1` only — expose it through a tunnel **you control and can authenticate**:

1. Start the bridge with the HTTP transport:
   ```bash
   node dist/index.js --transport http
   ```
2. Open a tunnel, e.g. with Cloudflare Tunnel or ngrok:
   ```bash
   ngrok http 8765
   ```
3. In ChatGPT → Settings → Connectors (or a custom GPT's Actions/MCP configuration), add the MCP server URL:
   ```
   https://<your-tunnel-host>/mcp
   ```
4. Ask ChatGPT to call the `status` tool first — it verifies connectivity and shows executor health.

> ⚠️ A tunnel makes your bridge reachable from the internet. Use a tunnel product with authentication/ACLs (e.g. Cloudflare Access) or at minimum an unguessable hostname, keep `approval_mode` conservative, and stop the tunnel when not in use. Read [security.md](security.md) before exposing anything.

## Connecting from Claude Desktop / other stdio clients

Add to the client's MCP configuration (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "claude-bridge": {
      "command": "node",
      "args": [
        "C:/path/to/claude-bridge-mcp/dist/index.js",
        "--config", "C:/path/to/claude-bridge-mcp/config.yaml",
        "--transport", "stdio"
      ]
    }
  }
}
```

## The dashboard

With the HTTP transport enabled and `server.dashboard: true`, open:

```
http://127.0.0.1:8765/
```

It shows running tasks, recent executions, logs, token/cost totals, executor health, and the approval queue (with approve/deny buttons). The dashboard is local-only unless you tunnel it.

## Verify the installation

```bash
npm test        # 49 unit/integration/security tests should pass
```

Then, with the server running on HTTP:

```bash
curl -s http://127.0.0.1:8765/api/state | jq .executors
```

`claude` should report `available: true`. If it doesn't, check that `claude --version` works in the same environment and that `claude.binary` in the config points at the right executable.
