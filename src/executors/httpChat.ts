import type { Logger } from "../logging/logger.js";
import type { ExecutionRequest, ExecutionResult, Executor } from "./types.js";

/**
 * Base class for API-backed fallback executors (OpenAI, Gemini, Ollama).
 *
 * These are ANALYSIS-ONLY: they can review diffs, explain failures, and
 * continue conversations when Claude Code is unavailable or rate-limited,
 * but they have no filesystem access and therefore never execute code tasks.
 */
export abstract class HttpChatExecutor implements Executor {
  abstract readonly name: string;
  readonly capabilities = { code: false, analysis: true };

  constructor(protected readonly log: Logger) {}

  abstract isAvailable(): Promise<boolean>;
  protected abstract complete(prompt: string, timeoutMs: number): Promise<string>;

  async execute(req: ExecutionRequest): Promise<ExecutionResult> {
    if (req.kind === "code") {
      return {
        success: false,
        output: `${this.name} cannot execute code tasks (analysis only).`,
        executor: this.name,
      };
    }
    const started = Date.now();
    try {
      const output = await this.complete(req.prompt, req.timeoutMs);
      return {
        success: true,
        output,
        usage: { durationMs: Date.now() - started },
        executor: this.name,
      };
    } catch (err) {
      return {
        success: false,
        output: `${this.name} request failed: ${(err as Error).message}`,
        usage: { durationMs: Date.now() - started },
        executor: this.name,
      };
    }
  }

  protected async fetchJson(
    url: string,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      return (await res.json()) as unknown;
    } finally {
      clearTimeout(timer);
    }
  }
}
