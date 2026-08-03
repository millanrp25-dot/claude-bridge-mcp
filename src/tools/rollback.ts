import { z } from "zod";
import type { ToolContext, ToolEnvelope } from "./common.js";

export const rollbackInputSchema = {
  project_path: z.string().describe("Absolute path to the project (must be an approved project)"),
  checkpoint: z
    .string()
    .optional()
    .describe("Checkpoint commit hash to reset to. Defaults to the most recent bridge checkpoint."),
};

export type RollbackArgs = {
  project_path: string;
  checkpoint?: string;
};

/**
 * Extension tool: restore the working tree to a pre-task checkpoint.
 * Only claude-bridge checkpoint commits are accepted as targets, so this
 * cannot be abused to hard-reset arbitrary history.
 */
export async function rollbackCheckpoint(ctx: ToolContext, args: RollbackArgs): Promise<ToolEnvelope> {
  const projectPath = ctx.guard.assertTrustedProject(args.project_path);
  const target = args.checkpoint ?? ctx.store.getCheckpoint(projectPath);
  if (!target) {
    return {
      success: false,
      reason: "No checkpoint hash provided and none recorded for this project in this session.",
      next_steps: ["Call status with project_path to list recent_checkpoints, then retry with one."],
    };
  }
  await ctx.git.rollback(projectPath, target);
  return {
    success: true,
    restored_to: target,
    note: "Working tree hard-reset to the checkpoint; untracked files created after it were removed.",
    next_steps: ["Verify the project state, then delegate a new task if needed."],
  };
}
