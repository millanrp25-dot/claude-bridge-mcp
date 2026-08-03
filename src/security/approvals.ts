import { randomUUID } from "node:crypto";
import type { Logger } from "../logging/logger.js";

export type ApprovalStatus = "pending" | "approved" | "denied" | "consumed" | "expired";

export interface ApprovalRequest {
  id: string;
  createdAt: string;
  projectPath: string;
  task: string;
  reasons: string[];
  status: ApprovalStatus;
  decidedAt?: string;
  decidedBy?: string;
}

const APPROVAL_TTL_MS = 30 * 60 * 1000;

/**
 * In-memory approval queue for dangerous operations.
 *
 * Flow: delegate_to_claude detects a dangerous task -> creates a pending
 * approval and returns its id instead of executing. A human approves it via
 * the `approve_action` tool or the dashboard. The caller then retries the
 * task with approval_id set; the approval is consumed on use (single-shot).
 */
export class ApprovalQueue {
  private readonly items = new Map<string, ApprovalRequest>();

  constructor(private readonly log: Logger) {}

  request(projectPath: string, task: string, reasons: string[]): ApprovalRequest {
    const item: ApprovalRequest = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      projectPath,
      task,
      reasons,
      status: "pending",
    };
    this.items.set(item.id, item);
    this.log.warn("approval requested", { approvalId: item.id, reasons });
    return item;
  }

  decide(id: string, approve: boolean, decidedBy = "operator"): ApprovalRequest {
    const item = this.get(id);
    if (!item) throw new Error(`Unknown approval id: ${id}`);
    if (item.status !== "pending") {
      throw new Error(`Approval ${id} is already ${item.status}`);
    }
    item.status = approve ? "approved" : "denied";
    item.decidedAt = new Date().toISOString();
    item.decidedBy = decidedBy;
    this.log.info(`approval ${item.status}`, { approvalId: id, decidedBy });
    return item;
  }

  /**
   * Consume an approved token for a specific project+task. Returns true when
   * the token was valid; the token becomes unusable afterwards.
   */
  consume(id: string, projectPath: string, task: string): boolean {
    const item = this.get(id);
    if (!item || item.status !== "approved") return false;
    if (item.projectPath !== projectPath || item.task !== task) {
      this.log.warn("approval token did not match project/task", { approvalId: id });
      return false;
    }
    item.status = "consumed";
    return true;
  }

  get(id: string): ApprovalRequest | undefined {
    const item = this.items.get(id);
    if (item && item.status === "pending") {
      if (Date.now() - Date.parse(item.createdAt) > APPROVAL_TTL_MS) {
        item.status = "expired";
      }
    }
    return item;
  }

  pending(): ApprovalRequest[] {
    return [...this.items.values()].filter((i) => this.get(i.id)?.status === "pending");
  }

  all(): ApprovalRequest[] {
    return [...this.items.values()];
  }
}
