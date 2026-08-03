#!/usr/bin/env node
import { loadConfig, ConfigError } from "./config/loader.js";
import { buildContainer } from "./container.js";
import { startStdio } from "./server/mcpServer.js";
import { startHttp } from "./server/httpServer.js";

function parseArgs(argv: string[]): { configPath?: string; transport?: string } {
  const out: { configPath?: string; transport?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") out.configPath = argv[++i];
    if (argv[i] === "--transport") out.transport = argv[++i];
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig(args.configPath);
  if (args.transport === "stdio" || args.transport === "http" || args.transport === "both") {
    config.server.transport = args.transport;
  }

  const ctx = buildContainer(config);
  ctx.log.info("claude-bridge-mcp starting", {
    transport: config.server.transport,
    approvedProjects: config.approved_projects.length,
  });

  const transport = config.server.transport;
  if (transport === "stdio" || transport === "both") {
    await startStdio(ctx);
  }
  if (transport === "http" || transport === "both") {
    startHttp(ctx);
  }

  process.on("uncaughtException", (err) => {
    ctx.log.error("uncaught exception (server continues)", { error: err.message });
  });
  process.on("unhandledRejection", (reason) => {
    ctx.log.error("unhandled rejection (server continues)", { error: String(reason) });
  });
}

main().catch((err) => {
  if (err instanceof ConfigError) {
    process.stderr.write(`Configuration error:\n${err.message}\n`);
  } else {
    process.stderr.write(`Fatal startup error: ${(err as Error).stack ?? err}\n`);
  }
  process.exit(1);
});
