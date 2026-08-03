import { z } from "zod";
import type { ToolContext, ToolEnvelope } from "./common.js";

export const approveInputSchema = {
  approval_id: z.string().describe("The approval id returned by delegate_to_claude"),
  decision: z.enum(["approve", "deny"]).describe("Whether to allow the flagged operation"),
  decided_by: z.string().optional().describe("Name of the human making the decision"),
};

export type ApproveArgs = {
  approval_id: string;
  decision: "approve" | "deny";
  decided_by?: string;
};

/**
 * Extension tool (beyond the four core tools): resolves a pending approval.
 * Intended to be invoked by a human operator — either through an MCP client
 * they control or the web dashboard, which calls the same queue.
 */
export async function approveAction(ctx: ToolContext, args: ApproveArgs): Promise<ToolEnvelope> {
  const item = ctx.approvals.decide(
    args.approval_id,
    args.decision === "approve",
    args.decided_by,
  );
  return {
    success: true,
    approval: item,
    next_steps:
      args.decision === "approve"
        ? [
            "Retry delegate_to_claude with the exact same project_path and task, passing this approval_id.",
            "The token is single-use and expires 30 minutes after creation.",
          ]
        : ["The flagged task was denied and will not run."],
  };
}
