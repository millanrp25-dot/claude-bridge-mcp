import fs from "node:fs";
import path from "node:path";
import { execCommand } from "../util/exec.js";
import type { Logger } from "../logging/logger.js";

export interface TestRunResult {
  framework: string;
  installRan: boolean;
  installOk: boolean;
  command: string;
  exitCode: number | null;
  passed: boolean;
  timedOut: boolean;
  durationMs: number;
  summary: string;
  outputTail: string;
}

interface DetectedRunner {
  framework: string;
  install?: { cmd: string; args: string[] };
  needsInstall?: (cwd: string) => boolean;
  test: { cmd: string; args: string[] };
}

const OUTPUT_TAIL_CHARS = 8_000;

function hasFile(cwd: string, name: string): boolean {
  return fs.existsSync(path.join(cwd, name));
}

// npm & friends are .cmd shims on Windows; spawn without shell needs the real name
const winCmd = (cmd: string) =>
  process.platform === "win32" && ["npm", "pnpm", "yarn", "bun"].includes(cmd) ? `${cmd}.cmd` : cmd;

export function detectRunner(cwd: string): DetectedRunner | null {
  if (hasFile(cwd, "package.json")) {
    const nodeNeedsInstall = (c: string) => !fs.existsSync(path.join(c, "node_modules"));
    if (hasFile(cwd, "pnpm-lock.yaml")) {
      return {
        framework: "node/pnpm",
        install: { cmd: winCmd("pnpm"), args: ["install", "--frozen-lockfile"] },
        needsInstall: nodeNeedsInstall,
        test: { cmd: winCmd("pnpm"), args: ["test"] },
      };
    }
    if (hasFile(cwd, "yarn.lock")) {
      return {
        framework: "node/yarn",
        install: { cmd: winCmd("yarn"), args: ["install", "--frozen-lockfile"] },
        needsInstall: nodeNeedsInstall,
        test: { cmd: winCmd("yarn"), args: ["test"] },
      };
    }
    if (hasFile(cwd, "bun.lockb") || hasFile(cwd, "bun.lock")) {
      return {
        framework: "node/bun",
        install: { cmd: winCmd("bun"), args: ["install"] },
        needsInstall: nodeNeedsInstall,
        test: { cmd: winCmd("bun"), args: ["test"] },
      };
    }
    return {
      framework: "node/npm",
      install: {
        cmd: winCmd("npm"),
        args: hasFile(cwd, "package-lock.json") ? ["ci"] : ["install"],
      },
      needsInstall: nodeNeedsInstall,
      test: { cmd: winCmd("npm"), args: ["test"] },
    };
  }
  if (
    hasFile(cwd, "pytest.ini") ||
    hasFile(cwd, "pyproject.toml") ||
    hasFile(cwd, "setup.py") ||
    fs.existsSync(path.join(cwd, "tests"))
  ) {
    return { framework: "python/pytest", test: { cmd: "python", args: ["-m", "pytest", "-q"] } };
  }
  if (hasFile(cwd, "Cargo.toml")) {
    return { framework: "rust/cargo", test: { cmd: "cargo", args: ["test"] } };
  }
  if (hasFile(cwd, "go.mod")) {
    return { framework: "go", test: { cmd: "go", args: ["test", "./..."] } };
  }
  return null;
}

function summarize(framework: string, output: string): string {
  const patterns: RegExp[] = [
    /Tests?:.*$/m,                       // jest / vitest
    /\d+ pass(?:ed|ing).*$/m,            // mocha / generic
    /=+ .*(passed|failed|error).* =+/m,  // pytest
    /test result: .*$/m,                 // cargo
    /^(ok|FAIL)\s+\S+.*$/m,              // go
  ];
  for (const re of patterns) {
    const m = output.match(re);
    if (m) return m[0].trim();
  }
  return output.trim().split(/\r?\n/).slice(-3).join(" | ").slice(0, 300);
}

/**
 * Detect the package manager / test framework, install dependencies if
 * missing, run the project tests, and return a structured result.
 */
export class TestRunner {
  constructor(private readonly log: Logger) {}

  async run(cwd: string, timeoutMs: number): Promise<TestRunResult> {
    const started = Date.now();
    const runner = detectRunner(cwd);
    if (!runner) {
      return {
        framework: "unknown",
        installRan: false,
        installOk: true,
        command: "",
        exitCode: null,
        passed: false,
        timedOut: false,
        durationMs: Date.now() - started,
        summary: "No supported test framework detected (node/python/rust/go).",
        outputTail: "",
      };
    }

    let installRan = false;
    let installOk = true;
    if (runner.install && runner.needsInstall?.(cwd)) {
      installRan = true;
      this.log.info("installing dependencies", { framework: runner.framework, cwd });
      const inst = await execCommand(runner.install.cmd, runner.install.args, {
        cwd,
        timeoutMs: Math.min(timeoutMs, 600_000),
      });
      installOk = inst.exitCode === 0;
      if (!installOk) {
        return {
          framework: runner.framework,
          installRan,
          installOk,
          command: `${runner.install.cmd} ${runner.install.args.join(" ")}`,
          exitCode: inst.exitCode,
          passed: false,
          timedOut: inst.timedOut,
          durationMs: Date.now() - started,
          summary: "Dependency installation failed.",
          outputTail: (inst.stdout + "\n" + inst.stderr).slice(-OUTPUT_TAIL_CHARS),
        };
      }
    }

    this.log.info("running tests", { framework: runner.framework, cwd });
    const res = await execCommand(runner.test.cmd, runner.test.args, {
      cwd,
      timeoutMs,
      env: { CI: "1" },
    });
    const output = res.stdout + "\n" + res.stderr;
    return {
      framework: runner.framework,
      installRan,
      installOk,
      command: `${runner.test.cmd} ${runner.test.args.join(" ")}`,
      exitCode: res.exitCode,
      passed: res.exitCode === 0,
      timedOut: res.timedOut,
      durationMs: Date.now() - started,
      summary: summarize(runner.framework, output),
      outputTail: output.slice(-OUTPUT_TAIL_CHARS),
    };
  }
}
