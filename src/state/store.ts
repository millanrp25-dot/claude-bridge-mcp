import { randomUUID } from "node:crypto";
import type { ExecutionUsage } from "../executors/types.js";

export interface TaskRecord {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "succeeded" | "failed" | "awaiting-approval";
  tool: string;
  projectPath?: string;
  task: string;
  executor?: string;
  checkpointHash?: string;
  changedFiles?: string[];
  usage?: ExecutionUsage;
  error?: string;
}

export interface UsageTotals {
  tasks: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/**
 * In-memory session state: task history, last checkpoint per project, and
 * accumulated usage. Feeds the `status` tool and the dashboard.
 */
export class StateStore {
  private readonly tasks: TaskRecord[] = [];
  private readonly lastCheckpoint = new Map<string, string>();
  private readonly historyLimit = 200;

  startTask(fields: Omit<TaskRecord, "id" | "startedAt" | "status">): TaskRecord {
    const record: TaskRecord = {
      id: randomUUID(),
      startedAt: new Date().toISOString(),
      status: "running",
      ...fields,
    };
    this.tasks.push(record);
    if (this.tasks.length > this.historyLimit) this.tasks.shift();
    return record;
  }

  finishTask(
    id: string,
    status: TaskRecord["status"],
    updates: Partial<TaskRecord> = {},
  ): void {
    const record = this.tasks.find((t) => t.id === id);
    if (!record) return;
    record.status = status;
    record.finishedAt = new Date().toISOString();
    Object.assign(record, updates);
  }

  setCheckpoint(projectPath: string, hash: string): void {
    this.lastCheckpoint.set(projectPath, hash);
  }

  getCheckpoint(projectPath: string): string | undefined {
    return this.lastCheckpoint.get(projectPath);
  }

  latestTask(projectPath?: string): TaskRecord | undefined {
    const list = projectPath
      ? this.tasks.filter((t) => t.projectPath === projectPath)
      : this.tasks;
    return list[list.length - 1];
  }

  runningTasks(): TaskRecord[] {
    return this.tasks.filter((t) => t.status === "running");
  }

  history(limit = 20): TaskRecord[] {
    return this.tasks.slice(-limit);
  }

  usageTotals(): UsageTotals {
    return this.tasks.reduce<UsageTotals>(
      (acc, t) => {
        acc.tasks += 1;
        acc.inputTokens += t.usage?.inputTokens ?? 0;
        acc.outputTokens += t.usage?.outputTokens ?? 0;
        acc.costUsd += t.usage?.costUsd ?? 0;
        return acc;
      },
      { tasks: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 },
    );
  }
}
