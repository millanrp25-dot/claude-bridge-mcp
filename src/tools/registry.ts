import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { safeHandler, type ToolContext } from "./common.js";
import { delegateInputSchema, delegateToClaude, type DelegateArgs } from "./delegate.js";
import { reviewInputSchema, reviewChanges, type ReviewArgs } from "./review.js";
import { runTestsInputSchema, runTests, type RunTestsArgs } from "./tests.js";
import { statusInputSchema, bridgeStatus, type StatusArgs } from "./status.js";
import { approveInputSchema, approveAction, type ApproveArgs } from "./approve.js";
import { rollbackInputSchema, rollbackCheckpoint, type RollbackArgs } from "./rollback.js";

/** Register every bridge tool on an MCP server instance. */
export function registerTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "delegate_to_claude",
    {
      title: "Delegate task to Claude Code",
      description:
        "Delegate a software engineering task to the local Claude Code instance. " +
        "Creates a git checkpoint first, executes inside an approved project only, " +
        "and returns the summary, diff, changed files and usage. Dangerous operations " +
        "(rm, sudo, git push, deployments, env changes) require prior approval via approve_action.",
      inputSchema: delegateInputSchema,
    },
    safeHandler<DelegateArgs>(ctx, "delegate_to_claude", (args) => delegateToClaude(ctx, args)),
  );

  server.registerTool(
    "review_changes",
    {
      title: "Review a diff",
      description:
        "Get a structured code review (quality, bugs, security, performance, architecture) " +
        "for a git diff, or for the pending changes of an approved project.",
      inputSchema: reviewInputSchema,
    },
    safeHandler<ReviewArgs>(ctx, "review_changes", (args) => reviewChanges(ctx, args)),
  );

  server.registerTool(
    "run_tests",
    {
      title: "Run project tests",
      description:
        "Detect the package manager / test framework of an approved project, install " +
        "dependencies if missing, run the tests, and return a structured result.",
      inputSchema: runTestsInputSchema,
    },
    safeHandler<RunTestsArgs>(ctx, "run_tests", (args) => runTests(ctx, args)),
  );

  server.registerTool(
    "status",
    {
      title: "Bridge status",
      description:
        "Report current project state (branch, modified files, checkpoints), the latest " +
        "Claude task, running tasks, pending approvals, executor health and usage totals.",
      inputSchema: statusInputSchema,
    },
    safeHandler<StatusArgs>(ctx, "status", (args) => bridgeStatus(ctx, args)),
  );

  server.registerTool(
    "approve_action",
    {
      title: "Approve or deny a flagged operation",
      description:
        "Resolve a pending approval created when a delegated task matched the " +
        "blocked-operation policy. Approval tokens are single-use and expire after 30 minutes.",
      inputSchema: approveInputSchema,
    },
    safeHandler<ApproveArgs>(ctx, "approve_action", (args) => approveAction(ctx, args)),
  );

  server.registerTool(
    "rollback_checkpoint",
    {
      title: "Roll back to a checkpoint",
      description:
        "Hard-reset an approved project back to a claude-bridge git checkpoint, discarding " +
        "everything a delegated task changed.",
      inputSchema: rollbackInputSchema,
    },
    safeHandler<RollbackArgs>(ctx, "rollback_checkpoint", (args) => rollbackCheckpoint(ctx, args)),
  );
}
