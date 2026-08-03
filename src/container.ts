import type { BridgeConfig } from "./config/schema.js";
import { Logger } from "./logging/logger.js";
import { Sanitizer } from "./security/sanitizer.js";
import { SecurityGuard } from "./security/guard.js";
import { ApprovalQueue } from "./security/approvals.js";
import { GitWorkspace } from "./git/workspace.js";
import { StateStore } from "./state/store.js";
import { TestRunner } from "./testing/testRunner.js";
import { ClaudeExecutor } from "./executors/claude.js";
import { OpenAiExecutor } from "./executors/openai.js";
import { GeminiExecutor } from "./executors/gemini.js";
import { OllamaExecutor } from "./executors/ollama.js";
import { MockExecutor } from "./executors/mock.js";
import { ExecutorRouter } from "./executors/router.js";
import type { Executor } from "./executors/types.js";
import type { ToolContext } from "./tools/common.js";

/**
 * Composition root. All wiring happens here — every other module receives
 * its dependencies through constructor/parameter injection, which is what
 * makes the tool pipeline fully testable with the mock executor.
 */
export function buildContainer(
  config: BridgeConfig,
  overrides: Partial<Pick<ToolContext, "router" | "log">> = {},
): ToolContext {
  const sanitizer = new Sanitizer();
  const log =
    overrides.log ??
    new Logger({ ...config.logging, sanitize: (t) => sanitizer.redact(t) });

  const executorFactories: Record<string, () => Executor> = {
    claude: () => new ClaudeExecutor(config, log.child("claude")),
    openai: () => new OpenAiExecutor(config, log.child("openai")),
    gemini: () => new GeminiExecutor(config, log.child("gemini")),
    ollama: () => new OllamaExecutor(config, log.child("ollama")),
    mock: () => new MockExecutor(),
  };
  const executors = config.executors.priority
    .map((name) => executorFactories[name]?.())
    .filter((e): e is Executor => e !== undefined);

  const router = overrides.router ?? new ExecutorRouter(executors, log.child("router"));

  return {
    config,
    log,
    guard: new SecurityGuard(config),
    sanitizer,
    approvals: new ApprovalQueue(log.child("approvals")),
    git: new GitWorkspace(log.child("git")),
    router,
    store: new StateStore(),
    testRunner: new TestRunner(log.child("tests")),
  };
}
