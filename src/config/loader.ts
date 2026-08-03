import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { configSchema, type BridgeConfig } from "./schema.js";

export class ConfigError extends Error {}

const CANDIDATES = ["config.yaml", "config.yml", "claude-bridge.yaml"];

export function resolveConfigPath(explicit?: string): string {
  if (explicit) {
    const p = path.resolve(explicit);
    if (!fs.existsSync(p)) throw new ConfigError(`Config file not found: ${p}`);
    return p;
  }
  for (const candidate of CANDIDATES) {
    const p = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(p)) return p;
  }
  throw new ConfigError(
    `No config file found. Copy config.example.yaml to config.yaml, or pass --config <path>.`,
  );
}

export function loadConfig(explicitPath?: string): BridgeConfig {
  const file = resolveConfigPath(explicitPath);
  let raw: unknown;
  try {
    raw = parseYaml(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new ConfigError(`Failed to parse ${file}: ${(err as Error).message}`);
  }
  const parsed = configSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new ConfigError(`Invalid config in ${file}:\n${issues}`);
  }
  const config = parsed.data;
  config.approved_projects = config.approved_projects.map((p) => path.resolve(p));
  return config;
}

/** Build a config object programmatically (used by tests). */
export function makeConfig(overrides: Partial<BridgeConfig> & { approved_projects: string[] }): BridgeConfig {
  const parsed = configSchema.parse(overrides);
  parsed.approved_projects = parsed.approved_projects.map((p) => path.resolve(p));
  return parsed;
}
