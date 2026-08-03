import { spawn } from "node:child_process";

export interface ExecOptions {
  cwd?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
  input?: string;
  maxBuffer?: number;
}

export interface ExecResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
}

const DEFAULT_MAX_BUFFER = 20 * 1024 * 1024;

/**
 * Spawn a command WITHOUT a shell (arguments are passed as an array, so no
 * shell-injection surface), capture output, and enforce a hard timeout that
 * kills the whole process tree on Windows.
 */
export function execCommand(
  command: string,
  args: string[],
  opts: ExecOptions = {},
): Promise<ExecResult> {
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const maxBuffer = opts.maxBuffer ?? DEFAULT_MAX_BUFFER;
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      windowsHide: true,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const kill = () => {
      if (child.pid == null) return;
      if (process.platform === "win32") {
        // kill the whole tree; child.kill() leaves grandchildren alive on Windows
        spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true });
      } else {
        try {
          child.kill("SIGKILL");
        } catch {
          /* already dead */
        }
      }
    };

    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, timeoutMs);

    child.stdout.on("data", (d: Buffer) => {
      if (stdout.length < maxBuffer) stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d: Buffer) => {
      if (stderr.length < maxBuffer) stderr += d.toString("utf8");
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        exitCode: code,
        stdout,
        stderr,
        timedOut,
        durationMs: Date.now() - started,
      });
    });

    if (opts.input != null) {
      child.stdin.write(opts.input);
    }
    child.stdin.end();
  });
}

/** Return true when a binary can be executed (used for availability checks). */
export async function binaryAvailable(binary: string, args = ["--version"]): Promise<boolean> {
  try {
    const res = await execCommand(binary, args, { timeoutMs: 10_000 });
    return res.exitCode === 0;
  } catch {
    return false;
  }
}
