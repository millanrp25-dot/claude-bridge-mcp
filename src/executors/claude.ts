import { execCommand, binaryAvailable } from "../util/exec.js";
import type { BridgeConfig, ApprovalMode } from "../config/schema.js";
import type { Logger } from "../logging/logger.js";
import type { ExecutionRequest, ExecutionResult, Executor } from "./types.js";

interface ClaudeJsonResult {
  type?: string;
  subtype?: string;
  is_error?: boolean;
  result?: string;
  session_id?: string;
  total_cost_usd?: number;
  duration_ms?: number;
  num_turns?: number;
  usage?: { input_tokens?: number; output_tokens?: number };
}

/**
 * Runs the local Claude Code CLI in headless mode:
 *   claude -p "<task>" --output-format json [permission flags]
 *
 * Permission mapping (never exceeds what config allows — enforced upstream
 * by SecurityGuard.effectiveApprovalMode):
 *   suggest   -> --permission-mode plan            (no edits applied)
 *   auto-edit -> --permission-mode acceptEdits + --allowedTools <config list>
 *   full-auto -> --dangerously-skip-permissions    (requires allow_full_auto)
 */
export class ClaudeExecutor implements Executor {
  readonly name = "claude";
  readonly capabilities = { code: true, analysis: true };

  constructor(
    private readonly config: BridgeConfig,
    private readonly log: Logger,
  ) {}

  isAvailable(): Promise<boolean> {
    return binaryAvailable(this.config.claude.binary);
  }

  private permissionArgs(mode: ApprovalMode, kind: "code" | "analysis"): string[] {
    if (kind === "analysis") {
      // reviews never need write access, regardless of the requested mode
      return ["--permission-mode", "plan", "--disallowedTools", "Edit,Write,Bash"];
    }
    switch (mode) {
      case "suggest":
        return ["--permission-mode", "plan"];
      case "auto-edit":
        return [
          "--permission-mode", "acceptEdits",
          ...(this.config.allowed_commands.length
            ? ["--allowedTools", this.config.allowed_commands.join(",")]
            : []),
        ];
      case "full-auto":
        return ["--dangerously-skip-permissions"];
    }
  }

  async execute(req: ExecutionRequest): Promise<ExecutionResult> {
    const mode = req.approvalMode ?? "auto-edit";
    const args = [
      "-p", req.prompt,
      "--output-format", "json",
      "--max-turns", String(this.config.claude.max_turns),
      ...this.permissionArgs(mode, req.kind),
    ];
    if (this.config.claude.model) {
      args.push("--model", this.config.claude.model);
    }

    this.log.info("invoking claude code", {
      kind: req.kind,
      mode,
      cwd: req.cwd,
      timeoutMs: req.timeoutMs,
      command: `${this.config.claude.binary} ${args.join(" ")}`,
    });

    const res = await execCommand(this.config.claude.binary, args, {
      cwd: req.cwd,
      timeoutMs: req.timeoutMs,
      env: { CLAUDE_CODE_DISABLE_TELEMETRY: "0" },
    });

    let parsed: ClaudeJsonResult | null = null;
    try {
      // headless mode prints a single JSON object on stdout
      const jsonStart = res.stdout.indexOf("{");
      if (jsonStart >= 0) parsed = JSON.parse(res.stdout.slice(jsonStart)) as ClaudeJsonResult;
    } catch {
      this.log.warn("claude output was not valid JSON; falling back to raw stdout");
    }

    const success = !res.timedOut && res.exitCode === 0 && parsed?.is_error !== true;
    return {
      success,
      output: parsed?.result ?? res.stdout.trim(),
      stdout: res.stdout,
      stderr: res.stderr,
      exitCode: res.exitCode,
      timedOut: res.timedOut,
      usage: {
        inputTokens: parsed?.usage?.input_tokens,
        outputTokens: parsed?.usage?.output_tokens,
        costUsd: parsed?.total_cost_usd,
        turns: parsed?.num_turns,
        durationMs: parsed?.duration_ms ?? res.durationMs,
      },
      executor: this.name,
    };
  }
}
