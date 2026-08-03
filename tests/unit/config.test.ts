import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig, ConfigError, makeConfig } from "../../src/config/loader.js";

function writeConfig(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-test-"));
  const file = path.join(dir, "config.yaml");
  fs.writeFileSync(file, content);
  return file;
}

describe("config loader", () => {
  it("loads a minimal valid config and applies defaults", () => {
    const file = writeConfig(`approved_projects:\n  - ${os.tmpdir().replace(/\\/g, "/")}\n`);
    const config = loadConfig(file);
    expect(config.approval_mode).toBe("auto-edit");
    expect(config.allow_full_auto).toBe(false);
    expect(config.server.transport).toBe("stdio");
    expect(config.blocked_commands.length).toBeGreaterThan(0);
    expect(path.isAbsolute(config.approved_projects[0]!)).toBe(true);
  });

  it("rejects a config without approved_projects", () => {
    const file = writeConfig(`approval_mode: auto-edit\n`);
    expect(() => loadConfig(file)).toThrow(ConfigError);
  });

  it("rejects invalid enum values", () => {
    const file = writeConfig(
      `approved_projects: ["${os.tmpdir().replace(/\\/g, "/")}"]\napproval_mode: yolo\n`,
    );
    expect(() => loadConfig(file)).toThrow(/approval_mode/);
  });

  it("rejects a missing explicit path", () => {
    expect(() => loadConfig(path.join(os.tmpdir(), "does-not-exist.yaml"))).toThrow(ConfigError);
  });

  it("makeConfig produces a valid config for tests", () => {
    const config = makeConfig({ approved_projects: [os.tmpdir()] });
    expect(config.executors.priority).toContain("claude");
  });
});
