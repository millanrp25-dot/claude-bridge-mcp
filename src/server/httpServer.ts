import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildMcpServer } from "./mcpServer.js";
import { renderDashboard, dashboardApi } from "../dashboard/dashboard.js";
import type { ToolContext } from "../tools/common.js";

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/**
 * HTTP server hosting:
 *   POST /mcp      — MCP Streamable HTTP endpoint (stateless mode), which is
 *                    what ChatGPT's MCP connector support speaks
 *   GET  /         — the web dashboard (when enabled)
 *   GET  /api/*    — dashboard JSON endpoints
 *
 * The server binds to 127.0.0.1 only. To reach it from ChatGPT, expose it
 * through a tunnel you control (see docs/installation.md) — never bind it
 * directly to a public interface.
 */
export function startHttp(ctx: ToolContext): http.Server {
  const port = ctx.config.server.http_port;

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

      if (url.pathname === "/mcp") {
        if (req.method !== "POST") {
          res.writeHead(405, { "content-type": "application/json" }).end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Method not allowed. Use POST for stateless MCP." },
              id: null,
            }),
          );
          return;
        }
        // Stateless mode: fresh server+transport per request, no session ids.
        const body = await readBody(req);
        let parsed: unknown;
        try {
          parsed = body ? JSON.parse(body) : undefined;
        } catch {
          res.writeHead(400).end("invalid JSON");
          return;
        }
        const mcp = buildMcpServer(ctx);
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        res.on("close", () => {
          void transport.close();
          void mcp.close();
        });
        await mcp.connect(transport);
        await transport.handleRequest(req, res, parsed);
        return;
      }

      if (ctx.config.server.dashboard && url.pathname === "/") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(renderDashboard());
        return;
      }
      if (ctx.config.server.dashboard && url.pathname.startsWith("/api/")) {
        await dashboardApi(ctx, url, req, res);
        return;
      }

      res.writeHead(404).end("not found");
    } catch (err) {
      ctx.log.error("http request failed", { error: (err as Error).message });
      if (!res.headersSent) res.writeHead(500);
      res.end("internal error");
    }
  });

  server.listen(port, "127.0.0.1", () => {
    ctx.log.info(`HTTP server listening on http://127.0.0.1:${port}`, {
      mcp: `/mcp`,
      dashboard: ctx.config.server.dashboard ? "/" : "disabled",
    });
  });
  return server;
}
