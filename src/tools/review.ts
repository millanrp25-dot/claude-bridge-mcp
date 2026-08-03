import { z } from "zod";
import type { ToolContext, ToolEnvelope } from "./common.js";

export const reviewInputSchema = {
  diff: z
    .string()
    .optional()
    .describe("A unified git diff to review. Omit to review pending changes in project_path."),
  project_path: z
    .string()
    .optional()
    .describe("Approved project to pull the pending diff from when 'diff' is omitted"),
  context: z.string().optional().describe("Optional extra context (what the change is meant to do)"),
  timeout_ms: z.number().int().positive().optional(),
};

export type ReviewArgs = {
  diff?: string;
  project_path?: string;
  context?: string;
  timeout_ms?: number;
};

const REVIEW_PROMPT = `You are a strict senior code reviewer. Review the following git diff and respond with ONLY a JSON object (no markdown fence) with this exact shape:
{
  "overall_quality": "excellent|good|acceptable|poor",
  "summary": "one-paragraph overall assessment",
  "bugs": [{"file": "...", "issue": "...", "severity": "high|medium|low"}],
  "security_issues": [{"file": "...", "issue": "...", "severity": "high|medium|low"}],
  "performance_issues": [{"file": "...", "issue": "..."}],
  "architecture_suggestions": ["..."],
  "quality_notes": ["style / maintainability observations"]
}
Report every issue you find, including low-severity ones. Empty arrays are fine.`;

function tryParseReview(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function reviewChanges(ctx: ToolContext, args: ReviewArgs): Promise<ToolEnvelope> {
  let diff = args.diff ?? "";
  if (!diff.trim()) {
    if (!args.project_path) {
      return {
        success: false,
        reason: "Provide either a 'diff' or a 'project_path' to review pending changes from.",
        next_steps: ["Retry with a unified diff, or with project_path set to an approved project."],
      };
    }
    const projectPath = ctx.guard.assertTrustedProject(args.project_path);
    const checkpoint = ctx.store.getCheckpoint(projectPath);
    const since = checkpoint ?? "HEAD";
    const changes = await ctx.git.summarizeChanges(projectPath, since);
    diff = changes.diff;
    if (!diff.trim()) {
      return {
        success: true,
        summary: "No pending changes to review.",
        review: null,
      };
    }
  }

  const safeDiff = ctx.sanitizer.sanitizeDiff(diff);
  const timeoutMs = ctx.guard.clampTimeout(args.timeout_ms ?? 300_000);
  const record = ctx.store.startTask({ tool: "review_changes", task: "code review" });

  const result = await ctx.router.execute({
    kind: "analysis",
    prompt: `${REVIEW_PROMPT}\n\n${args.context ? `Change context: ${args.context}\n\n` : ""}DIFF:\n${safeDiff.slice(0, 150_000)}`,
    timeoutMs,
  });

  ctx.store.finishTask(record.id, result.success ? "succeeded" : "failed", {
    executor: result.executor,
    usage: result.usage,
  });

  if (!result.success) {
    return {
      success: false,
      reason: `Review failed on all executors: ${ctx.sanitizer.redact(result.output).slice(0, 1_000)}`,
      next_steps: ["Verify at least one analysis-capable executor is available (status tool shows executor health)."],
    };
  }

  const parsed = tryParseReview(result.output);
  return {
    success: true,
    executor: result.executor,
    review: parsed ?? undefined,
    raw_review: parsed ? undefined : ctx.sanitizer.redact(result.output).slice(0, 20_000),
    usage: result.usage,
    next_steps: ["Address high-severity findings, then re-run review_changes and run_tests."],
  };
}
