import { describe, it, expect } from "vitest";
import { ExecutorRouter } from "../../src/executors/router.js";
import { MockExecutor } from "../../src/executors/mock.js";
import { silentLogger } from "../helpers.js";

describe("ExecutorRouter", () => {
  it("uses the first available executor", async () => {
    const first = new MockExecutor();
    const second = new MockExecutor();
    const router = new ExecutorRouter([first, second], silentLogger());
    const res = await router.execute({ kind: "code", prompt: "x", timeoutMs: 1000 });
    expect(res.success).toBe(true);
    expect(first.calls).toHaveLength(1);
    expect(second.calls).toHaveLength(0);
  });

  it("falls through when the first executor is unavailable", async () => {
    const first = new MockExecutor();
    first.available = false;
    const second = new MockExecutor();
    const router = new ExecutorRouter([first, second], silentLogger());
    const res = await router.execute({ kind: "analysis", prompt: "x", timeoutMs: 1000 });
    expect(res.success).toBe(true);
    expect(first.calls).toHaveLength(0);
    expect(second.calls).toHaveLength(1);
  });

  it("falls through on capacity/rate-limit failures", async () => {
    const first = new MockExecutor();
    first.nextResult = { success: false, output: "Claude usage limit reached, try later" };
    const second = new MockExecutor();
    const router = new ExecutorRouter([first, second], silentLogger());
    const res = await router.execute({ kind: "analysis", prompt: "x", timeoutMs: 1000 });
    expect(res.success).toBe(true);
    expect(res.executor).toBe("mock");
    expect(second.calls).toHaveLength(1);
  });

  it("does NOT retry genuine task failures on other providers", async () => {
    const first = new MockExecutor();
    first.nextResult = { success: false, output: "the task is impossible: file not found" };
    const second = new MockExecutor();
    const router = new ExecutorRouter([first, second], silentLogger());
    const res = await router.execute({ kind: "analysis", prompt: "x", timeoutMs: 1000 });
    expect(res.success).toBe(false);
    expect(second.calls).toHaveLength(0);
  });

  it("skips executors that don't support the request kind", async () => {
    const analysisOnly = new MockExecutor();
    Object.defineProperty(analysisOnly, "capabilities", {
      value: { code: false, analysis: true },
    });
    const router = new ExecutorRouter([analysisOnly], silentLogger());
    const res = await router.execute({ kind: "code", prompt: "x", timeoutMs: 1000 });
    expect(res.success).toBe(false);
    expect(res.output).toMatch(/No executor/);
    expect(analysisOnly.calls).toHaveLength(0);
  });

  it("returns a structured failure when everything is down", async () => {
    const only = new MockExecutor();
    only.available = false;
    const router = new ExecutorRouter([only], silentLogger());
    const res = await router.execute({ kind: "analysis", prompt: "x", timeoutMs: 1000 });
    expect(res.success).toBe(false);
    expect(res.output).toMatch(/No executor available/);
  });

  it("reports health for all executors", async () => {
    const up = new MockExecutor();
    const down = new MockExecutor();
    down.available = false;
    const router = new ExecutorRouter([up, down], silentLogger());
    const health = await router.health();
    expect(health).toHaveLength(2);
    expect(health[0]!.available).toBe(true);
    expect(health[1]!.available).toBe(false);
  });
});
