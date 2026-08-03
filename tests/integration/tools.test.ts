import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { delegateToClaude } from "../../src/tools/delegate.js";
import { reviewChanges } from "../../src/tools/review.js";
import { bridgeStatus } from "../../src/tools/status.js";
import { approveAction } from "../../src/tools/approve.js";
import { rollbackCheckpoint } from "../../src/tools/rollback.js";
import { makeTempRepo, rmDir, testHarness, type TestHarness } from "../helpers.js";

describe("tool pipeline (integration, mock executor + real git)", () => {
  let repo: string;
  let h: TestHarness;

  beforeEach(async () => {
    repo = await makeTempRepo();
    h = testHarness([repo]);
  });

  afterEach(() => {
    rmDir(repo);
  });

  it("delegate: creates a checkpoint, captures diff and changed files", async () => {
    h.mock.onExecute = (req) => {
      fs.writeFileSync(path.join(req.cwd!, "hello.txt"), "hello brave new world\n");
      fs.writeFileSync(path.join(req.cwd!, "new-file.ts"), "export const x = 1;\n");
    };

    const res = await delegateToClaude(h.ctx, {
      project_path: repo,
      task: "update greeting and add a module",
    });

    expect(res.success).toBe(true);
    expect(res.checkpoint).toMatch(/^[0-9a-f]{40}$/);
    const files = (res.changed_files as { file: string }[]).map((f) => f.file);
    expect(files).toContain("hello.txt");
    expect(files).toContain("new-file.ts");
    expect(String(res.diff)).toContain("brave new world");
    expect(h.mock.calls[0]!.kind).toBe("code");
    expect(h.mock.calls[0]!.cwd).toBe(h.ctx.guard.assertTrustedProject(repo));
  });

  it("delegate: rejects projects outside the approved list", async () => {
    const outsider = await makeTempRepo();
    try {
      await expect(
        delegateToClaude(h.ctx, { project_path: outsider, task: "do something" }),
      ).rejects.toThrow(/not inside an approved project/);
      expect(h.mock.calls).toHaveLength(0);
    } finally {
      rmDir(outsider);
    }
  });

  it("delegate: dangerous tasks require approval, then run once approved", async () => {
    const task = "clean up: rm -rf the dist folder and rebuild";
    const first = await delegateToClaude(h.ctx, { project_path: repo, task });
    expect(first.success).toBe(false);
    expect(first.approval_id).toBeTruthy();
    expect(h.mock.calls).toHaveLength(0); // nothing executed

    const approval = await approveAction(h.ctx, {
      approval_id: first.approval_id as string,
      decision: "approve",
    });
    expect(approval.success).toBe(true);

    const second = await delegateToClaude(h.ctx, {
      project_path: repo,
      task,
      approval_id: first.approval_id as string,
    });
    expect(second.success).toBe(true);
    expect(h.mock.calls).toHaveLength(1);

    // token is single-use
    const third = await delegateToClaude(h.ctx, {
      project_path: repo,
      task,
      approval_id: first.approval_id as string,
    });
    expect(third.success).toBe(false);
    expect(third.approval_id).not.toBe(first.approval_id);
  });

  it("delegate: denied approvals never execute", async () => {
    const task = "sudo systemctl restart nginx";
    const first = await delegateToClaude(h.ctx, { project_path: repo, task });
    await approveAction(h.ctx, { approval_id: first.approval_id as string, decision: "deny" });
    const retry = await delegateToClaude(h.ctx, {
      project_path: repo,
      task,
      approval_id: first.approval_id as string,
    });
    expect(retry.success).toBe(false);
    expect(h.mock.calls).toHaveLength(0);
  });

  it("delegate: secrets in the diff are sanitized", async () => {
    h.mock.onExecute = (req) => {
      fs.writeFileSync(path.join(req.cwd!, ".env"), "OPENAI_KEY=sk-proj-abc123def456ghi789jkl\n");
      fs.writeFileSync(path.join(req.cwd!, "app.ts"), 'const password = "supersecret999";\n');
    };
    const res = await delegateToClaude(h.ctx, { project_path: repo, task: "add config wiring" });
    const diff = String(res.diff);
    expect(diff).toContain("[diff withheld: sensitive file]");
    expect(diff).not.toContain("sk-proj-abc123");
    expect(diff).not.toContain("supersecret999");
    const files = res.changed_files as { file: string; sensitive: boolean }[];
    expect(files.find((f) => f.file === ".env")?.sensitive).toBe(true);
  });

  it("rollback: restores the checkpoint state", async () => {
    h.mock.onExecute = (req) => {
      fs.writeFileSync(path.join(req.cwd!, "hello.txt"), "broken change\n");
      fs.writeFileSync(path.join(req.cwd!, "junk.txt"), "junk\n");
    };
    const res = await delegateToClaude(h.ctx, { project_path: repo, task: "make a mess" });
    const rb = await rollbackCheckpoint(h.ctx, {
      project_path: repo,
      checkpoint: res.checkpoint as string,
    });
    expect(rb.success).toBe(true);
    expect(fs.readFileSync(path.join(repo, "hello.txt"), "utf8")).toBe("hello world\n");
    expect(fs.existsSync(path.join(repo, "junk.txt"))).toBe(false);
  });

  it("rollback: refuses non-checkpoint commits", async () => {
    await expect(
      rollbackCheckpoint(h.ctx, { project_path: repo, checkpoint: "HEAD" }),
    ).rejects.toThrow(/not a claude-bridge checkpoint/);
  });

  it("review: routes an analysis request and parses structured JSON", async () => {
    h.mock.nextResult = {
      success: true,
      output: JSON.stringify({
        overall_quality: "good",
        summary: "solid change",
        bugs: [],
        security_issues: [],
        performance_issues: [],
        architecture_suggestions: [],
        quality_notes: [],
      }),
    };
    const res = await reviewChanges(h.ctx, {
      diff: "diff --git a/x.ts b/x.ts\n+const a = 1;\n",
    });
    expect(res.success).toBe(true);
    expect((res.review as { overall_quality: string }).overall_quality).toBe("good");
    expect(h.mock.calls[0]!.kind).toBe("analysis");
  });

  it("status: reports project, executor health, approvals and history", async () => {
    await delegateToClaude(h.ctx, { project_path: repo, task: "small change" });
    const res = await bridgeStatus(h.ctx, { project_path: repo });
    expect(res.success).toBe(true);
    const project = res.project as { branch: string; is_git_repo: boolean };
    expect(project.is_git_repo).toBe(true);
    expect(project.branch).toBe("main");
    expect((res.executors as { name: string }[])[0]!.name).toBe("mock");
    expect((res.recent_tasks as unknown[]).length).toBeGreaterThan(0);
  });
});
