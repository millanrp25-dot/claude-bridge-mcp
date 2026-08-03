import { describe, it, expect } from "vitest";
import { Sanitizer } from "../../src/security/sanitizer.js";

const s = new Sanitizer();

describe("Sanitizer.redact", () => {
  it("redacts Anthropic-style keys", () => {
    const out = s.redact("key is sk-ant-api03-abcdefghijklmnop");
    expect(out).not.toContain("sk-ant-api03");
    expect(out).toContain("[REDACTED");
  });

  it("redacts AWS access keys", () => {
    expect(s.redact("AKIAIOSFODNN7EXAMPLE")).toContain("[REDACTED:aws-access-key]");
  });

  it("redacts GitHub tokens", () => {
    expect(s.redact("ghp_abcdefghijklmnopqrstuvwx1234567890")).toContain("[REDACTED:github-token]");
  });

  it("redacts private key blocks", () => {
    const pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA\n-----END RSA PRIVATE KEY-----";
    expect(s.redact(pem)).toBe("[REDACTED:private-key-block]");
  });

  it("redacts generic key=value assignments but keeps the key name", () => {
    const out = s.redact("API_KEY=supersecretvalue123");
    expect(out).toContain("API_KEY=");
    expect(out).not.toContain("supersecretvalue123");
  });

  it("leaves normal text alone", () => {
    const text = "refactored the parser and added tests";
    expect(s.redact(text)).toBe(text);
  });
});

describe("Sanitizer sensitive paths & diffs", () => {
  it("flags .env, keys, and credentials files", () => {
    for (const p of [".env", ".env.local", "config/.env.production", "id_rsa", "certs/server.pem", "secrets.yaml", ".npmrc"]) {
      expect(s.isSensitivePath(p), p).toBe(true);
    }
  });

  it("does not flag normal source files", () => {
    for (const p of ["src/index.ts", "environment.md", "envelope.py"]) {
      expect(s.isSensitivePath(p), p).toBe(false);
    }
  });

  it("withholds diff hunks that touch sensitive files", () => {
    const diff = [
      "diff --git a/src/app.ts b/src/app.ts",
      "index 111..222 100644",
      "--- a/src/app.ts",
      "+++ b/src/app.ts",
      "+console.log('ok')",
      "diff --git a/.env b/.env",
      "index 333..444 100644",
      "--- a/.env",
      "+++ b/.env",
      "+DB_PASSWORD=hunter2hunter2",
      "",
    ].join("\n");
    const out = s.sanitizeDiff(diff);
    expect(out).toContain("console.log('ok')");
    expect(out).toContain("[diff withheld: sensitive file]");
    expect(out).not.toContain("hunter2hunter2");
  });
});
