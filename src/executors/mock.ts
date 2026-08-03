import type { ExecutionRequest, ExecutionResult, Executor } from "./types.js";

/**
 * Deterministic executor for tests. Records every request and returns a
 * scripted result. Supports both code and analysis so the whole tool
 * pipeline can be exercised without a real model.
 */
export class MockExecutor implements Executor {
  readonly name = "mock";
  readonly capabilities = { code: true, analysis: true };

  readonly calls: ExecutionRequest[] = [];
  available = true;
  nextResult: Partial<ExecutionResult> | null = null;
  /** Optional side effect run inside execute() — e.g. write a file in cwd. */
  onExecute: ((req: ExecutionRequest) => void | Promise<void>) | null = null;

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async execute(req: ExecutionRequest): Promise<ExecutionResult> {
    this.calls.push(req);
    if (this.onExecute) await this.onExecute(req);
    return {
      success: true,
      output: `mock:${req.kind} handled`,
      exitCode: 0,
      usage: { inputTokens: 10, outputTokens: 20, costUsd: 0, durationMs: 1 },
      executor: this.name,
      ...this.nextResult,
    };
  }
}
