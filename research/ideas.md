# Ideas log

Every idea ever pitched or killed, so nothing is pitched twice. Newest run first.

## Run 2026-11-15

Constraints: B2B only, solo developer, 5–10 h/week, under $500, no crypto/web3, no gambling/adult.

Evidence base: 239 complaint records in `pains.csv`, nearly all from GitHub issues dated 2026-10-16 to 2026-11-15. Every quote below was string-checked against the issue body fetched from GitHub on 2026-11-15. Reaction and comment counts are as of that day.

Honest result: two ideas clear the 18/25 bar and the novelty test. The third scores highest on pain but fails the novelty test because a competitor already does part of it; it is listed as a near-miss.

---

### 1. Ringcheck — test each new coding-agent release against your team's setup before it reaches everyone

**Status:** pitched 2026-11-15. **Score: 18/25.**

**Gap.** Claude Code, Codex and Copilot ship several releases a week and auto-update. Teams that depend on hooks, managed settings and org-distributed MCP servers find out about a breaking release when something has silently stopped working. Vendors offer a "stable" channel and version pinning, but nothing tests a release against *your* configuration. Two searches for a release-gating or canary product for agent CLIs found none; the closest are a QA harness for sessions ([0xnyn/canary](https://github.com/0xnyn/canary)) and changelog blogs.

**Who has the pain.** The person who owns the coding-agent setup at a company with roughly 10–200 seats on a Team or Enterprise plan: platform or developer-experience engineer, or the technical founder. The moment: the day after an auto-update, when hooks or org MCP servers have quietly stopped working.

**Proof.**
1. "ours did for about 9 hours across 6 open sessions before we noticed" — @eurrag, 2026-10-22, on a hook that went silent on Team orgs. https://github.com/anthropics/claude-code/issues/104236
2. "This is a production-blocking regression for our organization: none of our custom MCP servers can be authenticated in the GitHub Copilot app." — @brunodomenici, 2026-10-27 (👍7; sibling report 👍4 at https://github.com/github/app/issues/5089). https://github.com/github/app/issues/5115
3. "Users who turn off VS Code telemetry for privacy or policy reasons then lose that tooling without any explanation. In our case it looked like a broken MCP configuration." — @darander, 2026-11-10, worked on extension 2.1.310 and broke on 2.1.322. https://github.com/anthropics/claude-code/issues/108745

Also: user hook bypassed on first prompt on Team accounts (👍9, https://github.com/anthropics/claude-code/issues/103626); managed MCP servers never reach sessions "since 10-15 update … silent failure" (https://github.com/anthropics/claude-code/issues/102910); MCP server can't reconnect, "only a new session brings it back" (16 comments, https://github.com/anthropics/claude-code/issues/103001).

**Pain score.** Frequency 4 (about 11 distinct people across three vendors' clients in 30 days). Intensity 4 (production-blocking, security hooks silently off for hours). Willingness to pay 3 (they pay for Team/Enterprise seats; no one said "I'd pay" for this). Reachability 3 (named issue authors, but no single community). Buildability 4 (Claude Code only, as a GitHub Action).

**Closest competitors and why they miss.**
- Vendor release channels and minimum-version pinning: delay the update, don't test it against your config.
- [MCPJam](https://www.mcpjam.com/blog/mcp-client-changelog-august-2026): cross-client regression tests for people building MCP servers, not for teams running an agent fleet.
- [0xnyn/canary](https://github.com/0xnyn/canary): records and verifies agent sessions; not release gating.

**Pricing guess (estimate).** $49/month per organisation, flat. Anchors: Zest charges $49–$149 per workspace for team analytics, MCPWatch $19–$49 for monitoring. The buyer already spends $20–$125 per seat per month, so $49 is under one seat.

**MVP.**
- Core feature: a GitHub Action that runs on every new Claude Code release, installs that version, runs headless smoke prompts against the team's own settings, and asserts from the debug log that each expected hook fired, each expected MCP server connected, managed settings applied and deny rules still refuse. Posts a pass/fail to Slack with "safe to move to" or "pin at".
- Skip: Codex and Copilot, a dashboard, accounts and billing (take payment by Stripe link), automatic pinning.
- Stack: TypeScript, Node, GitHub Actions, one small hosted webhook for the release watcher.
- 14-day plan (about 20 hours):
  - Days 1–2: reproduce two of the issues above by hand with two pinned versions; write down the exact log lines that distinguish working from broken.
  - Days 3–6: the check runner (config file listing expected hooks, MCP servers, deny rules; parse the debug log; exit code and report).
  - Days 7–9: GitHub Action wrapper and release watcher that triggers it.
  - Days 10–11: Slack report and a README with a five-minute setup.
  - Days 12–14: install it for two outside teams for free and fix what breaks.

**First 10 customers.** The authors of the issues above and their siblings: @eurrag, @zaphod72, @darander, @liaomupei-wq, @melbis, @brunodomenici, @yirmio, plus authors of new regression reports each week (search claude-code issues for "since" + a version number). Reply in their issue thread or contact them through their GitHub profile.

Message: "I saw your report about [hook X going silent after 2.1.3xx]. I'm building a small GitHub Action that runs each new Claude Code release against a team's own hooks, managed settings and MCP servers and says pass or fail before the fleet updates. Would it have caught this for you? Happy to set it up on your repo for free in exchange for 15 minutes of feedback."

**Biggest risk and cheapest test.** Risk: teams feel the pain for a day, pin a version and move on, so nobody pays monthly. Test this week: send the message above to 10 issue authors. If fewer than 3 want it installed, drop it.

**WHAT WOULD KILL THIS IDEA?**
- Anthropic ships a "test this release against my org config" command or staged rollout rings for Team plans.
- The checks can't run in CI because the failures only appear when signed in to a Team org (several of the reports depend on that); verify on days 1–2 before building anything else.
- Fewer than 3 of 10 contacted authors want a free install.
- Release quality improves and the reports dry up (the weekly run tracks this).

---

### 2. AuthProbe — a continuous sign-in check for remote MCP servers, per client

**Status:** pitched 2026-11-15. **Score: 18/25.**

**Gap.** Companies that run a remote MCP server learn that sign-in is broken from angry users, and the cause is often a specific client's OAuth behaviour (a new `prompt` parameter, a scope sent on refresh, a tenant setting). Existing monitors check the handshake and tool list without signing in. Existing OAuth debuggers are interactive tools for development. Nothing found runs the OAuth flow on a schedule, per client profile, and alerts on a break.

**Who has the pain.** The engineer who owns a remote MCP server at a SaaS company, or an internal platform team hosting MCP servers behind an enterprise identity provider. The moment: a client update or an identity-provider change breaks sign-in for everyone at once.

**Proof.**
1. "I can't authenticate to the Atlassian MCP server from any client I tried. The OAuth flow never finishes, so the server stays at "Needs authentication" and I can't use any tool." — @diogosgrott, 2026-10-21 (👍131, 119 comments). https://github.com/atlassian/atlassian-mcp-server/issues/281
2. "the user has to go through the full authorization flow again each time the access token expires" — @johncaruso, 2026-10-29, on refresh failing against a Salesforce-hosted server. https://github.com/modelcontextprotocol/rust-sdk/issues/1408
3. "When OAuth fails in the CLI or mcpdo, the user sees only the final error." — @CloneOfAlex, 2026-10-29; the stated workaround is an intercepting proxy. https://github.com/modelcontextprotocol/inspector/issues/2844

Also: Entra single-tenant apps force re-auth every session, "there is no client-side workaround" (https://github.com/github/copilot-cli/issues/5402); a team fronting GitHub Enterprise Server with a home-built OAuth proxy (https://github.com/github/github-mcp-server/issues/3677); the PingFederate regression in idea 1 (https://github.com/github/app/issues/5115).

**Pain score.** Frequency 4 (about 32 distinct people in the OAuth theme, half of them on one thread). Intensity 4 (server unusable until fixed). Willingness to pay 3 (operators are companies; no explicit "I'd pay"). Reachability 4 (operators are identifiable from issue threads and public server lists). Buildability 3 (OAuth flows need a test account and per-client quirks need upkeep).

**Closest competitors and why they miss.**
- [MCPJam](https://www.mcpjam.com/blog/mcp-client-changelog-august-2026): OAuth debugging and cross-client comparison with CI integration, aimed at development time. Closest threat; could add scheduled production checks.
- [MCPWatch](https://mcpwatch.app/) ($0 / $19 / $49 per month, waitlist): handshake and tool-schema monitoring, no sign-in.
- MCP Inspector: step-by-step OAuth view, manual only.
- MCP Server Check and similar passive checkers: one unauthenticated request, never send a token.

**Pricing guess (estimate).** $29/month for one server, $99/month for five, priced just above MCPWatch because it tests the part that actually breaks.

**MVP.**
- Core feature: a command-line check you point at a server URL. It walks discovery, client registration, the authorize request and (with a test account's refresh token) token exchange and refresh, under three named client profiles that reproduce documented quirks. It prints which step failed and why. A scheduled wrapper runs it every 15 minutes and alerts by email or Slack.
- Skip: browser automation of login pages, a dashboard, more than three client profiles.
- Stack: TypeScript, Node, a cron on a small VPS or GitHub Actions schedule.
- 14-day plan (about 20 hours):
  - Days 1–3: reproduce the Salesforce refresh-scope failure and the `prompt=select_account` failure from the issues against a test server.
  - Days 4–8: the checker with three profiles and step-by-step output.
  - Days 9–11: scheduled runs and alerts.
  - Days 12–14: run it free against three public servers with the owners' consent and send them the report.

**First 10 customers.** Server operators from the threads above (@brunodomenici, @johncaruso, @jloeffelholz, @Anika-Sol), and the vendors who posted onboarding requests in github/github-mcp-server discussions (at least 18 in the window), since each runs a production remote server.

Message: "I ran a sign-in check against [server] emulating three MCP clients. [Client] fails at [step] because [reason]. I'm building a monitor that runs this every 15 minutes and alerts you before users do. Want the full report?"

**Biggest risk and cheapest test.** Risk: the largest incident in the evidence (Atlassian) was a server-side outage that ordinary uptime monitoring would also catch, so the client-specific part may be too rare to pay for monthly. Test this week: hand-run the check against five public servers and send the owners the result. If none reply, drop it.

**WHAT WOULD KILL THIS IDEA?**
- MCPJam (or an auth vendor such as WorkOS or Stytch) ships scheduled production OAuth checks.
- Client quirks change faster than one person can keep the profiles current at 5–10 h/week.
- Zero replies from five operators who were sent a free, specific failure report.
- The spec's move away from dynamic client registration removes most of the breakage.

---

### 3. Headroom — warn a team before a developer's coding-agent seat runs out (NEAR-MISS)

**Status:** near-miss 2026-11-15. **Pain score: 20/25, but fails the novelty test.**

**Why it is a near-miss.** This is the loudest pain of the night, and a product already covers part of it: [Zest](https://meetzest.com/) (free for 3 seats, $49 and $149 per month tiers) says it records the five-hour and weekly limit use reported by each Claude Code session. The remaining gap is narrow: alerts and forecasts ("this person will be locked out by Thursday"), surfaces the status line does not cover, and Codex. Anthropic could also close it by exposing the number to admins.

**Gap.** Team and Enterprise admins cannot see how much of each seat's five-hour and weekly limit is used, so a developer hits 100% with days left and work stops. Anthropic's analytics show spend and adoption, not limit headroom.

**Who has the pain.** The admin of a 5–100 seat Claude Team or Enterprise plan (engineering manager, founder, platform engineer). The moment: a developer is locked out for most of a week, or the team is deciding who needs a premium seat.

**Proof.**
1. "no way for admins to see **how much of each user's plan usage limit (5-hour session / weekly) is consumed**." and "We built a workaround: a managed `statusLine` command that POSTs those values to our collector." — @albion1127, 2026-10-22. https://github.com/anthropics/claude-code/issues/104262
2. "The next weekly reset is November 11, 2026, at 3:30 AM, leaving almost six days without further included weekly usage." — @Tinusha97, 2026-11-05, Team plan (👍5, 12 comments). https://github.com/anthropics/claude-code/issues/107390
3. "On Claude Max (20x), the weekly "all models" meter went from 0% to 54% in the first 22 hours after the weekly reset." — @EthanRCT, 2026-10-19 (👍16, 18 comments, eight sibling issues). https://github.com/anthropics/claude-code/issues/103376

Also on Codex: "67 percentage points in 38 seconds" (👍43, 47 comments, https://github.com/openai/codex/issues/54677).

**Pain score.** Frequency 5 (22+ people on Claude Code, 22 on Codex). Intensity 4 (paid seat unusable for days). Willingness to pay 3. Reachability 4. Buildability 4 (the status line payload already carries the percentages).

**Closest competitors.** Zest (above). Single-user meters: ccusage, Claude Code Usage Monitor. Anthropic's own analytics: spend per user, no limit headroom.

**Pricing guess (estimate).** $29/month per team; it would have to undercut Zest's $49 tier as a single-purpose tool.

**MVP if pursued.** A managed status-line script that posts each seat's percentages to a small collector, plus a daily Slack message listing seats above 80% and a forecast of who runs out before reset. Skip dashboards. About 15 hours.

**Cheapest test.** Sign up for Zest's free tier and check whether it already alerts on headroom. If it does, kill this permanently.

**WHAT WOULD KILL THIS IDEA?**
- Zest already alerts on headroom (check first).
- Anthropic ships the metric in @albion1127's request, which is a small change on their side.
- The status-line route misses the Desktop app and VS Code panel, which @albion1127 says is about half of their active users.

---

## Killed this run

| Idea | Why killed |
|---|---|
| Hard spend cap for headless agent runs | Claude Code already has `--max-budget-usd`; gateways such as AIControls and Nirmata sell per-user caps. |
| "List my MCP server everywhere" service | [submitmcp.com](https://submitmcp.com/) and several guides exist; the real bottleneck (vendor verification queues) can't be fixed by a third party. |
| MCP uptime and schema monitoring | MCPWatch, mymcptools, DevHelm, mcpbeat already do it. |
| Approval inbox for headless agents | Crowded, and vendors ship native mobile approvals. |
| Secret and egress scanning of agent transcripts | Security sale a solo part-timer can't make; GitGuardian and gateway vendors are funded for it. |
| Spend reconciliation for LLM gateways | Funded FinOps vendors cover provider billing. |
| Policy packs for Team plans without Enterprise | 16/25; one release from the vendor closes it. |
| One-click MCP install page | The blocking step is inside each client and can't be fixed from outside. |
| Per-subagent cost visibility | Feature the vendor will ship. |

## Recurring pains to track

First run, so nothing recurs yet. Themes to compare next week: opaque usage meters, client-update regressions, MCP OAuth breakage, publisher verification queue, gateway budgets that don't enforce.
