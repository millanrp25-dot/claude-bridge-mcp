import type http from "node:http";
import type { ToolContext } from "../tools/common.js";

/**
 * Lightweight local dashboard: running tasks, logs, token/cost totals,
 * recent executions, executor health, and the approval queue (with
 * approve/deny buttons hitting /api/approvals/decide).
 */
export async function dashboardApi(
  ctx: ToolContext,
  url: URL,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const json = (code: number, body: unknown) =>
    res.writeHead(code, { "content-type": "application/json" }).end(JSON.stringify(body));

  if (url.pathname === "/api/state" && req.method === "GET") {
    json(200, {
      running_tasks: ctx.store.runningTasks(),
      recent_tasks: ctx.store.history(25),
      usage_totals: ctx.store.usageTotals(),
      pending_approvals: ctx.approvals.pending(),
      executors: await ctx.router.health(),
      logs: ctx.log.tail(100),
    });
    return;
  }

  if (url.pathname === "/api/approvals/decide" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const { id, decision } = JSON.parse(body) as { id: string; decision: "approve" | "deny" };
      const item = ctx.approvals.decide(id, decision === "approve", "dashboard");
      json(200, { ok: true, approval: item });
    } catch (err) {
      json(400, { ok: false, error: (err as Error).message });
    }
    return;
  }

  json(404, { error: "unknown api route" });
}

export function renderDashboard(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>claude-bridge-mcp</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; background:#0d1117; color:#e6edf3; margin:0; padding:1.5rem; }
  h1 { font-size:1.2rem; margin:0 0 1rem; } h1 span { color:#7ee787; }
  h2 { font-size:.95rem; color:#8b949e; text-transform:uppercase; letter-spacing:.05em; margin:1.5rem 0 .5rem; }
  .grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); }
  .card { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:1rem; overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:.85rem; }
  td,th { text-align:left; padding:.3rem .5rem; border-bottom:1px solid #21262d; vertical-align:top; }
  .ok { color:#7ee787; } .bad { color:#f85149; } .warn { color:#d29922; }
  .pill { display:inline-block; padding:.1rem .5rem; border-radius:999px; font-size:.75rem; background:#21262d; }
  button { background:#238636; color:#fff; border:0; border-radius:6px; padding:.3rem .7rem; cursor:pointer; margin-right:.3rem; }
  button.deny { background:#da3633; }
  pre { font-size:.75rem; white-space:pre-wrap; word-break:break-all; margin:0; max-height:300px; overflow-y:auto; }
  .muted { color:#8b949e; }
</style>
</head>
<body>
<h1><span>●</span> claude-bridge-mcp dashboard</h1>
<div class="grid">
  <div class="card"><h2>Executor health</h2><table id="executors"></table></div>
  <div class="card"><h2>Usage totals</h2><table id="usage"></table></div>
  <div class="card"><h2>Approval queue</h2><div id="approvals" class="muted">none</div></div>
</div>
<h2>Running tasks</h2><div class="card"><table id="running"></table></div>
<h2>Recent executions</h2><div class="card"><table id="recent"></table></div>
<h2>Logs</h2><div class="card"><pre id="logs"></pre></div>
<script>
async function decide(id, decision) {
  await fetch('/api/approvals/decide', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({id, decision})});
  refresh();
}
function esc(s){const d=document.createElement('div');d.textContent=String(s??'');return d.innerHTML;}
async function refresh() {
  const r = await fetch('/api/state'); if (!r.ok) return;
  const s = await r.json();
  document.getElementById('executors').innerHTML =
    '<tr><th>executor</th><th>available</th><th>code</th><th>analysis</th></tr>' +
    s.executors.map(e => '<tr><td>'+esc(e.name)+'</td><td class="'+(e.available?'ok':'bad')+'">'+(e.available?'up':'down')+'</td><td>'+(e.code?'✔':'—')+'</td><td>'+(e.analysis?'✔':'—')+'</td></tr>').join('');
  const u = s.usage_totals;
  document.getElementById('usage').innerHTML =
    '<tr><td>tasks</td><td>'+u.tasks+'</td></tr><tr><td>input tokens</td><td>'+u.inputTokens+'</td></tr>' +
    '<tr><td>output tokens</td><td>'+u.outputTokens+'</td></tr><tr><td>est. cost</td><td>$'+u.costUsd.toFixed(4)+'</td></tr>';
  document.getElementById('approvals').innerHTML = s.pending_approvals.length === 0 ? '<span class="muted">none</span>' :
    s.pending_approvals.map(a => '<p><b>'+esc(a.task).slice(0,140)+'</b><br><span class="muted">'+esc(a.reasons.join(', '))+'</span><br>' +
      '<button onclick="decide(\\''+a.id+'\\',\\'approve\\')">approve</button><button class="deny" onclick="decide(\\''+a.id+'\\',\\'deny\\')">deny</button></p>').join('');
  const row = t => '<tr><td>'+esc(t.startedAt).slice(11,19)+'</td><td><span class="pill">'+esc(t.tool)+'</span></td><td>'+esc(t.task).slice(0,80)+'</td><td class="'+(t.status==='succeeded'?'ok':t.status==='failed'?'bad':'warn')+'">'+esc(t.status)+'</td><td class="muted">'+esc(t.executor||'')+'</td></tr>';
  document.getElementById('running').innerHTML = '<tr><th>started</th><th>tool</th><th>task</th><th>status</th><th>executor</th></tr>' + s.running_tasks.map(row).join('');
  document.getElementById('recent').innerHTML = '<tr><th>started</th><th>tool</th><th>task</th><th>status</th><th>executor</th></tr>' + s.recent_tasks.slice().reverse().map(row).join('');
  document.getElementById('logs').textContent = s.logs.map(l => l.ts+' '+l.level.toUpperCase()+' ['+l.scope+'] '+l.msg).join('\\n');
}
refresh(); setInterval(refresh, 3000);
</script>
</body>
</html>`;
}
