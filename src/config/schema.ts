import { z } from "zod";

export const approvalModeSchema = z.enum(["suggest", "auto-edit", "full-auto"]);
export type ApprovalMode = z.infer<typeof approvalModeSchema>;

export const configSchema = z.object({
  approved_projects: z.array(z.string().min(1)).min(1),
  approval_mode: approvalModeSchema.default("auto-edit"),
  allow_full_auto: z.boolean().default(false),
  default_timeout_ms: z.number().int().positive().default(600_000),
  max_timeout_ms: z.number().int().positive().default(1_800_000),
  blocked_commands: z
    .array(z.string())
    .default([
      "\\brm\\s+-rf?\\b",
      "\\bsudo\\b",
      "\\bgit\\s+push\\b",
      "\\bdeploy(ment)?\\b",
      "\\bnpm\\s+publish\\b",
      "\\b(set|export)\\s+\\w+=",
      "\\.env\\b",
      "\\bssh-?key",
    ]),
  allowed_commands: z.array(z.string()).default(["Read", "Edit", "Write", "Grep", "Glob"]),
  claude: z
    .object({
      binary: z.string().default("claude"),
      model: z.string().nullable().default(null),
      max_turns: z.number().int().positive().default(40),
    })
    .default({}),
  executors: z
    .object({
      priority: z
        .array(z.enum(["claude", "openai", "gemini", "ollama", "mock"]))
        .default(["claude"]),
      openai: z
        .object({
          enabled: z.boolean().default(false),
          model: z.string().default("gpt-4o"),
          api_key_env: z.string().default("OPENAI_API_KEY"),
          base_url: z.string().default("https://api.openai.com/v1"),
        })
        .default({}),
      gemini: z
        .object({
          enabled: z.boolean().default(false),
          model: z.string().default("gemini-1.5-pro"),
          api_key_env: z.string().default("GEMINI_API_KEY"),
        })
        .default({}),
      ollama: z
        .object({
          enabled: z.boolean().default(false),
          model: z.string().default("qwen2.5-coder"),
          base_url: z.string().default("http://localhost:11434"),
        })
        .default({}),
    })
    .default({}),
  logging: z
    .object({
      dir: z.string().default("./logs"),
      level: z.enum(["debug", "info", "warn", "error"]).default("info"),
      console: z.boolean().default(true),
      json: z.boolean().default(true),
      verbose: z.boolean().default(false),
    })
    .default({}),
  server: z
    .object({
      transport: z.enum(["stdio", "http", "both"]).default("stdio"),
      http_port: z.number().int().positive().default(8765),
      dashboard: z.boolean().default(true),
    })
    .default({}),
});

export type BridgeConfig = z.infer<typeof configSchema>;
