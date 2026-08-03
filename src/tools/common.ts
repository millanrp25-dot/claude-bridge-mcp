import type { BridgeConfig } from "../config/schema.js";
import type { Logger } from "../logging/logger.js";
import type { SecurityGuard } from "../security/guard.js";
import type { Sanitizer } from "../security/sanitizer.js";
import type { ApprovalQueue } from "../security/approvals.js";
import type { GitWorkspace } from "../git/workspace.js";
import type { ExecutorRouter } from "../executors/router.js";
import type { StateStore } from "../state/store.js";
import type { TestRunner } from "../testing/testRunner.js";

/** Everything a tool handler may depend on — injected, never imported. */
export interface ToolContext {
  config: BridgeConfig;
  log: Logger;
  guard: SecurityGuard;
  sanitizer: Sanitizer;
  approvals: ApprovalQueue;
  git: GitWorkspace;
  router: ExecutorRouter;
  store: StateStore;
  testRunner: TestRunner;
}

/** Uniform envelope every tool returns. */
export interface ToolEnvelope {
  success: boolean;
  reason?: string;
  next_steps?: string[];
  [key: string]: unknown;
}

export interface McpToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
  [key: string]: unknown;
}

/** Serialize an envelope as the MCP text content (sanitized upstream). */
export function toolResult(envelope: ToolEnvelope): McpToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }],
    isError: !envelope.success,
  };
}

/**
 * Wrap a handler so it can never crash the server: any thrown error becomes
 * a structured failure envelope.
 */
export function safeHandler<A>(
  ctx: ToolContext,
  toolName: string,
  handler: (args: A) => Promise<ToolEnvelope>,
): (args: A) => Promise<McpToolResult> {
  return async (args: A) => {
    try {
      const envelope = await handler(args);
      return toolResult(envelope);
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      ctx.log.error(`tool ${toolName} failed`, { error: message });
      return toolResult({
        success: false,
        reason: ctx.sanitizer.redact(message),
        next_steps: ["Inspect the bridge logs for details.", "Fix the reported problem and retry."],
      });
    }
  };
}
