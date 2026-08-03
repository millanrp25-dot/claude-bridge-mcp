import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SecurityGuard, SecurityError } from "../../src/security/guard.js";
import { ApprovalQueue } from "../../src/security/approvals.js";
import { testConfig, silentLogger } from "../helpers.js";

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "guard-test-"));
}

describe("SecurityGuard project trust", () => {
  it("accepts approved projects and their subdirectories", () => {
    const approved = tempDir();
    const sub = path.join(approved, "packages", "core");
    fs.mkdirSync(sub, { recursive: true });
    const guard = new SecurityGuard(testConfig([approved]));
    expect(guard.assertTrustedProject(approved)).toBeTruthy();
    expect(guard.assertTrustedProject(sub)).toBeTruthy();
  });

  it("rejects paths outside approved projects", () => {
    const approved = tempDir();
    const outside = tempDir();
    const guard = new SecurityGuard(testConfig([approved]));
    expect(() => guard.assertTrustedProject(outside)).toThrow(SecurityError);
  });

  it("rejects ../ traversal escaping the approved root", () => {
    const approved = tempDir();
    const guard = new SecurityGuard(testConfig([approved]));
    const sneaky = path.join(approved, "..", path.basename(tempDir()));
    expect(() => guard.assertTrustedProject(sneaky)).toThrow(SecurityError);
  });

  it("rejects nonexistent paths", () => {
    const approved = tempDir();
    const guard = new SecurityGuard(testConfig([approved]));
    expect(() => guard.assertTrustedProject(path.join(approved, "nope"))).toThrow(SecurityError);
  });
});

describe("SecurityGuard command policy", () => {
  const guard = new SecurityGuard(testConfig([os.tmpdir()]));

  it.each([
    "please rm -rf node_modules and reinstall",
    "run sudo apt install foo",
    "commit and git push to origin",
    "deploy the app to production",
    "add OPENAI key to the .env file",
  ])("flags dangerous task: %s", (task) => {
    expect(guard.checkTask(task).requiresApproval).toBe(true);
  });

  it.each([
    "refactor the parser module and add unit tests",
    "fix the failing test in utils.spec.ts",
    "rename variable formData to payload",
  ])("allows benign task: %s", (task) => {
    expect(guard.checkTask(task).requiresApproval).toBe(false);
  });
});

describe("SecurityGuard approval-mode capping", () => {
  it("caps requested mode at the configured mode", () => {
    const guard = new SecurityGuard(testConfig([os.tmpdir()], { approval_mode: "auto-edit" }));
    expect(guard.effectiveApprovalMode("full-auto")).toBe("auto-edit");
    expect(guard.effectiveApprovalMode("suggest")).toBe("suggest");
  });

  it("never allows full-auto unless allow_full_auto is set", () => {
    const strict = new SecurityGuard(
      testConfig([os.tmpdir()], { approval_mode: "full-auto", allow_full_auto: false }),
    );
    expect(strict.effectiveApprovalMode("full-auto")).toBe("auto-edit");
    const permissive = new SecurityGuard(
      testConfig([os.tmpdir()], { approval_mode: "full-auto", allow_full_auto: true }),
    );
    expect(permissive.effectiveApprovalMode("full-auto")).toBe("full-auto");
  });

  it("clamps timeouts to the configured ceiling", () => {
    const guard = new SecurityGuard(
      testConfig([os.tmpdir()], { default_timeout_ms: 5_000, max_timeout_ms: 10_000 }),
    );
    expect(guard.clampTimeout()).toBe(5_000);
    expect(guard.clampTimeout(99_999)).toBe(10_000);
    expect(guard.clampTimeout(1)).toBe(1_000);
  });
});

describe("ApprovalQueue", () => {
  it("supports the request -> approve -> consume lifecycle", () => {
    const q = new ApprovalQueue(silentLogger());
    const item = q.request("/proj", "rm -rf dist", ["rm -rf"]);
    expect(q.pending()).toHaveLength(1);
    q.decide(item.id, true);
    expect(q.consume(item.id, "/proj", "rm -rf dist")).toBe(true);
    // single-use
    expect(q.consume(item.id, "/proj", "rm -rf dist")).toBe(false);
  });

  it("refuses consumption for a different project or task", () => {
    const q = new ApprovalQueue(silentLogger());
    const item = q.request("/proj", "rm -rf dist", ["rm -rf"]);
    q.decide(item.id, true);
    expect(q.consume(item.id, "/other", "rm -rf dist")).toBe(false);
  });

  it("denied approvals cannot be consumed", () => {
    const q = new ApprovalQueue(silentLogger());
    const item = q.request("/proj", "sudo thing", ["sudo"]);
    q.decide(item.id, false);
    expect(q.consume(item.id, "/proj", "sudo thing")).toBe(false);
  });

  it("rejects double decisions", () => {
    const q = new ApprovalQueue(silentLogger());
    const item = q.request("/proj", "sudo thing", ["sudo"]);
    q.decide(item.id, true);
    expect(() => q.decide(item.id, false)).toThrow(/already/);
  });
});
