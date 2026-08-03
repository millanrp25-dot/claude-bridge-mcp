import type { Logger } from "../logging/logger.js";
import type { ExecutionKind, ExecutionRequest, ExecutionResult, Executor } from "./types.js";

/**
 * Intelligent routing between providers.
 *
 * Executors are tried in configured priority order. For a given request the
 * router picks the first executor that (a) supports the request kind and
 * (b) reports itself available. If execution throws or looks like a
 * capacity/limit failure, the router falls through to the next candidate —
 * this is what lets a review continue on OpenAI/Gemini/Ollama when Claude
 * Code is unavailable or has hit its usage limit.
 */
export class ExecutorRouter {
  constructor(
    private readonly executors: Executor[],
    private readonly log: Logger,
  ) {}

  list(): Executor[] {
    return [...this.executors];
  }

  async health(): Promise<{ name: string; available: boolean; code: boolean; analysis: boolean }[]> {
    return Promise.all(
      this.executors.map(async (e) => ({
        name: e.name,
        available: await e.isAvailable().catch(() => false),
        code: e.capabilities.code,
        analysis: e.capabilities.analysis,
      })),
    );
  }

  private candidates(kind: ExecutionKind): Executor[] {
    return this.executors.filter((e) => e.capabilities[kind]);
  }

  private looksLikeCapacityFailure(result: ExecutionResult): boolean {
    const text = `${result.output} ${result.stderr ?? ""}`.toLowerCase();
    return (
      result.timedOut === true ||
      /rate.?limit|usage limit|overloaded|quota|529|too many requests/.test(text)
    );
  }

  async execute(req: ExecutionRequest): Promise<ExecutionResult> {
    const candidates = this.candidates(req.kind);
    if (candidates.length === 0) {
      return {
        success: false,
        output: `No executor is capable of '${req.kind}' tasks. Check executors config.`,
        executor: "router",
      };
    }

    let lastResult: ExecutionResult | null = null;
    for (const executor of candidates) {
      const available = await executor.isAvailable().catch(() => false);
      if (!available) {
        this.log.debug(`executor unavailable, skipping`, { executor: executor.name });
        continue;
      }
      try {
        const result = await executor.execute(req);
        if (result.success) return result;
        lastResult = result;
        if (!this.looksLikeCapacityFailure(result)) {
          // a genuine task failure — don't burn other providers repeating it
          return result;
        }
        this.log.warn("executor hit capacity/limit failure, trying next provider", {
          executor: executor.name,
        });
      } catch (err) {
        this.log.warn("executor threw, trying next provider", {
          executor: executor.name,
          error: (err as Error).message,
        });
        lastResult = {
          success: false,
          output: `${executor.name} failed: ${(err as Error).message}`,
          executor: executor.name,
        };
      }
    }

    return (
      lastResult ?? {
        success: false,
        output: `No executor available for '${req.kind}'. Verify the Claude CLI is installed or enable a fallback provider.`,
        executor: "router",
      }
    );
  }
}
