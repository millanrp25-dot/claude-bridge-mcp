import { z } from "zod";
import { approvalModeSchema } from "../config/schema.js";
import type { ToolContext, ToolEnvelope } from "./common.js";

export const delegateInputSchema = {
  project_path: z.string().describe("Absolute path to the project (must be an approved project)"),
  task: z.string().min(3).describe("The engineering task for Claude Code to perform"),
  files: z
    .array(z.string())
    .optional()
    .describe("Optional list of files to focus on (relative to project root)"),
  branch: z
    .string()
    .optional()
    .describe("Optional git branch to create/switch to before running the task"),
  approval_mode: approvalModeSchema
    .optional()
    .describe("suggest = plan only, auto-edit = apply edits, full-auto = skip permission checks"),
  timeout_ms: z.number().int().positive().optional().describe("Task timeout in milliseconds"),
  approval_id: z
    .string()
    .optional()
    .describe("Approval token from approve_action, required for flagged/dangerous tasks"),
};

export type DelegateArgs = {
  project_path: string;
  task: string;
  files?: string[];
  branch?: string;
  approval_mode?: z.infer<typeof approvalModeSchema>;
  timeout_ms?: number;
  approval_id?: string;
};

export async function delegateToClaude(ctx: ToolContext, args: DelegateArgs): Promise<ToolEnvelope> {
  // 1. validate inputs & trust boundary
  const projectPath = ctx.guard.assertTrustedProject(args.project_path);
  const timeoutMs = ctx.guard.clampTimeout(args.timeout_ms);
  const mode = ctx.guard.effectiveApprovalMode(args.approval_mode);

  // 2. dangerous-operation gate
  const policy = ctx.guard.checkTask(args.task);
  if (policy.requiresApproval) {
    const approved = args.approval_id
      ? ctx.approvals.consume(args.approval_id, projectPath, args.task)
      : false;
    if (!approved) {
      const request = ctx.approvals.request(projectPath, args.task, policy.matches);
      ctx.store.startTask({
        tool: "delegate_to_claude",
        projectPath,
        task: args.task,
      });
      ctx.store.finishTask(ctx.store.latestTask(projectPath)!.id, "awaiting-approval");
      return {
        success: false,
        reason: `Task matches blocked-operation policy (${policy.matches.join(", ")}) and requires explicit approval.`,
        approval_id: request.id,
        matched_patterns: policy.matches,
        next_steps: [
          `Ask a human operator to approve via the approve_action tool with approval_id "${request.id}" (or the dashboard).`,
          "Then retry delegate_to_claude with the same project_path and task, passing approval_id.",
        ],
      };
    }
    ctx.log.warn("dangerous task proceeding with consumed approval", {
      approvalId: args.approval_id,
    });
  }

  // 3. optional branch switch, then mandatory git checkpoint
  if (args.branch) {
    await ctx.git.checkoutBranch(projectPath, args.branch);
  }
  const checkpoint = await ctx.git.createCheckpoint(projectPath, args.task);
  ctx.store.setCheckpoint(projectPath, checkpoint.hash);

  const record = ctx.store.startTask({
    tool: "delegate_to_claude",
    projectPath,
    task: args.task,
    checkpointHash: checkpoint.hash,
  });

  // 4. build the prompt and execute through the router
  const focus =
    args.files && args.files.length
      ? `\n\nFocus on these files:\n${args.files.map((f) => `- ${f}`).join("\n")}`
      : "";
  const prompt =
    `${args.task}${focus}\n\n` +
    `When you are done, end with a short summary of what you changed and why.`;

  const result = await ctx.router.execute({
    kind: "code",
    prompt,
    cwd: projectPath,
    timeoutMs,
    approvalMode: mode,
  });

  // 5. collect diff & changed files against the checkpoint
  const changes = await ctx.git.summarizeChanges(projectPath, checkpoint.hash);
  const sanitizedDiff = ctx.sanitizer.sanitizeDiff(changes.diff);
  const annotatedFiles = ctx.sanitizer.annotateFiles(changes.changedFiles);

  ctx.store.finishTask(record.id, result.success ? "succeeded" : "failed", {
    executor: result.executor,
    changedFiles: changes.changedFiles,
    usage: result.usage,
    error: result.success ? undefined : result.output.slice(0, 500),
  });

  const envelope: ToolEnvelope = {
    success: result.success,
    executor: result.executor,
    approval_mode: mode,
    summary: ctx.sanitizer.redact(result.output).slice(0, 20_000),
    exit_code: result.exitCode ?? null,
    timed_out: result.timedOut ?? false,
    checkpoint: checkpoint.hash,
    branch: checkpoint.branch,
    changed_files: annotatedFiles,
    diff_stat: changes.diffStat,
    diff: sanitizedDiff.slice(0, 60_000),
    usage: result.usage,
    stderr: result.success ? undefined : ctx.sanitizer.redact((result.stderr ?? "").slice(-4_000)),
  };
  envelope.next_steps = result.success
    ? [
        "Call review_changes to get a code review of this diff.",
        "Call run_tests to verify the change.",
        `Call rollback_checkpoint with checkpoint "${checkpoint.hash}" if the change should be discarded.`,
      ]
    : [
        "Inspect stderr/summary for the failure cause.",
        `The working tree may be partially modified; rollback_checkpoint "${checkpoint.hash}" restores the pre-task state.`,
        "Refine the task description and retry.",
      ];
  if (!result.success) envelope.reason = "Execution failed — see summary/stderr.";
  return envelope;
}
