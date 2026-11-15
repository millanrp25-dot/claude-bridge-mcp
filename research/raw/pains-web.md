# Pain mining (web): AI agent / developer tooling, B2B

- Collected: 2026-11-15. Target window: 2026-10-16 to 2026-11-15.
- Evidence only. No ideas proposed.

## How this was collected, and what that means for trust

- **Reddit: nothing.** WebSearch refuses `reddit.com` as an allowed domain ("not accessible to our user agent"), and open-web queries naming subreddits returned no Reddit pages. Zero Reddit records.
- **Hacker News:** search results only (WebFetch blocked; `hn.algolia.com` also unresolvable). The search tool returns a model-written summary, not raw comments, so almost all HN records are `paraphrase-from-search-summary`. HN dates are relative ages reported by the search tool ("about 11 days old") or inferred from item-id ordering; treat as approximate.
- **X:** search results only. Almost everything returned was older than the window. Dates were derived from the status ID (snowflake timestamp), not shown in results.
- **G2:** search results only; summaries of reviews and discussion threads, undated.
- **GitHub (issues and community discussions): the main in-window source.** Read with WebFetch on github.com. Dates, authors, counts are as the page showed them. Quotes marked `verbatim-in-search-result` are text the tool returned inside quotation marks as verbatim; note the tool extracts pages with a small model, so a quote could differ slightly from the page. Check the link before publishing any quote.
- Reaction/comment counts are as shown on the day of collection. "Comments" on list pages were unlabeled numbers that looked like comment counts.
- Money figures (for example "$9,364", "$10,000+") are the posters' own claims, unverified.

`quote_status` values: `verbatim-in-search-result` (exact words were returned as quoted text by the tool) or `paraphrase-from-search-summary` (no quotation marks used; wording is mine or the search summary's).

---

## Complaint records

### Theme A: subscription usage limits drain unpredictably; metering is opaque

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| A1 | 2026-10-19 | GitHub issue, anthropics/claude-code #103376 | https://github.com/anthropics/claude-code/issues/103376 | EthanRCT | "On Claude Max (20x), the weekly "all models" meter went from 0% to 54% in the first 22 hours after the weekly reset." Author reconciles usage by hand from local transcripts: "Token counts come from my local Claude Code transcripts (`~/.claude/projects/**/*.jsonl`, deduplicated by message ID and request ID, `<synthetic>` excluded)" | 16 👍, 18 comments | verbatim-in-search-result |
| A2 | 2026-10-22 | same thread | https://github.com/anthropics/claude-code/issues/103376 | justeff | "Last week I had parallel agents running 24/7 for multiple projects and barely hit 50%." | comment | verbatim-in-search-result |
| A3 | 2026-10-26 | GitHub issue, anthropics/claude-code #105240 | https://github.com/anthropics/claude-code/issues/105240 | Eth66 | "This means **94% of my Max 5x weekly allowance was consumed in less than 48 hours**, entirely by Claude Code." | 5 👍, 17 comments | verbatim-in-search-result |
| A4 | 2026-10-31 | same thread | https://github.com/anthropics/claude-code/issues/105240 | sascha-schaath | "I bought $100 of extra usage last week and it was consumed in about 3 hours with the same workload." | comment | verbatim-in-search-result |
| A5 | 2026-11-05 | GitHub issue, anthropics/claude-code #107390 | https://github.com/anthropics/claude-code/issues/107390 | Tinusha97 | "my entire weekly allowance was exhausted in approximately **30 hours and 31 minutes**, despite no intentional change to my development workflow." (Claude Team plan) | 5 👍, 12 comments | verbatim-in-search-result |
| A6 | 2026-11-05 / 11-09 | same thread | https://github.com/anthropics/claude-code/issues/107390 | OmarMahmoud2; sendikali | "Same issue here, Team plan Premium seat (I'm the org admin)." / "Could someone from Anthropic confirm whether this is an intended change to Team seats, and if so, what the weekly allowance is for a Premium seat?" | comments | verbatim-in-search-result |
| A7 | 2026-10-16 | GitHub issue, openai/codex #54677 | https://github.com/openai/codex/issues/54677 | EgorStepkin | "My remaining weekly quota later reached 6%, leaving development effectively blocked." (title: weekly quota jumped 67 points in 38 seconds) | 43 👍, ~47 comments | verbatim-in-search-result |
| A8 | 2026-10-16 / 10-18 / 10-20 | same thread | https://github.com/openai/codex/issues/54677 | nkosi23; AuricTW; 4EVRNYC | "Can confirm this, went from 35% to zero within seconds." / "I'm looking for reliable service at my subscription level, rather than repeated quota resets." / "I have not received an incident notification or corrective credits." | comments | verbatim-in-search-result |
| A9 | 2026-10-31 | GitHub issue, openai/codex #58530 | https://github.com/openai/codex/issues/58530 | HoshizoraArchive | "A shared allowance could let long agent or coding tasks exhaust the reasoning capacity needed to evaluate and direct them." (about a planned December 2026 merge of ChatGPT and Codex allowances on Plus) | 56 👍, ~27-32 comments | verbatim-in-search-result |
| A10 | 2026-11-01 | same thread | https://github.com/openai/codex/issues/58530 | tlsmx; Drexl | "I'll be canceling Plus and moving to separate providers." / "$100 might be better spent on Claude if these pools are getting combined and the usage not increased accordingly." | comments | verbatim-in-search-result |
| A11 | 2026-11-05 | GitHub community discussion #212119 | https://github.com/orgs/community/discussions/212119 | Caramel-Andrew | "My monthly usage allowance increased from 0% to approximately 75% within a single day of normal development work." (Copilot Pro; blames the "Fusion" model router picking one model). Reply by jpvignolo, 11-06: "I'm experiencing the exact same issue since Fusion replaced Auto." | 6 upvotes, 3 comments | verbatim-in-search-result |
| A12 | 2026-11-14 | GitHub community discussion #213140 | https://github.com/orgs/community/discussions/213140 | GeeckLance | "Within a very short time after activation, the account showed approximately 1,500 of 1,500 AI credits consumed." and "I opened a support ticket approximately 6 days ago but have not yet received a substantive response." | 2 upvotes, 1 comment | verbatim-in-search-result |
| A13 | 2026-11-04 | GitHub issue, anthropics/claude-agent-sdk-python #1470 | https://github.com/anthropics/claude-agent-sdk-python/issues/1470 | jyongchul | "Subscription sign-in with the Agent SDK appears to use the subscription allowance much faster than interactive Claude Code." and "Our headless sessions repeatedly hit the 5-hour session limit and stopped until reset (on 2026-11-02, 17 sessions at once)." | counts not shown | verbatim-in-search-result |
| A14 | 2026-10-16, 10-26, 10-28 | GitHub issue titles only (bodies not read): claude-code #102667, #105125, #105621 | https://github.com/anthropics/claude-code/issues/102667 ; https://github.com/anthropics/claude-code/issues/105125 ; https://github.com/anthropics/claude-code/issues/105621 | jihjun-ai; FixFips; ViktorGazsi | Three more separate reports, by title, of weekly limits draining much faster since mid-October with an unchanged workflow (Max plans). | 15, 5, 10 comments | paraphrase-from-search-summary |

### Theme B: runaway spend, no spend ceiling, hidden token overhead

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| B1 | 2026-11-04 | GitHub issue, anthropics/claude-code #107256 | https://github.com/anthropics/claude-code/issues/107256 | shaunrjenkins-cloud | "In headless scheduled runs (no human at the terminal) this ran for six days, October 22 to 28, 2026, and consumed about $9,364 of extra usage through repeated auto reload, on top of a Max plan with allowance unused." and "There is no per session or per run spend ceiling." | 7 comments | verbatim-in-search-result |
| B2 | 2026-11-07 | same thread | https://github.com/anthropics/claude-code/issues/107256 | vijaym2k6 | "A spend or turn ceiling enforced outside the agent (per session or per scheduled run, checked before each model call) would have stopped this at a small fraction of the cost whatever the hooks did." | comment | verbatim-in-search-result |
| B3 | 2026-10-29 | GitHub issue, anthropics/claude-code #105981 | https://github.com/anthropics/claude-code/issues/105981 | dblumenau | "Each request sends that agent's whole transcript to its own model so it can write a 3–5 word label for the agents panel." Later (11-03): "The env var is a working opt-out on 2.1.312, but it also turns off forked subagents." (Vendor later announced a fix on X, 2026-11-04: https://x.com/ClaudeDevs/status/2118063143167693011) | 9 👍, 4 comments | verbatim-in-search-result |
| B4 | 2026-10-27 | GitHub issue, anthropics/claude-code #105328 | https://github.com/anthropics/claude-code/issues/105328 | SaedMami | "A fresh session in the desktop app's Code tab starts with about 79k tokens in context before any real work. A terminal `claude` session with the same user config, connectors and plugins starts at about 13k." | 4 👍, 2 comments | verbatim-in-search-result |
| B5 | 2026-11-13 | same thread | https://github.com/anthropics/claude-code/issues/105328 | marcospgp | "The part that hurts most for us is subagents, since each one starts with the same tools loaded. We started 787 subagents in the last 30 days against 218 main sessions, so most of this overhead gets paid in sessions that only read a few files and report back." (also reports 12.8k tokens of MCP tools loaded with tool search on) | comment | verbatim-in-search-result |
| B6 | ~2026-11-05 (search tool: "about 10 days old") | Cursor forum thread | https://forum.cursor.com/t/agent-sdk-pricing-plan-requirements-and-limits-are-not-documented-where-can-i-find-them/177371 | not shown | User asks where Agent SDK pricing, plan requirements and limits are documented; staff reply says per-agent spend limits exist only on Enterprise and Teams gets only a team-wide cap. | not shown | paraphrase-from-search-summary |
| B7 | undated (search tool gave no date) | Cursor forum thread | https://forum.cursor.com/t/cloud-agents-web-blocked-by-on-demand-spend-limit-even-when-included-cursor-models-capacity-remains/172424 | not shown | Ultra-plan user blocked from starting a Cloud Agent by a $20 on-demand limit while included capacity was about half unused; workaround was removing the spend limit. | not shown | paraphrase-from-search-summary |
| B8 | 2026-11-04 | GitHub issue title only, langfuse/langfuse #19741 | https://github.com/langfuse/langfuse/issues/19741 | jhariani | Title reports the Langfuse Claude Code plugin re-sends earlier turns after a session moves directory, producing duplicate roots and doubled cost in the dashboard. | no comments shown | paraphrase-from-search-summary |
| B9 | out of window (id suggests ~Sept 2026) | HN, Ask HN: For Enterprise coding agents, what's your company doing to control cost? | https://news.ycombinator.com/item?id=49673825 | not shown | Commenter says a hard monthly cap per person mostly moved spend to the last week of the month; a visible remaining-budget gauge inside the tool worked better. Context only, outside the 30-day window. | not shown | paraphrase-from-search-summary |

### Theme C: no visibility into what subagents / background agents are doing

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| C1 | 2026-11-13 | GitHub issue, anthropics/claude-code #109446 | https://github.com/anthropics/claude-code/issues/109446 | rezzminator | "Nothing in the default row shows which agent is burning context, which one is about to hit its window, which one went to the expensive model, or which one is silently re-paying for an expired cache." and "Without it, a session that runs several background agents is flying blind." | 32 👍, 9 comments | verbatim-in-search-result |
| C2 | 2026-11-13 | same thread | https://github.com/anthropics/claude-code/issues/109446 | feedcove | "The only real workaround is pinning 2.1.322 with `DISABLE_AUTOUPDATER=1`, which gives up every later fix." (Anthropic staff reply same day: "I definitely messed up here.") | comment | verbatim-in-search-result |
| C3 | 2026-10-19 | GitHub issue title only, sst/opencode #57097 | https://github.com/sst/opencode/issues/57097 | germoran1-debug | Feature request to bring subagents back to the session sidebar (title cites three earlier issues on the same ask). | 2 comments | paraphrase-from-search-summary |
| C4 | 2026-11-13 | GitHub community discussion title only, #213027 | https://github.com/orgs/community/discussions/213027 | dzhaniivanov | Feature request for attention-only notifications for remote Copilot agent sessions. | 1 upvote, 1 comment | paraphrase-from-search-summary |

### Theme D: permissions and guardrails fail in both directions (prompt fatigue vs. destructive actions)

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| D1 | 2026-11-03 | GitHub issue, openai/codex #59060 (locked "too heated", closed not planned 11-06) | https://github.com/openai/codex/issues/59060 | lasertiger | Title: "Told to reboot a server, it destroyed systemd, destroyed containers, ran random scripts, cost me $10,000+". Body: "NONE OF THIS WAS PART OF ASK." Very high engagement but the thread is partly a pile-on; the loss figure was questioned in comments. | 548 👍, 440 comments | verbatim-in-search-result |
| D2 | 2026-11-03 | same thread | https://github.com/openai/codex/issues/59060 | PhilCode-creator | "If you need AI to reboot a server you maybe shouldn't have the permissions that the AI had in order to do what it did" | comment | verbatim-in-search-result |
| D3 | 2026-10-27 | GitHub issue, anthropics/claude-code #105342 | https://github.com/anthropics/claude-code/issues/105342 | raihanlh | "Here the rm -rf ~ never appeared in a Bash call; it was hidden inside a test file." and "Worktree isolation did not limit it, and the test passed, so the agent didn't notice until afterwards." | 6 comments | verbatim-in-search-result |
| D4 | 2026-10-29 | same thread | https://github.com/anthropics/claude-code/issues/105342 | Orend11 | "Worth knowing for anyone reading: a command hook wouldn't have caught this one, because the rm ran inside `cargo test` as a child process, not as a tool call the agent made." | comment | verbatim-in-search-result |
| D5 | 2026-10-21 | GitHub issue, anthropics/claude-code #103994 | https://github.com/anthropics/claude-code/issues/103994 | sergvss | "We hit this incidentally: an agent appended to `.git/info/exclude` in the same command as a commit, and the commit went through a gate that should have stopped it." | 7 comments | verbatim-in-search-result |
| D6 | 2026-10-20 | GitHub issue, anthropics/claude-code #103832 | https://github.com/anthropics/claude-code/issues/103832 | geokao | "So the dialog adds a click and protects nothing." (approval dialog on every child-session start, even in bypass mode) | 22 👍, 16 comments | verbatim-in-search-result |
| D7 | 2026-10-26 / 11-10 | same thread | https://github.com/anthropics/claude-code/issues/103832 | ovitrif; centralecgpro | "I run 10 to 20 helpers per main session, so a dialog per helper is a big slowdown." / "Each card stops the orchestrator until a human clicks, which defeats autonomous delegation." | comments | verbatim-in-search-result |
| D8 | 2026-11-09 | GitHub issue, anthropics/claude-code #108601 | https://github.com/anthropics/claude-code/issues/108601 | Yoel-Klein | "**Cost.** Each night of unguarded reactive work burned a large share of the user's usage limit on work the user had explicitly said not to do." (long-running orchestrator ignores written standing instructions across compactions) | 1 👍, 6 comments | verbatim-in-search-result |
| D9 | 2026-11-12 | GitHub community discussion #212893 | https://github.com/orgs/community/discussions/212893 | StevenMaude | "However, for commits the agent creates via cloud sandboxes, it seems this policy is ignored." and "The workflow run completes entirely without awaiting my approval." (the "Require approval for workflow runs" policy vs. Copilot cloud agent) | 1 upvote, 2 comments | verbatim-in-search-result |
| D10 | ~2026-11 (in window by item id; exact date not shown) | HN, Show HN: Agentic Identity Broker, OAuth Delegation for AI Agents | https://news.ycombinator.com/item?id=50393235 | commenters not shown | Commenters ask whether approvals are per tool or bound to the exact call (a per-tool "always allow" covers very different arguments, and some MCP servers have catch-all tools), and how headless agents get approval when nobody is there. | not shown | paraphrase-from-search-summary |

### Theme E: MCP auth and client-compatibility friction (for server builders and users)

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| E1 | 2026-10-26 | GitHub issue, openai/codex #57093 | https://github.com/openai/codex/issues/57093 | adaam2 | "No browser opens, and the authorization URL appears nowhere: not in the chat, and not in the desktop log." and "Sign-in is available only under Settings → MCP servers → From plugins → Authenticate, which most users never find." | 13 👍, 5 comments | verbatim-in-search-result |
| E2 | 2026-10-27 / 11-13 | same thread (MCP server operators) | https://github.com/openai/codex/issues/57093 | liriansu-opus; makeusabrew | "The 10x jump in unauthenticated requests produced no extra sign-ins." / "Our count of successful OAuth token grants did not rise when this traffic started." | comments | verbatim-in-search-result |
| E3 | 2026-10-27 | GitHub issue, anthropics/claude-code #105334 | https://github.com/anthropics/claude-code/issues/105334 | amine-amaach | "An automatic `decline` is indistinguishable from the user's own refusal. Servers and agents treat it as the user's answer, and the agent then tells the user they declined something they never saw." | 7 👍, 7 comments | verbatim-in-search-result |
| E4 | 2026-11-05 | same thread (MCP server builder) | https://github.com/anthropics/claude-code/issues/105334 | pablohidalgoxoople | "The desktop app declares `elicitation` (our server only sends the form after checking for it), so a server can't tell up front that the form will never be shown." | comment | verbatim-in-search-result |
| E5 | 2026-11-05 | GitHub issue, github/github-mcp-server #3677 | https://github.com/github/github-mcp-server/issues/3677 | Anika-Sol | "The expired token keeps being replayed and every GitHub call fails, while the connection appears healthy." | 1 👍, 0 comments | verbatim-in-search-result |
| E6 | 2026-10-23 | GitHub community discussion #211107 | https://github.com/orgs/community/discussions/211107 | normura | "The automation's environment setup reports that the MCP server started successfully and lists all 10 configured tools." "However, the agent cannot invoke them." Replies (10-29, 11-05) from tjhiggins, WuGing, fatih-onventis report the same with Sentry and Azure MCP, e.g. "Same issue trying to use the sentry mcp in an automation" | 4 upvotes, 6-12 comments | verbatim-in-search-result |
| E7 | 2026-10-16 | GitHub issue, openai/codex #54626 | https://github.com/openai/codex/issues/54626 | AlexWFreitas; ptoledo (10-18) | Author "created two custom MCP plugins" and "Both permanent-deletion attempts fail." ptoledo: "No mechanism is available in the UI to remove the blocking plugin/app association." | 6 👍, 15 comments | verbatim-in-search-result |
| E8 | 2026-10-19 | GitHub issue, google-gemini/gemini-cli #29825 | https://github.com/google-gemini/gemini-cli/issues/29825 | Rauneet-coder | "Gemini CLI discovers only the first page, with no diagnostic that additional tools were omitted." | 1 comment | verbatim-in-search-result |
| E9 | out of window (search tool: "about 72 days old") | HN, Ask HN: Who is using MCP in production? | https://news.ycombinator.com/item?id=49548600 | not shown | Commenters say implementing MCP auth in a server still is not streamlined, and that CLIs or direct API calls are cheaper and faster than MCP; several now write a CLI with help text instead of an MCP server. Context only, outside the window. | not shown | paraphrase-from-search-summary |

### Theme F: credentials, identity and privacy for headless fleets and gateways

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| F1 | 2026-10-18 | GitHub issue, anthropics/claude-code #103179 | https://github.com/anthropics/claude-code/issues/103179 | jyongchul | "Adding one account to four servers means separately running login on every host and pasting an OAuth code back each time, from my phone." and "After months of daily use I am seriously considering moving my whole fleet to other models." (Max subscriber, one workstation + four headless Linux servers, dozens of tmux agent sessions) | 7 comments | verbatim-in-search-result |
| F2 | 2026-10-18 | same thread | https://github.com/anthropics/claude-code/issues/103179 | bomtobe-hgkim | "A fleet-wide flow would be safer if the bootstrap produced separately revocable, host-scoped credentials rather than copying one long-lived OAuth token to every server." | comment | verbatim-in-search-result |
| F3 | 2026-10-27 | GitHub issue, anthropics/claude-code #105408 | https://github.com/anthropics/claude-code/issues/105408 | edonaliko | "We route Claude Code through an internal LLM gateway in Vertex mode." "Every request keeps failing with the same expired token until the helper cache lifetime (`CLAUDE_CODE_API_KEY_HELPER_TTL_MS`) elapses." | 29 👍, 1 comment | verbatim-in-search-result |
| F4 | 2026-11-05 | GitHub issue, anthropics/claude-code #107757 | https://github.com/anthropics/claude-code/issues/107757 | taylor-edwards | "I receive dozens of scam emails per day because claude code divulged my email to arbitrary 3rd parties in the `User-Agent` request header while conducting web searches without my permission." and "I am migrating my company to Pi with OpenRouter since I have no faith in anthropic preserving my privacy." (vendor shipped a blocking plugin; grettke, 11-09: "on 2.1.319 (macOS) it did not block a shell command carrying the account email in User-Agent.") | 798 👍, ~118 comments | verbatim-in-search-result |
| F5 | 2026-10-21 | GitHub issue, BerriAI/litellm #47826 | https://github.com/BerriAI/litellm/issues/47826 | LidorMachluf | "Please yank 1.107.0 and rotate the PyPI publishing credentials." "The payload is NOT in the `v1.107.0` git tag; it was injected into the build tree before the wheels were built." (title describes a credential stealer in the published LLM-gateway package) | 20 👍, 34 comments | verbatim-in-search-result |
| F6 | ~2026-11-04 (search tool: "about 11 days old") | HN, Ask HN: What's your current AI agentic setup? | https://news.ycombinator.com/item?id=50366117 | not shown | Commenters say agents need config files and real credentials to be useful, which raises concern about what they can reach; several run agents in bubblewrap or a Lima VM with only the env vars a task needs; one found Codex's built-in sandbox buggy with documented features not working. A second search of the same thread did not surface the sandbox/credential comments, so treat as weak. | not shown | paraphrase-from-search-summary |

### Theme G: vendor support unreachable; regressions and removals shipped without notice

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| G1 | 2026-10-27 | GitHub issue, anthropics/claude-code #105477 | https://github.com/anthropics/claude-code/issues/105477 | timoncool | "I am a paying Max 20x subscriber ($200 every month) and a heavy daily user of Claude Code." "I am filing this here because there is no other channel left where a person will read it." "Four requests to speak to a person; no person reached." | 19 👍, 5 comments | verbatim-in-search-result |
| G2 | 2026-11-03 | same thread | https://github.com/anthropics/claude-code/issues/105477 | kittcat-lab | "Support is handled by the Fin bot, which said errors are not compensated." | comment | verbatim-in-search-result |
| G3 | 2026-11-02 | same thread | https://github.com/anthropics/claude-code/issues/105477 | darksheer | "+1 on this. Opus has become almost unusable as it will NOT follow instructions anymore - either written in claude.md/agents.md or via prompt." | 6 👍 on comment | verbatim-in-search-result |
| G4 | 2026-11-13 | GitHub issue, anthropics/claude-code #109446 | https://github.com/anthropics/claude-code/issues/109446 | rezzminator | "You've removed a functionality that I've built my real-time observability on it, with NO reason/replacement/explanation!!" | comment | verbatim-in-search-result |

(See also A8 and A12: no incident notice or credits; support ticket unanswered for 6 days.)

### Theme H: agent observability / eval tooling gaps and pricing

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| H1 | 2026-11-11 | GitHub issue, langfuse/langfuse #20106 (closed not planned 11-13) | https://github.com/langfuse/langfuse/issues/20106 | DiegoDeDios | "As a result, the judge sees the answer but not the data it was based on, and fails correct answers as "hallucinated"." (title adds: trace-level evaluators retired Nov 16 without a replacement). Maintainer reply: "That's expected today." | 2 👍, 1 comment | verbatim-in-search-result |
| H2 | 2026-11-05 | GitHub issue title only, langfuse/langfuse #19760 | https://github.com/langfuse/langfuse/issues/19760 | Stadly | Title: JS SDK folds reasoning tokens into output with no way to get the split. | 2 comments | paraphrase-from-search-summary |
| H3 | undated | G2 discussion: which AI agent observability platform holds up for enterprise teams at scale | https://www.g2.com/discussions/which-ai-agent-observability-platform-actually-holds-up-for-enterprise-teams-running-agents-at-scale | not shown | LangSmith pricing that scales with trace volume is described as hard to forecast once usage grows past early testing; Braintrust usage-based pricing on data processed and retained is the main friction for high-volume programs; Arize enterprise pricing gets steep. The thread also asks whether teams end up sampling traces aggressively in production. | not shown | paraphrase-from-search-summary |
| H4 | undated (2026 reviews) | G2 LangSmith reviews | https://www.g2.com/products/langsmith/reviews | not shown | Reviewers say real monthly cost is hard to estimate because of trace volume, retention and usage-based services; the UI feels built for large enterprises rather than individuals prototyping; attribute schema is under-documented. | category rating 4.4/5 (96) per search summary | paraphrase-from-search-summary |
| H5 | in window by item id; exact date not shown | HN, Ask HN: How do you evaluate the skills your AI agents use? | https://news.ycombinator.com/item?id=50426070 | not shown | Commenters say there is no settled way: either let the agent judge the skill itself (fast, less accurate) or build a benchmark from your own work (harder and more annoying); skill behaviour changes across models, so re-evaluation is needed for each new model. | not shown | paraphrase-from-search-summary |

### Theme I: context and memory across projects, clients and repos (still manual)

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| I1 | in window by item id; exact date not shown | HN, Ask HN: How do you manage your AI agents' context across clients and projects? | https://news.ycombinator.com/item?id=50403153 | not shown | The question itself is the pain. Answers are hand-rolled: a short AGENTS.md pointing to other markdown files, separate OS logins or accounts or Obsidian vaults per client, handoff notes and LOG.md / DECISIONS.md so a fresh session can resume. Many replies are self-promotion for the commenter's own memory tool. | not shown | paraphrase-from-search-summary |
| I2 | ~2026-11-04 | HN, Ask HN: What's your current AI agentic setup? | https://news.ycombinator.com/item?id=50366117 | not shown | One commenter says sessions spanning frontend and backend repos need manual prompting to coordinate; another limits themselves to about three sessions because keeping session caches fresh is tedious; one built their own harness and kanban task manager after finding Claude Code and Codex lacking. | not shown | paraphrase-from-search-summary |

### Theme J: scheduled / unattended agent automations blocked or brittle

| id | date | source | url | author | quote / paraphrase | engagement | quote_status |
|---|---|---|---|---|---|---|---|
| J1 | 2026-11-05 | GitHub issue, openai/codex #59546 | https://github.com/openai/codex/issues/59546 | lz19891013-hash | "The desktop app's built-in instructions cause the assistant to decline Schedule-based monitoring of a task running in an external web system" | 21 👍, 17 comments | verbatim-in-search-result |
| J2 | 2026-11-13 | same thread | https://github.com/openai/codex/issues/59546 | Raul-CoreWeave | "Keeping a chat actively polling for hours isn't a practical replacement." | comment | verbatim-in-search-result |
| J3 | 2026-11-15 | GitHub community discussion title only, #213183 | https://github.com/orgs/community/discussions/213183 | toepoker12-hue | Asks how a scheduled Copilot automation can resume from an unmerged branch. | 1 upvote, 4 comments | paraphrase-from-search-summary |

Record count: 66 rows across 10 themes (49 with verbatim quotes, 17 paraphrased; 2 rows are explicitly out-of-window context: B9, E9).

---

## Products named as the current fix, or switched to / from (with stated prices)

| theme | product / workaround | role in the complaint | price stated | record |
|---|---|---|---|---|
| A | Claude Max 20x | paying, hitting limits early | "$200 every month" | G1, A1 |
| A | Claude Max 5x | paying, 94% of week in under 48h | not stated | A3 |
| A | Claude extra usage top-up | bought, burned fast | $100, gone in about 3 hours | A4 |
| A | Claude Team, Premium seat | weekly allowance gone in about 30h; allowance size unknown to the org admin | not stated | A5, A6 |
| A | ChatGPT Pro (Codex) | author moved from Pro $200 to Pro $100 on Oct 6 | $200 and $100 tiers | A7 |
| A | ChatGPT Plus; "Claude" as alternative | threat to cancel Plus; "$100 might be better spent on Claude" | $100 | A10 |
| A | GitHub Copilot Pro (1,500 AI credits) | credits exhausted on activation | not stated | A12 |
| A | `ccusage`; reading `~/.claude/projects/**/*.jsonl` by hand | manual usage reconciliation | free | A1, A3 thread |
| A | Steery | self-promoted by its author in thread as per-session token tracker | not stated | A3 thread (vendor-authored comment) |
| B | `claude -p` with `--max-turns`, `--max-budget-usd`, scheduler deadline | suggested workaround for no spend ceiling | n/a | B1 thread (fainir) |
| B | `CLAUDE_CODE_FORK_SUBAGENT=0` | opt-out that also disables forked subagents | n/a | B3 |
| B | Cursor Teams vs Enterprise | per-agent spend caps only on Enterprise | not stated; a $20 on-demand limit is mentioned | B6, B7 |
| C | Pinning Claude Code 2.1.322 + `DISABLE_AUTOUPDATER=1` | workaround for removed per-agent status line | n/a | C2 |
| C | OmnisSwarm, AgentMon Live, Flightpath (dev.to posts by their authors) | third-party "see what my agents do" tools; vendor/author-written, undated | free (OmnisSwarm, per post) | not recorded as complaints |
| D | Vestige | self-promoted by its author as a destructive-command blocker | open source | D3 thread (vendor-authored comment) |
| D | Claude Code Bash sandbox; PreToolUse / Stop hooks | built-in guards people rely on; hook "ask" can be overridden | n/a | D4, D5 |
| D / F | bubblewrap, Lima VM, throwaway working copies | home-made sandboxing | free | F6 |
| D | Zalando "Agentic Identity Broker" (MIT) | OAuth delegation broker shown on HN | open source | D10 |
| E | Sentry MCP, Azure DevOps MCP, Supabase MCP | servers that fail or mis-behave in specific clients | n/a | E3 thread, E6 |
| E | CLIs with help text, skills | what some moved to instead of MCP servers (out-of-window thread) | n/a | E9 |
| F | Internal LLM gateway in Vertex mode + `apiKeyHelper` | enterprise routing; token refresh breaks | n/a | F3 |
| F | Pi + OpenRouter | company migration target after the email-in-User-Agent issue | not stated | F4 |
| F | LiteLLM | gateway dependency hit by a compromised release | open source | F5 |
| H | Langfuse (trace-level evaluators retired) | current tool, capability removed | not stated | H1 |
| H | LangSmith | cost hard to forecast | Plus at $39 per seat per month plus usage (from a G2 buying guide via search summary; not checked against vendor page) | H3, H4 |
| H | Braintrust, Arize AX, self-hosted Arize Phoenix | alternatives with their own pricing friction | not stated | H3 |
| I | AGENTS.md, LOG.md, DECISIONS.md, Obsidian vaults, separate OS logins, Conductor, Orca, tmux | manual context management | n/a | I1, I2 |

---

## Sources that gave nothing (or nothing usable in the window)

- **Reddit** (r/mcp, r/ClaudeAI, r/ClaudeCode, r/AI_Agents, r/LangChain, r/LocalLLaMA, r/ExperiencedDevs, r/devops, r/cursor, r/ChatGPTCoding): zero. Domain is refused by the search tool; open-web queries returned no Reddit pages.
- **X:** no usable in-window practitioner complaints. In-window hits were a vendor announcement (ClaudeDevs, 2026-11-04) and trending-topic pages ("Claude Agents SDK Drains Usage Limits Much Faster Than Expected", ID dates to 2026-10-25) with no post text. Older posts on MCP context bloat and OAuth were all before the window.
- **Hacker News:** only four in-window threads surfaced (items 50366117, 50393235, 50403153, 50426070), all as summaries with no usernames, scores or verbatim comments. Queries on agent observability, sandbox pricing, MCP security, code-review load and usage limits returned older threads only.
- **G2:** undated summaries of LangSmith / Arize / Braintrust reviews and two discussion threads; no dated reviews, no reviewer names. Langfuse has too few reviews for G2 to summarize.
- **dev.to:** only author-written tool announcements and how-to posts; no complaint records taken.
- **Blogs:** vendor marketing on "shadow MCP" and rollout guides (Zuplo, Obot, Speakeasy, Cloudflare, Snowflake, Maxim and others); excluded as vendor-authored.
- **LangChain forum:** hits on cost/token attribution and self-hosting licence friction were all April-June 2026, outside the window.
- **Cursor forum:** two threads (B6, B7), summary only, one undated. Pricing-complaint megathreads returned were from 2025.
- **GitHub repos with no usable complaints in window:** cursor/cursor (0 results), modelcontextprotocol/modelcontextprotocol (spec nitpicks and proposals), langchain-ai/langgraph (low-engagement bug reports), mem0ai/mem0 (docs and connector bugs), browser-use/browser-use (bug reports, several vendor-pitch issues closed), sst/opencode (mostly free-tier abuse-detection reports; one 369-comment megathread not read). The modelcontextprotocol org discussions page returned 404.

## Query log (summary)

About 36 WebSearch queries (HN, X, G2, dev.to, Cursor forum, LangChain forum, open web) and about 55 WebFetch reads of github.com issue lists and issue pages across anthropics/claude-code, anthropics/claude-agent-sdk-python, openai/codex, github community discussions, github/github-mcp-server, google-gemini/gemini-cli, BerriAI/litellm, langfuse/langfuse, langchain-ai/langgraph, sst/opencode, browser-use/browser-use, mem0ai/mem0, modelcontextprotocol/modelcontextprotocol, cursor/cursor.
