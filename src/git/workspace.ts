import { execCommand } from "../util/exec.js";
import type { Logger } from "../logging/logger.js";

export interface CheckpointInfo {
  hash: string;
  branch: string;
  message: string;
  createdAt: string;
}

export interface ChangeSummary {
  changedFiles: string[];
  diff: string;
  diffStat: string;
}

export class GitError extends Error {}

const CHECKPOINT_PREFIX = "[claude-bridge] checkpoint:";

/**
 * Git integration: checkpoints before each task, readable diffs after,
 * and rollback to any checkpoint.
 *
 * A checkpoint is a real commit (with --allow-empty) so it captures staged
 * and unstaged tracked changes and gives us a stable ref to diff/reset
 * against. Untracked files are added first so they are protected too.
 */
export class GitWorkspace {
  constructor(private readonly log: Logger) {}

  private async git(cwd: string, args: string[], timeoutMs = 60_000): Promise<string> {
    const res = await execCommand("git", args, { cwd, timeoutMs });
    if (res.exitCode !== 0) {
      throw new GitError(`git ${args.join(" ")} failed (${res.exitCode}): ${res.stderr.trim() || res.stdout.trim()}`);
    }
    return res.stdout;
  }

  async isRepo(cwd: string): Promise<boolean> {
    try {
      const out = await this.git(cwd, ["rev-parse", "--is-inside-work-tree"]);
      return out.trim() === "true";
    } catch {
      return false;
    }
  }

  async currentBranch(cwd: string): Promise<string> {
    const out = await this.git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
    return out.trim();
  }

  async checkoutBranch(cwd: string, branch: string): Promise<void> {
    // create the branch if it doesn't exist, otherwise switch to it
    const res = await execCommand("git", ["rev-parse", "--verify", `refs/heads/${branch}`], { cwd });
    if (res.exitCode === 0) {
      await this.git(cwd, ["checkout", branch]);
    } else {
      await this.git(cwd, ["checkout", "-b", branch]);
    }
  }

  /** Commit everything (allow-empty) so we have a stable pre-task ref. */
  async createCheckpoint(cwd: string, label: string): Promise<CheckpointInfo> {
    if (!(await this.isRepo(cwd))) {
      throw new GitError(`Not a git repository: ${cwd}. Run 'git init' first — checkpoints are mandatory.`);
    }
    const branch = await this.currentBranch(cwd);
    const message = `${CHECKPOINT_PREFIX} ${label.slice(0, 120)}`;
    await this.git(cwd, ["add", "-A"]);
    await this.git(cwd, [
      "-c", "user.name=claude-bridge",
      "-c", "user.email=claude-bridge@localhost",
      "commit", "--allow-empty", "--no-verify", "-m", message,
    ]);
    const hash = (await this.git(cwd, ["rev-parse", "HEAD"])).trim();
    this.log.info("checkpoint created", { hash, branch });
    return { hash, branch, message, createdAt: new Date().toISOString() };
  }

  /** Summarize everything that changed since a checkpoint (staged + unstaged + untracked). */
  async summarizeChanges(cwd: string, sinceRef: string): Promise<ChangeSummary> {
    // stage everything temporarily so untracked files show up in the diff...
    await this.git(cwd, ["add", "-A"]);
    const diff = await this.git(cwd, ["diff", "--cached", sinceRef], 120_000);
    const diffStat = await this.git(cwd, ["diff", "--cached", "--stat", sinceRef]);
    const names = await this.git(cwd, ["diff", "--cached", "--name-only", sinceRef]);
    // ...then unstage again so the working tree is exactly as the task left it
    await this.git(cwd, ["reset", "--quiet"]);
    return {
      changedFiles: names.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
      diff,
      diffStat: diffStat.trim(),
    };
  }

  /** Hard-reset the working tree back to a checkpoint. */
  async rollback(cwd: string, checkpointHash: string): Promise<void> {
    const message = (await this.git(cwd, ["log", "-1", "--format=%s", checkpointHash])).trim();
    if (!message.startsWith(CHECKPOINT_PREFIX)) {
      throw new GitError(
        `Refusing to roll back: ${checkpointHash} is not a claude-bridge checkpoint commit.`,
      );
    }
    await this.git(cwd, ["reset", "--hard", checkpointHash]);
    await this.git(cwd, ["clean", "-fd"]);
    this.log.warn("rolled back to checkpoint", { checkpointHash });
  }

  /** List recent claude-bridge checkpoints on the current branch. */
  async listCheckpoints(cwd: string, limit = 10): Promise<{ hash: string; message: string }[]> {
    const out = await this.git(cwd, [
      "log", `--grep=${CHECKPOINT_PREFIX}`, "--fixed-strings", `-n`, String(limit), "--format=%H\t%s",
    ]);
    return out
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [hash, ...rest] = line.split("\t");
        return { hash: hash ?? "", message: rest.join("\t") };
      });
  }

  async statusPorcelain(cwd: string): Promise<string[]> {
    const out = await this.git(cwd, ["status", "--porcelain"]);
    return out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }
}
