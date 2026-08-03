import type { ApprovalMode } from "../config/schema.js";

/**
 * Two kinds of work flow through the bridge:
 *  - "code": the executor may edit files inside a project working directory
 *    (only Claude Code and the mock executor can do this)
 *  - "analysis": pure text-in/text-out work such as code review
 *    (every executor can do this, enabling provider fallback)
 */
export type ExecutionKind = "code" | "analysis";

export interface ExecutionRequest {
  kind: ExecutionKind;
  prompt: string;
  /** Working directory for code tasks (already security-validated). */
  cwd?: string;
  timeoutMs: number;
  approvalMode?: ApprovalMode;
}

export interface ExecutionUsage {
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  turns?: number;
  durationMs?: number;
}

export interface ExecutionResult {
  success: boolean;
  /** Primary text output (Claude's summary / the model's answer). */
  output: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  timedOut?: boolean;
  usage?: ExecutionUsage;
  executor: string;
}

export interface Executor {
  readonly name: string;
  readonly capabilities: { code: boolean; analysis: boolean };
  isAvailable(): Promise<boolean>;
  execute(req: ExecutionRequest): Promise<ExecutionResult>;
}
