# Usage examples

These are the tool calls an MCP client (ChatGPT) makes, with abridged responses. You normally just talk to ChatGPT ("fix the failing test in my-app") and it drives these calls itself.

## 1. Check the bridge

```jsonc
// tool: status
{ }
```

```jsonc
{
  "success": true,
  "approved_projects": ["C:\\work\\my-app"],
  "executors": [
    { "name": "claude", "available": true, "code": true, "analysis": true },
    { "name": "ollama", "available": false, "code": false, "analysis": true }
  ],
  "pending_approvals": [],
  "usage_totals": { "tasks": 0, "inputTokens": 0, "outputTokens": 0, "costUsd": 0 }
}
```

## 2. Delegate a task

```jsonc
// tool: delegate_to_claude
{
  "project_path": "C:\\work\\my-app",
  "task": "The date formatting in src/utils/date.ts breaks for timezones east of UTC. Fix it and keep the public API unchanged.",
  "files": ["src/utils/date.ts", "tests/date.spec.ts"],
  "approval_mode": "auto-edit",
  "timeout_ms": 600000
}
```

```jsonc
{
  "success": true,
  "executor": "claude",
  "summary": "Replaced the manual UTC offset math with Intl.DateTimeFormat...",
  "checkpoint": "3f9c2ab...",
  "branch": "main",
  "changed_files": [
    { "file": "src/utils/date.ts", "sensitive": false },
    { "file": "tests/date.spec.ts", "sensitive": false }
  ],
  "diff_stat": "2 files changed, 41 insertions(+), 18 deletions(-)",
  "diff": "diff --git a/src/utils/date.ts ...",
  "usage": { "inputTokens": 24310, "outputTokens": 1892, "costUsd": 0.19, "turns": 9 },
  "next_steps": [
    "Call review_changes to get a code review of this diff.",
    "Call run_tests to verify the change.",
    "Call rollback_checkpoint with checkpoint \"3f9c2ab...\" if the change should be discarded."
  ]
}
```

## 3. Review the diff

```jsonc
// tool: review_changes
{ "project_path": "C:\\work\\my-app", "context": "timezone fix, public API must not change" }
```

```jsonc
{
  "success": true,
  "executor": "claude",
  "review": {
    "overall_quality": "good",
    "summary": "Correct approach; one edge case around DST transitions...",
    "bugs": [{ "file": "src/utils/date.ts", "issue": "DST boundary off-by-one when...", "severity": "medium" }],
    "security_issues": [],
    "performance_issues": [],
    "architecture_suggestions": ["Consider centralizing timezone constants"],
    "quality_notes": ["Test names could state the expected offset"]
  }
}
```

## 4. Run the tests

```jsonc
// tool: run_tests
{ "project_path": "C:\\work\\my-app" }
```

```jsonc
{
  "success": true,
  "framework": "node/npm",
  "command": "npm.cmd test",
  "install_ran": false,
  "exit_code": 0,
  "summary": "Tests: 84 passed, 84 total",
  "output_tail": "..."
}
```

## 5. Dangerous task → approval round-trip

```jsonc
// tool: delegate_to_claude
{ "project_path": "C:\\work\\my-app", "task": "delete the old build output: rm -rf dist and regenerate it" }
```

```jsonc
{
  "success": false,
  "reason": "Task matches blocked-operation policy (rm -rf) and requires explicit approval.",
  "approval_id": "7c0e...-...",
  "next_steps": [
    "Ask a human operator to approve via the approve_action tool with approval_id \"7c0e...\" (or the dashboard).",
    "Then retry delegate_to_claude with the same project_path and task, passing approval_id."
  ]
}
```

A human approves (dashboard button, or):

```jsonc
// tool: approve_action
{ "approval_id": "7c0e...", "decision": "approve", "decided_by": "milla" }
```

Then the retry with `"approval_id": "7c0e..."` executes. The token is single-use and bound to that exact project + task text.

## 6. Roll back

```jsonc
// tool: rollback_checkpoint
{ "project_path": "C:\\work\\my-app", "checkpoint": "3f9c2ab..." }
```

```jsonc
{
  "success": true,
  "restored_to": "3f9c2ab...",
  "note": "Working tree hard-reset to the checkpoint; untracked files created after it were removed."
}
```

## A good ChatGPT system prompt for the bridge

If you're wiring the bridge into a custom GPT, this instruction block works well:

> You can delegate coding work to a local Claude Code instance through MCP tools. Workflow: call `status` first to see project state; use `delegate_to_claude` with a precise, self-contained task description; then always `review_changes` and `run_tests` before declaring success. If a task returns `approval_id`, tell the user a human must approve it and wait. Never ask for `full-auto`. If tests fail, feed the failure output back into a new `delegate_to_claude` task. Use `rollback_checkpoint` when the user rejects a change.
