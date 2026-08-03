import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "../tools/registry.js";
import type { ToolContext } from "../tools/common.js";

export const SERVER_NAME = "claude-bridge-mcp";
export const SERVER_VERSION = "0.1.0";

/** Build a fully wired MCP server instance (one per transport connection). */
export function buildMcpServer(ctx: ToolContext): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });
  registerTools(server, ctx);
  return server;
}

/** Attach the server to stdio (for Claude Desktop / local MCP clients). */
export async function startStdio(ctx: ToolContext): Promise<void> {
  const server = buildMcpServer(ctx);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  ctx.log.info("MCP server listening on stdio");
}
