import { z } from "zod";
import type { ToolContext, ToolEnvelope } from "./common.js";

export const statusInputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Optional approved project to include git details for"),
};

export type StatusArgs = { project_path?: string };

export async function bridgeStatus(ctx: ToolContext, args: StatusArgs): Promise<ToolEnvelope> {
  const envelope: ToolEnvelope = { success: true };

  if (args.project_path) {
    const projectPath = ctx.guard.assertTrustedProject(args.project_path);
    const isRepo = await ctx.git.isRepo(projectPath);
    envelope.project = {
      path: projectPath,
      is_git_repo: isRepo,
      branch: isRepo ? await ctx.git.currentBranch(projectPath) : null,
      modified_files: isRepo ? await ctx.git.statusPorcelain(projectPath) : [],
      last_checkpoint: ctx.store.getCheckpoint(projectPath) ?? null,
      recent_checkpoints: isRepo ? await ctx.git.listCheckpoints(projectPath, 5) : [],
    };
    envelope.latest_task = ctx.store.latestTask(projectPath) ?? null;
  } else {
    envelope.latest_task = ctx.store.latestTask() ?? null;
  }

  envelope.approved_projects = ctx.config.approved_projects;
  envelope.running_tasks = ctx.store.runningTasks();
  envelope.pending_approvals = ctx.approvals.pending();
  envelope.usage_totals = ctx.store.usageTotals();
  envelope.executors = await ctx.router.health();
  envelope.recent_tasks = ctx.store.history(10);
  return envelope;
}
