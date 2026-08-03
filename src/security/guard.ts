import fs from "node:fs";
import path from "node:path";
import type { BridgeConfig, ApprovalMode } from "../config/schema.js";

export interface PolicyCheck {
  /** Patterns from blocked_commands that matched the task text. */
  matches: string[];
  requiresApproval: boolean;
}

export class SecurityError extends Error {}

/**
 * Enforces the two hard boundaries of the bridge:
 *  1. execution only inside approved project folders
 *  2. dangerous operations require explicit approval
 */
export class SecurityGuard {
  private readonly blocked: RegExp[];

  constructor(private readonly config: BridgeConfig) {
    this.blocked = config.blocked_commands.map((p) => new RegExp(p, "i"));
  }

  /**
   * Resolve a project path and verify it is inside an approved project.
   * Uses realpath to defeat symlink and `..` traversal tricks.
   */
  assertTrustedProject(projectPath: string): string {
    const resolved = path.resolve(projectPath);
    if (!fs.existsSync(resolved)) {
      throw new SecurityError(`Project path does not exist: ${resolved}`);
    }
    const real = fs.realpathSync.native(resolved);
    const ok = this.config.approved_projects.some((approved) => {
      let approvedReal: string;
      try {
        approvedReal = fs.realpathSync.native(approved);
      } catch {
        return false;
      }
      const rel = path.relative(approvedReal, real);
      return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
    });
    if (!ok) {
      throw new SecurityError(
        `Path is not inside an approved project: ${real}. Add it to approved_projects in config.yaml.`,
      );
    }
    return real;
  }

  /** Scan free-form task text against the blocked-command policy. */
  checkTask(taskText: string): PolicyCheck {
    const matches = this.blocked
      .map((re) => {
        const m = taskText.match(re);
        return m ? m[0] : null;
      })
      .filter((m): m is string => m !== null);
    return { matches, requiresApproval: matches.length > 0 };
  }

  /**
   * Resolve the effective approval mode for a task. Callers may request a
   * mode, but can never exceed what the config allows.
   */
  effectiveApprovalMode(requested?: ApprovalMode): ApprovalMode {
    const order: ApprovalMode[] = ["suggest", "auto-edit", "full-auto"];
    const configured = this.config.approval_mode;
    const req = requested ?? configured;
    const capped = order.indexOf(req) > order.indexOf(configured) ? configured : req;
    if (capped === "full-auto" && !this.config.allow_full_auto) return "auto-edit";
    return capped;
  }

  /** Clamp a requested timeout to the configured ceiling. */
  clampTimeout(requestedMs?: number): number {
    const wanted = requestedMs ?? this.config.default_timeout_ms;
    return Math.min(Math.max(wanted, 1_000), this.config.max_timeout_ms);
  }
}
