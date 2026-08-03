import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { makeConfig } from "../src/config/loader.js";
import { buildContainer } from "../src/container.js";
import { MockExecutor } from "../src/executors/mock.js";
import { ExecutorRouter } from "../src/executors/router.js";
import { Logger } from "../src/logging/logger.js";
import { execCommand } from "../src/util/exec.js";
import type { BridgeConfig } from "../src/config/schema.js";
import type { ToolContext } from "../src/tools/common.js";

export function silentLogger(): Logger {
  return new Logger({ dir: os.tmpdir(), level: "error", console: false, json: false, verbose: false });
}

export function testConfig(approved: string[], overrides: Partial<BridgeConfig> = {}): BridgeConfig {
  return makeConfig({
    approved_projects: approved,
    logging: { dir: os.tmpdir(), level: "error", console: false, json: false, verbose: false },
    ...overrides,
  } as Partial<BridgeConfig> & { approved_projects: string[] });
}

export interface TestHarness {
  ctx: ToolContext;
  mock: MockExecutor;
  config: BridgeConfig;
}

/** Container wired with a single mock executor. */
export function testHarness(approved: string[], overrides: Partial<BridgeConfig> = {}): TestHarness {
  const config = testConfig(approved, overrides);
  const log = silentLogger();
  const mock = new MockExecutor();
  const router = new ExecutorRouter([mock], log);
  const ctx = buildContainer(config, { router, log });
  return { ctx, mock, config };
}

/** Create a throwaway git repo with one committed file. */
export async function makeTempRepo(): Promise<string> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-test-"));
  const run = async (args: string[]) => {
    const res = await execCommand("git", args, { cwd: dir, timeoutMs: 30_000 });
    if (res.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${res.stderr}`);
  };
  await run(["init", "-b", "main"]);
  await run(["config", "core.autocrlf", "false"]);
  await run(["config", "user.email", "test@example.com"]);
  await run(["config", "user.name", "Test"]);
  fs.writeFileSync(path.join(dir, "hello.txt"), "hello world\n");
  await run(["add", "-A"]);
  await run(["commit", "-m", "initial"]);
  return dir;
}

export function rmDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* windows file locks — best effort */
  }
}
