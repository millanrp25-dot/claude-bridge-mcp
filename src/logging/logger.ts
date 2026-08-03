import fs from "node:fs";
import path from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface LoggerOptions {
  dir: string;
  level: LogLevel;
  console: boolean;
  json: boolean;
  verbose: boolean;
  /** Redaction hook applied to every logged message and field. */
  sanitize?: (text: string) => string;
}

export interface LogEntry {
  ts: string;
  level: LogLevel;
  scope: string;
  msg: string;
  [key: string]: unknown;
}

/**
 * Structured logger with console (stderr) + JSON-lines file output.
 * stderr is used deliberately: stdout belongs to the MCP stdio transport.
 */
export class Logger {
  private readonly opts: LoggerOptions;
  private readonly scope: string;
  private stream: fs.WriteStream | null = null;
  private readonly recent: LogEntry[] = [];
  private readonly recentLimit = 500;

  constructor(opts: LoggerOptions, scope = "bridge", parent?: Logger) {
    this.opts = opts;
    this.scope = scope;
    if (parent) {
      this.stream = parent.stream;
      // share the ring buffer with the root logger so the dashboard sees everything
      this.recent = parent.recent;
    } else if (opts.json) {
      fs.mkdirSync(opts.dir, { recursive: true });
      const file = path.join(opts.dir, `bridge-${new Date().toISOString().slice(0, 10)}.jsonl`);
      this.stream = fs.createWriteStream(file, { flags: "a" });
    }
  }

  child(scope: string): Logger {
    return new Logger(this.opts, scope, this);
  }

  /** Most recent log entries (already sanitized) for the dashboard. */
  tail(limit = 100): LogEntry[] {
    return this.recent.slice(-limit);
  }

  debug(msg: string, fields?: Record<string, unknown>): void {
    this.log("debug", msg, fields);
  }
  info(msg: string, fields?: Record<string, unknown>): void {
    this.log("info", msg, fields);
  }
  warn(msg: string, fields?: Record<string, unknown>): void {
    this.log("warn", msg, fields);
  }
  error(msg: string, fields?: Record<string, unknown>): void {
    this.log("error", msg, fields);
  }

  log(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.opts.level]) return;
    const clean = this.opts.sanitize ?? ((t: string) => t);
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      scope: this.scope,
      msg: clean(msg),
    };
    if (fields) {
      for (const [k, v] of Object.entries(fields)) {
        if (!this.opts.verbose && (k === "stdout" || k === "stderr" || k === "command")) continue;
        entry[k] = typeof v === "string" ? clean(v) : v;
      }
    }
    this.recent.push(entry);
    if (this.recent.length > this.recentLimit) this.recent.shift();

    if (this.opts.console) {
      const extras = Object.keys(entry)
        .filter((k) => !["ts", "level", "scope", "msg"].includes(k))
        .map((k) => `${k}=${JSON.stringify(entry[k])}`)
        .join(" ");
      process.stderr.write(
        `[${entry.ts}] ${level.toUpperCase().padEnd(5)} ${this.scope}: ${entry.msg}${extras ? " " + extras : ""}\n`,
      );
    }
    this.stream?.write(JSON.stringify(entry) + "\n");
  }
}
