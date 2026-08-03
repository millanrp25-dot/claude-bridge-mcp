import { z } from "zod";
import type { ToolContext, ToolEnvelope } from "./common.js";

export const runTestsInputSchema = {
  project_path: z.string().describe("Absolute path to the project (must be an approved project)"),
  timeout_ms: z.number().int().positive().optional(),
};

export type RunTestsArgs = {
  project_path: string;
  timeout_ms?: number;
};

export async function runTests(ctx: ToolContext, args: RunTestsArgs): Promise<ToolEnvelope> {
  const projectPath = ctx.guard.assertTrustedProject(args.project_path);
  const timeoutMs = ctx.guard.clampTimeout(args.timeout_ms);
  const record = ctx.store.startTask({
    tool: "run_tests",
    projectPath,
    task: "run project tests",
  });

  const result = await ctx.testRunner.run(projectPath, timeoutMs);
  ctx.store.finishTask(record.id, result.passed ? "succeeded" : "failed", {
    error: result.passed ? undefined : result.summary,
  });

  return {
    success: result.passed,
    reason: result.passed ? undefined : result.summary,
    framework: result.framework,
    command: result.command,
    install_ran: result.installRan,
    install_ok: result.installOk,
    exit_code: result.exitCode,
    timed_out: result.timedOut,
    duration_ms: result.durationMs,
    summary: result.summary,
    output_tail: ctx.sanitizer.redact(result.outputTail),
    next_steps: result.passed
      ? ["Tests pass. Consider review_changes before finalizing."]
      : [
          "Read output_tail for the failing tests.",
          "Delegate a fix with delegate_to_claude, including the failure output in the task.",
        ],
  };
}
