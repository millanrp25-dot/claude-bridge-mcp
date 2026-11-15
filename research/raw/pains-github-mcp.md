# Pain mining — GitHub issues/discussions, MCP ecosystem + Claude Code

- Window: 2026-10-16 .. 2026-11-15 (issue creation date). Collected 2026-11-15.
- Evidence only. No ideas proposed.
- **How quotes were obtained.** Issue bodies, authors, dates, 👍 and comment counts come from the GitHub REST search API (`search/issues`), so body quotes are verbatim copies of the raw issue text (markdown markers such as backticks/`**` kept; `[…]` marks my cuts). Comment text could NOT be read via the API (see "Not reached"); the few comment quotes below came through WebFetch (a small model reads the page) and are tagged **[comment via WebFetch]** — treat them as probably-verbatim but not byte-checked. Comment permalinks were not available, so comment records link to the parent issue.
- 👍 = "+1" reactions on the issue body at collection time. "c" = comment count.
- Flag `WA` = workaround described, `PAY` = money/paid plan/spend mentioned, `BUILT` = they built an internal tool/fork/script.

## Records

### A. OAuth / auth for remote MCP servers

**R01** · 2026-10-21 · atlassian/atlassian-mcp-server · https://github.com/atlassian/atlassian-mcp-server/issues/281 · @diogosgrott
> "I can't authenticate to the Atlassian MCP server from any client I tried. The OAuth flow never finishes, so the server stays at "Needs authentication" and I can't use any tool."
- Engagement: 👍131 (141 reactions total), 119 c, closed. WebFetch saw 20 distinct commenters in the loaded part of the thread (3 are Atlassian staff), 94 timeline items not loaded.
- Theme: remote MCP OAuth outage, no fallback · WA: see R02/R03

**R02** · 2026-10-21 · same thread (R01) · https://github.com/atlassian/atlassian-mcp-server/issues/281 · @systemnate, @andreiwrk, @pthoughton-arch, @vinivosh, @ananda-cmd, @AnthonyDugarte, @ygormartins, @alexsayegh77 **[comments via WebFetch]**
> @andreiwrk: "Seeing the same thing in Cursor." · @pthoughton-arch: "I am also seeing the same issue." · @vinivosh: "Happening here with Claude Code as well. 429 errors in the Atlassian Auth page:" · @ananda-cmd: "I'm having the same issue since this morning. The MCP server was timing out."
- Engagement: 8 distinct "same" replies captured (more unloaded); individual comments 👍1–5.
- Theme: same failure across clients (Cursor, Claude Code, claude.ai) · WA: none in these

**R03** · 2026-10-22 · same thread (R01) · https://github.com/atlassian/atlassian-mcp-server/issues/281 · @zelidae **[comment via WebFetch, fragment]**
> "Workaround that works: Atlassian CLI (acli) on Windows, authenticated with an API token via"
- Theme: people drop the MCP server for a CLI + API token when OAuth breaks · WA: yes

**R04** · 2026-10-27 · github/app · https://github.com/github/app/issues/5115 · @brunodomenici
> "**This is a production-blocking regression for our organization: none of our custom MCP servers can be authenticated in the GitHub Copilot app.**" […] "error_description=select_account currently unsupported for prompt"
- Engagement: 👍7, 4 c, closed. Sibling report https://github.com/github/app/issues/5089 (@yirmio, 👍4, 3 c, "MCP OAuth login fails with account_selection_required (regression in 1.1.32)").
- Theme: client OAuth change breaks enterprise IdP (PingFederate) · WA: asks for rollback

**R05** · 2026-10-26 · openai/codex · https://github.com/openai/codex/issues/57093 · @adaam2
> "In the desktop app, the dependency path's browser launch fails silently, or opens somewhere the user can't see, and the URL never reaches the app."
- Engagement: 👍13, 5 c, open. Title: "Desktop: MCP sign-in never surfaces for plugin servers; skill dependency install starts OAuth but never shows the URL".
- Theme: OAuth (DCR) sign-in for plugin-bundled MCP servers never surfaces

**R06** · 2026-10-29 · modelcontextprotocol/rust-sdk · https://github.com/modelcontextprotocol/rust-sdk/issues/1408 · @johncaruso
> "So every refresh fails against a Salesforce-hosted MCP server, and the user has to go through the full authorization flow again each time the access token expires. Clients built on rmcp, including Codex, can't do anything about it, because there's no way to leave `scope` out of the refresh request."
- Engagement: 👍0, 3 c, open.
- Theme: token refresh incompatibility per provider → repeated re-auth

**R07** · 2026-11-07 · coollabsio/orbit · https://github.com/coollabsio/orbit/issues/84 · @ssebastianoo
> "I have multiple teams I work with and every time I want to make claude handle my tasks I have to re-authenticate orbit's mcp so that it uses the correct workspace and it's becoming really annoying."
- Engagement: 👍4, 1 c, closed. Stated alternative: "re-auth every time".
- Theme: one OAuth connection = one workspace/tenant; multi-account juggling · WA: manual re-auth

**R08** · 2026-10-16 · CherryHQ/cherry-studio · https://github.com/CherryHQ/cherry-studio/issues/21844 · @chung1912
> "But instead, mcp02 directly uses the authorization credentials of mcp01 to connect."
- Engagement: 👍2, 2 c, open. Title: "mcp cannot configure two accounts for the same URL via OAuth 2.0".
- Theme: two accounts on the same MCP URL not possible

**R09** · 2026-11-09 · github/copilot-cli · https://github.com/github/copilot-cli/issues/5402 · @jloeffelholz
> "The MCP config has no setting for the authority/tenant (`oauthClientId`, `oauthScopes`, etc. exist), so there is no client-side workaround." […] "Making the server's app multi-tenant would avoid `/common` being refused, but widening the app's audience just to work around the client isn't a good option for us."
- Engagement: 👍1, 0 c, open. Title says "/mcp auth is needed every session since 1.0.107".
- Theme: Entra single-tenant apps → re-auth every session · WA: none acceptable

**R10** · 2026-11-05 · github/github-mcp-server · https://github.com/github/github-mcp-server/issues/3677 · @Anika-Sol
> "We host the GitHub MCP server for GitHub Enterprise Server. GHES lacks the OAuth extensions MCP needs, so we front it with a Proxy that presents a compliant Authorization Server." […] "When the token expires, the only symptom today is a tool call returning `401 Bad credentials` inside an `isError: true` result."
- Engagement: 👍1, 0 c, open.
- Theme: self-hosted server + home-built OAuth proxy; expired tokens invisible to client · BUILT: OAuth proxy in front of GHES

**R11** · 2026-11-11 · modelcontextprotocol/typescript-sdk · https://github.com/modelcontextprotocol/typescript-sdk/issues/3173 · @buptliuhs
> "A tool handler can discover mid-execution that the user must **re-authorize** (not merely grant more scopes), and today it has no way to turn that into an HTTP `401` + `WWW-Authenticate` challenge." […] "So the response is HTTP 200 and the model sees an error it can't act on."
- Engagement: 👍0, 8 c, open.
- Theme: upstream credential expiry cannot trigger client re-auth · WA: yes ("With a workaround (below)…")

**R12** · 2026-10-29 · PrefectHQ/fastmcp (formerly jlowin/fastmcp) · https://github.com/PrefectHQ/fastmcp/issues/6153 · @ledbettj
> "A server cannot accept CIMD from known clients and refuse it from all other domains." […] "Today, FastMCP supports only the "open server" policy (or disabling CIMD all together)"
- Engagement: 👍2, 5 c, open.
- Theme: no way to restrict which OAuth clients may register (trusted-domain allowlist)

**R13** · 2026-10-29 · modelcontextprotocol/inspector · https://github.com/modelcontextprotocol/inspector/issues/2844 · @CloneOfAlex
> "When OAuth fails in the CLI or mcpdo, the user sees only the final error. The web client has a step-by-step OAuth view (discovery, registration, authorization, token exchange); terminal users have nothing comparable, so diagnosing a misconfigured authorization server means re-running in the web client or adding a proxy."
- Engagement: 👍0, 3 c, closed.
- Theme: OAuth debugging is blind outside the web inspector · WA: intercepting proxy

**R14** · 2026-10-20 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/103871 · @Benjovii
> "Each redeemed code minted a new token row (9 live tokens for the one registration by the end), i.e. every start signs in again instead of reusing the 24 h access token or the 90 d refresh token it was given minutes earlier."
- Engagement: 👍0, 1 c, closed. "Filed from the server operator's side".
- Theme: client re-authorizes on every session start

**R15** · 2026-10-28 · fivetran/fivetran-mcp · https://github.com/fivetran/fivetran-mcp/issues/8 · @nathanskone
> "Will it support dynamic client registration, or will it need a manually registered OAuth client?"
- Engagement: 👍2, 0 c, open. Title: "OAuth Support".
- Theme: vendor MCP server lacks OAuth

**R16** · 2026-11-10 · IBM/mcp-context-forge · https://github.com/IBM/mcp-context-forge/issues/7512 · @johnistheman
> "`POST /oauth/fetch-tools/{gateway_id}` recreates the tools (new IDs); the virtual servers have to be re-associated."
- Engagement: 👍0, 4 c, open. Title: "Updating an OAuth (authorization code) gateway deletes all its tools and does not apply the change".
- Theme: gateway OAuth config edits destroy tool mappings → manual rework

### B. Enterprise / team governance, admin controls, managed rollout

**R17** · 2026-11-05 · kirodotdev/KiroCrew · https://github.com/kirodotdev/KiroCrew/issues/30275 · @sporti
> "Every documented option breaks on a realistic enterprise constraint, which blocks adoption for security-aware companies." […] "A locked-down environment removes that assumption, and the only escape hatches (mirror a wheel, or push a central policy) each require infrastructure a mid-size, security-conscious, non-Python org typically can't provide."
- Engagement: 👍1, 3 c, open. Title: "Enterprise MCP governance: no viable path to run managed servers on locked-down corporate fleets".
- Theme: managed MCP servers on locked-down fleets (no MDM / no PyPI)

**R18** · 2026-10-19 · anthropics/claude-ai-mcp · https://github.com/anthropics/claude-ai-mcp/issues/1160 · @jimrosaairia
> "Users have to attach each skill by hand in every chat, which defeats the point of serving skills centrally." […] "Exposing skills as tools (`skills_list` / `skills_read`) on the server: this works in Claude chat today and we are building it as a stopgap, but it duplicates what the standard already defines and every server vendor would have to do the same."
- Engagement: 👍21 (29 reactions), 2 c, open. Related: https://github.com/anthropics/claude-code/issues/106550 (@YngveMolnes, 👍4, 4 c: "Hey, add support for skills-over-mcp pls").
- Theme: central distribution of skills to org users via MCP · WA+BUILT: stopgap tools on server

**R19** · 2026-11-14 · Mintplex-Labs/anything-llm · https://github.com/Mintplex-Labs/anything-llm/issues/7164 · @rafaneo
> "On an instance that hosts several teams, clients or projects, there's no way to say "this MCP server belongs to workspace A only"." […] "We run this today in a fork on top of v1.19.0 (about 170 lines across 10 files, with unit tests), and it has worked well for us."
- Engagement: 👍3, 1 c, open.
- Theme: per-team/tenant scoping of MCP servers · BUILT: private fork

**R20** · 2026-10-17 · spring-projects/spring-ai · https://github.com/spring-projects/spring-ai/issues/7192 · @dan-m62
> "We serve a few dozen tools from one MCP endpoint to a multi-tenant application, where some tools should only be visible to administrators" […] "What is missing is keeping tools a caller cannot use out of their listing, so the model neither spends context on them nor tries to use them."
- Engagement: 👍2, 1 c, open. Body says it consolidates three earlier issues.
- Theme: per-caller tool visibility (RBAC on tools/list)

**R21** · 2026-10-23 · IBM/mcp-context-forge · https://github.com/IBM/mcp-context-forge/issues/7325 · @zhanghonl
> "So we need: caller A authenticates as A, caller B as B, and the gateway holds neither credential." […] "header *name*, not a value" — which cost us a full debugging cycle."
- Engagement: 👍0, 0 c, open. Body also describes the alternative as storing "one user's token in the shared tool definition" and rewriting it every 5 hours (line-wrapped in source; paraphrase of the join).
- Theme: per-user upstream credentials through a gateway

**R22** · 2026-10-25 · cloin/semaphore-mcp · https://github.com/cloin/semaphore-mcp/issues/45 · @Jens-Wymeersch
> "Currently, the MCP server registers read and write tools together." […] "**Server-enforced read-only mode:** Add `MCP_READ_ONLY=true` to disable registration and execution of all mutating tools."
- Engagement: 👍3, 0 c, open.
- Theme: read-only mode / tool allowlist enforced server-side

**R23** · 2026-10-22 · samanhappy/mcphub · https://github.com/samanhappy/mcphub/issues/1371 · @malikov-pro
> "Real MCP servers increasingly expose dozens or hundreds of tools, and a common admin task is "expose only a subset" — for example, keep only the read-only tools of a 99-tool server in a group. Today that means ~99 individual interactions."
- Engagement: 👍0, 3 c, closed.
- Theme: bulk/rule-based tool curation in gateways · WA: manual clicking

**R24** · 2026-10-19 · BerriAI/terraform-provider-litellm · https://github.com/BerriAI/terraform-provider-litellm/issues/71 · @andrevus
> "Mixing Terraform and manual configuration is therefore not safe." […] "Without these attributes, servers created by the provider behave differently from our current ones, so the MCP part of our setup can't move yet."
- Engagement: 👍3, 0 c, open.
- Theme: MCP server config as code (IaC) incomplete

**R25** · 2026-10-20 · PrefectHQ/fastmcp · https://github.com/PrefectHQ/fastmcp/issues/5930 · @ezz3r
> "In corporate environments, registry.npmjs.org is often blocked by the company firewall, making fastmcp dev apps completely unusable."
- Engagement: 👍0, 4 c, closed.
- Theme: air-gapped / corporate-firewall dev

**R26** · 2026-10-30 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/106207 · @pjaaskel
> "So an org can't  allow Remote Control without also allowing cloud sessions."
- Engagement: 👍5, 0 c, open.
- Theme: admin toggles too coarse

**R27** · 2026-10-24 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/104862 · @ollyginelli
> "We pay for a Claude Team plan for our company (Nostro People, UK)." […] "Computer use works on my personal account, so right now I have to switch accounts, which splits our work and history across two accounts."
- Engagement: 👍5, 3 c, open. Duplicate ask: https://github.com/anthropics/claude-code/issues/109913 (@jonasfelber-art, 2026-11-14).
- Theme: Team plan lacks feature personal plan has · PAY: Team plan · WA: second personal account

**R28** · 2026-11-12 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/109411 · @Blasg2
> "But the only switch an admin has is all or nothing:" […] "On a Team plan, managed settings apply to everyone; group configurations need Enterprise." […] "This matters more because many Team admins aren't technical. They run the plan for a small company, not a security team."
- Engagement: 👍0, 0 c, open. Related hook-bypass bugs on Team orgs: https://github.com/anthropics/claude-code/issues/103626 (@zaphod72, 👍9), https://github.com/anthropics/claude-code/issues/104236 (@eurrag, 👍2: "ours did for about 9 hours across 6 open sessions before we noticed").
- Theme: per-member policy exceptions on small-team plans

**R29** · 2026-10-29 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/105996 · @gxvz-dev
> "documents 10 `HKLM\SOFTWARE\Policies\Claude` policies but doesn't ship an ADMX, so today admins have to hand-build registry items."
- Engagement: 👍0, 1 c, open.
- Theme: MDM/GPO packaging done by hand · BUILT: own ADMX

**R30** · 2026-10-17 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/102910 · @liaomupei-wq
> Title (verbatim): "[Cowork/Code] Managed MCP servers never reach Code-tab sessions since 10-15 update: mcp_config=stdio:0/http:0, no per-server logs, silent failure"
- Engagement: 👍0, 0 c, open. Body names the workaround `claude mcp add --scope user`. Sibling: https://github.com/anthropics/claude-code/issues/106899 (@darander, Enterprise: "organization-synced plugins no longer load, so all their MCP servers disappear").
- Theme: org-managed MCP distribution silently fails · WA: per-user manual add

**R31** · 2026-10-20 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/103766 · @iainelder-kaluza
> "`allowManagedHooksOnly`: closes the gap but also blocks user-authored hooks, which we want people to be able to write."
- Engagement: 👍2, 1 c, open. Title: "Ask again before running a trusted repo's hooks when they change".
- Theme: repo-hook trust drift; policy is all-or-nothing

**R32** · 2026-11-10 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/108778 · @dcvijetic-TT
> "Code sessions started by the desktop app can't do this." […] "Today it enforces a daily spend limit across all of a user's sessions."
- Engagement: 👍3, 3 c, closed. Title: "Desktop app: let Code sessions use a custom gateway (ANTHROPIC_BASE_URL) while keeping the claude.ai login". Related gateway-auth bug: https://github.com/anthropics/claude-code/issues/105408 (@edonaliko, 👍29: "The helper then re-runs every 90 seconds instead of when it's needed.").
- Theme: company LLM gateway (spend limits) can't cover all client surfaces · BUILT: internal gateway

### C. Tool / context overload (token cost of tool definitions)

**R33** · 2026-10-27 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/105328 · @SaedMami
> "The gap (~66k, about 6x) is re-read on every model call, so long desktop sessions cost much more than the same work in the terminal."
- Engagement: 👍4, 2 c, open. Title: "new sessions start at ~79k tokens of context vs ~13k in the terminal CLI with the same config".
- Theme: tools loaded in full instead of deferred · PAY: cost

**R34** · 2026-10-21 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/104088 · @chucksmarthouse
> "A `/context` check taken right after `/clear` plus two trivial questions showed 58.7k tokens across 87 MCP tools, the majority belonging to these same falsely-"connected" connectors — contributing to roughly $1 in usage credits for two trivial questions"
- Engagement: 👍0, 2 c, open. Says it re-files #48275, "auto-closed as "not planned" by stale-bot".
- Theme: connectors you can't remove burn context · PAY: usage credits

**R35** · 2026-10-29 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/106068 · @ludovicraymond
> "There’s no “Cowork only” option, so every time I add a skill, plugin or connector in Cowork, I have to go back and edit the config files of every code project to turn it off again. Each new Cowork install silently pollutes Code until I clean it up by hand, in every repo."
- Engagement: 👍0, 0 c, open.
- Theme: no per-surface/per-project profiles for MCP servers & skills · WA: manual per-repo edits

**R36** · 2026-10-23 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/104651 · @Classic298
> "the 27 tools of the built-in claude-code-remote MCP server […] are always loaded into context, about 15.8k tokens on every turn."
- Engagement: 👍0, 0 c, open. · WA+BUILT: "Deferring them with a small plugin hook (tool.describe returning isDeferred: true) works fine"
- Theme: always-loaded tool schemas

**R37** · 2026-10-25 · openai/codex · https://github.com/openai/codex/issues/56820 · @marcus
> Title (verbatim): "Custom/local model provider: ChatGPT app connector tools inlined in first request (~80K tokens) instead of deferred" · Body: "Workaround: a separate `CODEX_HOME` without a ChatGPT login, or `[features] apps = false`"
- Engagement: 👍1, 0 c, open. · WA: yes
- Theme: connector tools inlined

**R38** · 2026-10-25 · github/app · https://github.com/github/app/issues/5065 · @ercangorgulu-gembox
> "Every chat session in the Copilot App starts with roughly **40k tokens of injected context before the first user message** — the overwhelming majority of it tool definitions and static system-prompt blocks rather than actual conversation or code."
- Engagement: 👍0, 0 c, open.
- Theme: fixed tool-definition overhead; "costs credits"

**R39** · 2026-10-16 · microsoft/vscode · https://github.com/microsoft/vscode/issues/341962 · @1821746019
> "**Please provide the Copilot harness with a Local-style Configure Tools picker, including individual MCP tool selection—not just a server-level toggle or a workaround requiring manual JSON configuration.**"
- Engagement: 👍6, 1 c, open.
- Theme: per-tool enable/disable inside an MCP server · WA: manual JSON

**R40** · 2026-10-21 · microsoft/playwright-mcp · https://github.com/microsoft/playwright-mcp/issues/1799 · @ShachindraRevathi
> "please add --slim configuration like chrome-webtools mcp to prevent ai agent having too much unrelevant context (context rot)."
- Engagement: 👍0, 2 c, closed.
- Theme: slim tool profile

**R41** · 2026-11-13 / 2026-11-11 / 2026-11-01 · server-author side, three repos
- https://github.com/Feur-Inc/1loop/issues/447 · @tpm28 · title: "Fewer and shorter tools: 137 MCP tools under Claude Code cost too many tokens"
- https://github.com/colliedesk/colliedesk/issues/535 · @hiimchinh · "A client that loads every tool pays that in context on each session." (title: "Check how each MCP client loads Colliedesk's 246 tools")
- https://github.com/yetone/magpie/issues/4755 · @yetone · title: "MCP router: agents with no tool search get every tool on every request"
- Engagement: all 👍0, 0–1 c (internal tracker issues; weak as demand, useful as "vendors redo their tool surface by hand").
- Theme: server vendors hand-trimming tool lists per client

**R42** · 2026-11-09 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/108630 · @maran-t
> "**95%+ of deployed MCP servers do not define `outputSchema`**." (the 95% figure is the author's unsourced claim)
- Engagement: 👍1, 1 c, open. Long, proposal-style, likely AI-drafted → low weight.
- Theme: raw JSON tool results bloat context

### D. Cost, usage metering, spend visibility & runaway spend

**R43** · 2026-11-13 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/109446 · @rezzminator
> "Nothing in the default row shows which agent is burning context, which one is about to hit its window, which one went to the expensive model, or which one is silently re-paying for an expired cache."
- Engagement: 👍32 (34 reactions), 9 c, open. Related: https://github.com/anthropics/claude-code/issues/109494 (@mixaaaa, 👍2).
- Theme: per-subagent cost/context visibility removed · BUILT: custom status-line script

**R44** · 2026-10-29 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/105981 · @dblumenau
> "**Invisible to usage tracking.** These requests aren't written to the session transcript, so cost tools that read transcripts don't see them (#104358)."
- Engagement: 👍9, 4 c, open. Title: "agent_summary re-sends each background agent's full transcript every ~30 s, with no way to turn it off".
- Theme: hidden background token spend; no opt-out

**R45** · 2026-10-22 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/104262 · @albion1127
> "no way for admins to see **how much of each user's plan usage limit (5-hour session / weekly) is consumed**." […] "We built a workaround: a managed `statusLine` command that POSTs those values to our collector." […] "The JSON carries no user identity, so we have to join on `session_id` with OTel events."
- Engagement: 👍2, 2 c, open.
- Theme: per-user plan-utilization telemetry for admins · BUILT: statusLine→collector hack · PAY: Team/Enterprise

**R46** · 2026-10-28 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/105765 · @josh-sachs
> "Workarounds are poor: summing local transcripts misses other machines and claude.ai usage, and calling the usage endpoint from a status-line script means handling OAuth credentials on every render."
- Engagement: 👍2, 1 c, open. Context in body: "$0.91 / $3,000.00 spent".
- Theme: Enterprise usage-credit burn not exposed to tooling · PAY: Enterprise seat cap · WA: poor

**R47** · 2026-10-19 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/103376 · @EthanRCT
> "On Claude Max (20x), the weekly "all models" meter went from 0% to 54% in the first 22 hours after the weekly reset." […] "I reported this through in-app support, and the AI agent said it can't investigate metering."
- Engagement: 👍16, 18 c, open; WebFetch counted 14 distinct participants. Sample **[comments via WebFetch]**: @consolelogreece "Same issue here (Max 20x). Hoped it was some weird hiccup last week but the same is happening this week."; @jclendineng "[…] We want transparency."; @kreaddis-julien (👍5) "So the same weekly allowance covers about 30% fewer weighted tokens than two weeks ago."
- Same-complaint issues in window (authors distinct): #105125 @FixFips 👍15; #102667 @jihjun-ai 👍8/15 c; #105240 @Eth66 👍5/17 c; #105621 @ViktorGazsi 👍4/10 c; #105295 @umang-garg21 👍4; #105122 @casimmvancouver 👍5; #108272 @Remy-authority 👍4; #108534 @arunkumar-akm (Team plan) 6 c — all at https://github.com/anthropics/claude-code/issues/<number>.
- Theme: opaque subscription metering; users audit it from local transcripts · BUILT: own aggregation scripts · PAY: Max 20x

**R48** · 2026-11-05 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/107390 · @Tinusha97
> "The next weekly reset is November 11, 2026, at 3:30 AM, leaving almost six days without further included weekly usage."
- Engagement: 👍5, 12 c, open. · PAY: Team subscription
- Theme: team seat locked out for most of a week

**R49** · 2026-10-27 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/105477 · @timoncool
> "I am a paying Max 20x subscriber ($200 every month) and a heavy daily user of Claude Code." […] "The support bot (Fin) twice told me my paid account does not exist, then closed the case with a policy quote and refused to escalate."
- Engagement: 👍19, 5 c, open. Follow-up: https://github.com/anthropics/claude-code/issues/109811 ("18 days, 0 replies from Anthropic").
- Theme: no human support channel for paying users · PAY: $200/mo

**R50** · 2026-10-23 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/104736 · @hsspratt
> "silently consumed **$285.12 USD (and drained my entire $250 credit balance to $0)** across 9.5 days." […] "It repeated this autonomously **89 times across 9.5 days** with zero user presence."
- Engagement: 👍1, 1 c, open.
- Theme: runaway autonomous agent loop, no spend guard · PAY: $285

**R51** · 2026-10-25 / 2026-11-05 / 2026-11-02 · LLM/MCP gateway budget controls
- https://github.com/agentgateway/agentgateway/issues/4143 · @mrwadams · "Today spend is uncapped against a budget the operator thinks is active." (👍0, 3 c)
- https://github.com/agentgateway/agentgateway/issues/4307 · @mgoltzsche · "there's no way to put a rate limit on a single model as far as I can tell from the 1.7.0 CRDs." (👍3, 0 c; lists two workarounds "that both have drawbacks")
- https://github.com/IBM/mcp-context-forge/issues/7417 · @fabiolauria92 · "We enforce quotas in our own layer for now, so this isn't blocking us, but deployments relying on `usage_limits` for quotas or cost control currently have no limit at all." (👍0, 3 c) · BUILT: own quota layer
- Theme: gateway budgets/quotas that silently don't enforce

### E. Distribution, trust & registry quality (getting a server/plugin listed, installed, kept working)

**R52** · 2026-11-06 · anthropics/claude-plugins-official · https://github.com/anthropics/claude-plugins-official/issues/7024 · @Leu-s
> "The docs (plugin pre-submission checklist, Publish to the directory) don't mention this rule, and the developer portal has no step to apply for Verified status. One version of the portal message says there's no way to ask to become one yet. Some plugins can't work without code on the user's computer." (first sentence **[via WebFetch]**, rest API-verbatim)
- Engagement: 👍12, 33 c, open. WebFetch counted 27 distinct commenters besides the author.
- Theme: no path to "Verified" publisher status → plugins with hooks/local MCP servers blocked

**R53** · 2026-11-06..09 · same thread (R52) · https://github.com/anthropics/claude-plugins-official/issues/7024 **[comments via WebFetch]**
> @desktopsteward: "Same here since 2026-11-05: our plugin Desktop Steward (desktopsteward/desktop-steward) is held with "Local MCP servers accepted only from Verified organizations"." · @Sprinterli: "The plugin is built on command hooks, so removing them is not an option." · @kenneives: "verifying our domain in Claude on 2026-11-07 did not change it." · @danilojpferreira: "A documented way to request Verified status, or a path for individual maintainers, would help." · @rca-umb: "The plugin is still installable from my own marketplace in the meantime."
- Engagement: 12 distinct commenters quoted by WebFetch (desktopsteward, haabe, OrihuelaConde, itpartypattaya, galando, Sprinterli, kenneives, danilojpferreira, rca-umb, raphaelcm, MrJasonZhou, aunysillyme), ~7 with explicit "Same here".
- Theme: publisher verification bottleneck · WA: self-hosted marketplace

**R54** · 2026-10-18 · modelcontextprotocol/registry · https://github.com/modelcontextprotocol/registry/issues/1715 · @Sultan57git
> "Registry-driven clients currently install a withdrawn version with no signal, because `version` must be exact." (title: "…more than 1 in 8 have a problem the registry doesn't catch")
- Engagement: 👍0, 19 c, closed 2026-11-03 (a maintainer consolidated older revalidation requests into it). Author discloses "I built [ProtocolProbe] […], a free directory"; 8 of the author's own comments are hidden as spam → partly self-promotional; the numbers are the author's. **[comment via WebFetch]** @kaspermuutra-dotcom: "+1. Publish-time validation with no re-check means the registry's quality only ever decays."
- Theme: registry entries rot (dead packages/repos) with no re-validation · BUILT: third-party crawlers (author, @ondraulehla "daily file")

**R55** · 2026-11-01 · modelcontextprotocol/registry · https://github.com/modelcontextprotocol/registry/issues/1783 · @NagaYu
> "the registry currently checks a package only at publish time and again when the publisher edits."
- Engagement: 👍0, 7 c, open. Proposal-style; moderate weight.
- Theme: no content integrity (hash pinning) for registry packages

**R56** · 2026-10-17 · openai/codex · https://github.com/openai/codex/issues/54925 · @zeeni-world
> "Today, users must navigate technical settings and configure MCP servers manually. This creates a major adoption barrier for nontechnical users."
- Engagement: 👍14, 3 c, open.
- Theme: one-click connect for third-party MCP servers

**R57** · 2026-10-27 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/105428 · @abdelkadersebihi
> "Today users must copy a URL, open Customize > Connectors, click "Add custom connector", and paste. Those manual steps are the biggest drop-off point when onboarding users to an MCP service, especially non-technical ones." […] "I run Dzairio, an HR/payroll SaaS with an MCP server."
- Engagement: 👍2, 1 c, open.
- Theme: MCP vendors lose users at manual connector setup

**R58** · 2026-10-18 · crystaldba/postgres-mcp · https://github.com/crystaldba/postgres-mcp/issues/237 · @camball
> Title (verbatim): "`postgres-mcp:0.3.0` unusable from missing upstream dependency; falling back to 0.1.0"
- Engagement: 👍14, 6 c, open. · WA: pin old version
- Theme: community server breaks on release; users pin back. Similar: https://github.com/microsoft/playwright-mcp/issues/1822 (@gnomed, 👍3: "is it reasonable to hope for a built docker image from this repo?")

**R59** · 2026-10-26..11-12 · github/github-mcp-server discussions · https://github.com/github/github-mcp-server/discussions?discussions_q=created%3A%3E2026-10-15+sort%3Atop **[list via WebFetch]**
> Observation, not a quote: ≥18 of the 25 top discussions in the window are "Onboarding request: … for github.com/mcp" posts from individual vendors (e.g. https://github.com/github/github-mcp-server/discussions/3657 @serpel-app, https://github.com/github/github-mcp-server/discussions/3716 @szemyd), each 1–2 upvotes, 1 comment.
- Theme: vendors queue manually to get listed in client-side MCP galleries (paraphrase; bodies not read)

### F. Security: secrets, credential leakage, audit, privacy

**R60** · 2026-11-13 · anomalyco/opencode · https://github.com/anomalyco/opencode/issues/63867 · @sergiopadure
> "In October 2026, agents that read these API endpoints printed our provider keys into session transcripts, and we rotated those keys. In November an MCP token also ended up in a transcript, and we are now rotating credentials on several machines again."
- Engagement: 👍2, 3 c, open. Says earlier requests were "closed as not planned on 12 November 2026".
- Theme: plaintext MCP/provider secrets leak into transcripts · WA: local plugin / env+file tricks

**R61** · 2026-11-05 · microsoft/vscode · https://github.com/microsoft/vscode/issues/346157 · @vritant24
> "users configuring MCP servers for Copilot sessions have to paste tokens into these files as plain text, or rely on host env vars."
- Engagement: 👍2, 3 c, open (filed by what reads like a team member; tracks planned work).
- Theme: secret references in `.mcp.json`

**R62** · 2026-11-08 · github/github-mcp-server · https://github.com/github/github-mcp-server/issues/3748 · @rafe-walker
> "Agent transcripts and MCP client logs that record tool output no longer contain short-lived access tokens for private files." (stated as the benefit of the fix; title: "get_file_contents directory listings put tokenised private-repo download URLs in model context")
- Engagement: 👍0, 1 c, open. Author filed ~12 issues from "an independent, AI-assisted review of v2.1.0; reproduced by hand".
- Theme: credentials in tool output

**R63** · 2026-11-05 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/107757 · @taylor-edwards
> "I receive dozens of scam emails per day because claude code divulged my email to arbitrary 3rd parties in the `User-Agent` request header while conducting web searches without my permission." […] "I am migrating my company to Pi with OpenRouter since I have no faith in anthropic preserving my privacy."
- Engagement: 👍798 (1,098 reactions), 118 c, open — highest in the whole sample. Maintainer reply **[via WebFetch]** (@poteat, 👍23/👎5): "We introduced a built-in mod called `cc-plugin-privacy` to deterministically block this behavior in v2.1.317 and later". WebFetch also saw two third-party commits adding egress-blocking hooks (@connorads, @luisnquin).
- Theme: agent leaks user identity in outbound requests; no egress visibility · WA+BUILT: users' own egress-deny hooks · PAY: "migrating my company"

**R64** · 2026-11-05 · PostHog/posthog · https://github.com/PostHog/posthog/issues/130094 · @rhamnett
> "It trips egress monitoring, and the operator has no way to know it is PostHog." (title: "Self-hosted installs run the MCP-registry crawler and probe hundreds of third-party hosts daily, with no documented way to turn it off")
- Engagement: 👍2, 1 c, closed.
- Theme: undeclared outbound MCP traffic in self-hosted software

**R65** · 2026-10-16 · modelcontextprotocol/financial-services-interest-group · https://github.com/modelcontextprotocol/financial-services-interest-group/issues/17 · @astrogilda
> "Today the record of a tool call is usually a log kept by the firm that ran it, so an examiner has to trust the party being examined."
- Engagement: 👍2, 28 c, open. Author maintains his own draft/corpus (self-interested), but the charter quote in the body is the group's: "tamper-evident, portable records of what a tool call did".
- Theme: regulator-verifiable audit trail of tool calls

**R66** · 2026-10-22 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/104409 · @deefactorial
> "A hook, a plugin or an Agent SDK caller cannot verify that a subagent run actually happened as reported."
- Engagement: 👍2, 1 c, open.
- Theme: attestation of agent runs for CI · WA: hash transcripts, guess session dir

**R67** · 2026-11-01 · agentic-community/mcp-gateway-registry · https://github.com/agentic-community/mcp-gateway-registry/issues/1977 · @zoltan-fedor
> "We use the gateway with a custom enterprise agent as well as ChatGPT, GitHub Copilot, Claude, and other MCP clients." […] "If the gateway drops these fields during discovery, persistence, serialization, filtering, aliasing, or search-result projection, connected agents cannot access the upstream tool's declared behavior."
- Engagement: 👍1, 1 c, open. Similar: https://github.com/agentgateway/agentgateway/issues/4245 (@AndreRochaDev, 👍1: "mcpGuardrails only intercepts successful responses, skipping errors and server-initiated messages").
- Theme: gateways strip tool annotations needed for human-in-the-loop approval

### G. Debugging, testing, observability of MCP servers/gateways

**R68** · 2026-11-09 · modelcontextprotocol/inspector · https://github.com/modelcontextprotocol/inspector/issues/2936 · @lizexinxin
> "What I do instead today: test the server with Cherry Studio over stdio (bypasses the LB entirely), or manually copy the affinity cookie out of a curl session and set it as a static custom header per session — both defeat the purpose of a UI inspector."
- Engagement: 👍0, 3 c, closed.
- Theme: can't test servers behind real load balancers · WA: manual cookie copy

**R69** · 2026-10-28 · modelcontextprotocol/inspector · https://github.com/modelcontextprotocol/inspector/issues/2830 · @CloneOfAlex
> "comparing two runs of the same tool (e.g. before and after a server change) means copying JSON out by hand."
- Engagement: 👍0, 3 c, closed. Same author filed load-testing asks: https://github.com/modelcontextprotocol/inspector/issues/2840.
- Theme: regression-comparing tool outputs · WA: manual copy

**R70** · 2026-11-08 · modelcontextprotocol/python-sdk · https://github.com/modelcontextprotocol/python-sdk/issues/3836 · @mihai-dinculescu
> "A client connected to several MCP servers therefore can't tell from its own telemetry which server a call went to." […] "I'd like to group/filter those by server, but the only option today is guessing from tool-name patterns."
- Engagement: 👍0, 4 c, open.
- Theme: tracing can't attribute tool calls to a server

**R71** · 2026-10-26 · agentgateway/agentgateway · https://github.com/agentgateway/agentgateway/issues/4166 · @yelaissaoui
> "Request logs stored in the database (`request_logs` and `request_log_payloads`) are never deleted." […] "The only way to bound the table today is an external `DELETE` job (k8s cronjob in our case)."
- Engagement: 👍7, 0 c, open. · BUILT: k8s cronjob
- Theme: log retention in gateways

**R72** · 2026-10-18 / 2026-10-17 · samanhappy/mcphub · @ehrtech
- https://github.com/samanhappy/mcphub/issues/1342 · "Currently, MCPHub provides the `/health` endpoint and verbose stdout logs, but **does not expose metrics** in an open telemetry or scrapeable format." (👍1)
- https://github.com/samanhappy/mcphub/issues/1334 · "it is very difficult to identify which client or group triggered the unavailable tool." (👍1)
- Theme: gateway metrics & per-client attribution (one person, two issues; both closed)

**R73** · 2026-11-02 · modelcontextprotocol/python-sdk · https://github.com/modelcontextprotocol/python-sdk/issues/3803 · @gowthamrao
> Title (verbatim): "Tool results over 1 MiB cannot be received over SSE or streamable HTTP, and the limit is not configurable"
- Engagement: 👍0, 5 c, open. Related: https://github.com/github/github-mcp-server/issues/3547 (@TheAviv, large file writes must be inlined in the tool call).
- Theme: payload size ceilings

**R74** · 2026-10-17 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/102940 · @lorenzoromani1983
> "This is very frustrating and making Claude Desktop not working in many cases." (title: "Claude Desktop on MAC OS timing out MCP calls after 60 seconds")
- Engagement: 👍2, 3 c, open.
- Theme: fixed 60 s tool timeout for long-running tools

**R75** · 2026-10-27 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/105334 · @amine-amaach
> "So the request reaches the desktop app, which answers "decline" without showing anything."
- Engagement: 👍7, 7 c, open.
- Theme: client advertises a capability (elicitation) it doesn't honour → server authors can't rely on capability negotiation

### H. Breakage from client updates, silent regressions, churn

**R76** · 2026-10-17 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/103001 · @melbis
> "After that the server cannot be reconnected in that session; only a new session brings it back."
- Engagement: 👍4, 16 c, closed. Same bug, other reporters: https://github.com/anthropics/claude-code/issues/104895 (@aailabs, 👍3, 7 c), https://github.com/anthropics/claude-code/issues/104833 (@jeangv, 👍5, 4 c), https://github.com/anthropics/claude-code/issues/109591 (@rczubak, 👍6, 8 c: "I've lost my claude.ai connectors in new sessions.").
- Theme: MCP servers silently dropped mid-session · WA: start a new session

**R77** · 2026-10-17 · microsoft/vscode · https://github.com/microsoft/vscode/issues/342333 · @foundryserver
> "MCP is the clearest example of the confusion. I spent hours getting servers installed and working. It’s unclear who starts them, when, whether they can auto-start, and how the different user and workspace scopes interact." […] "You are in danger for losing customers due to being too complex to use."
- Engagement: 👍3, 1 c, open. Title: "terrible mcp ui".
- Theme: MCP setup/scope confusion; UI churn

**R78** · 2026-10-24 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/104911 · @elibarzilay
> "Four hours, one experiment, one user, repeated across the cohort and again for the next experiment." […] "**Ask:** a documented setting that excludes an account from behavior experiments"
- Engagement: 👍3, 2 c, open. Related: https://github.com/anthropics/claude-code/issues/106743 (@spooler, 👍3), https://github.com/anthropics/claude-code/issues/106167 (@lerugray, 👍11, 16 c).
- Theme: unannounced behaviour experiments on paying users; hours of debugging

**R79** · 2026-10-24 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/104853 · @TechEducatorsTeam
> "Community workarounds (bypassing the connector via the Gmail API directly, blocking the connector's write tools, or re-pasting every link by hand) show users are routing around the product rather than using it."
- Engagement: 👍5, 4 c, open. Says reported "repeatedly since around June 2026 […] with no maintainer response".
- Theme: first-party connector bug with business impact, no response · WA: direct API / manual

**R80** · 2026-11-07 · block/buzz-app · https://github.com/block/buzz-app/issues/2987 · @quanganhhoang
> "Users can't reach tools that work in the Codex CLI with the same `config.toml`."
- Engagement: 👍3, 1 c, open.
- Theme: same MCP config behaves differently across harnesses

**R81** · 2026-10-16 · openai/codex · https://github.com/openai/codex/issues/54626 · @AlexWFreitas
> Title (verbatim): "Cannot delete Custom MCP Plugins" (body: OAuth callback reports "state not found", plugin can't be removed)
- Engagement: 👍6, 15 c, open.
- Theme: stuck MCP plugin state

### I. Config scope / sync

**R82** · 2026-11-03 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/106965 · @yasunori0418
> "Shared changes and local changes can't be merged automatically." […] "Keeping the copy and the source in sync has to be done by hand."
- Engagement: 👍8, 0 c, open ("re-proposing #81990").
- Theme: dotfile-shared vs machine-local settings · WA: manual sync

**R83** · 2026-11-05 · anthropics/claude-code · https://github.com/anthropics/claude-code/issues/107421 · @sadiksaifi
> "Workaround in use: one symlink per skill from ~/.claude/skills/ to ~/.agents/skills/."
- Engagement: 👍9, 0 c, open.
- Theme: cross-agent shared skills directory · WA: symlinks

**R84** · 2026-10-18 · samanhappy/mcphub · https://github.com/samanhappy/mcphub/issues/1341 · @ehrtech
> "The operator must manually prune the record via raw database queries (`DELETE FROM servers WHERE ...`) or click Delete in the UI."
- Engagement: 👍1, 1 c, closed.
- Theme: declarative (GitOps) gateway config can't remove servers · WA: raw SQL

**R85** · 2026-11-13 · docker/sbx-releases · https://github.com/docker/sbx-releases/issues/859 · @dojci
> "**`sbx env` has no way to select the mode.**" […] "This costs a host process per running sandbox and relies on behaviour that the documentation does not describe."
- Engagement: 👍10, 1 c, open. Title: "sbx env: no way to create a sandbox with a static MCP set and no servers".
- Theme: locking down the MCP set available inside an agent sandbox · WA: undocumented host process

## Low-quality / not counted as demand
- Cross-posted vendor pitch by @rezearcher ("Optional pre-admission scan of third-party MCP servers (tool poisoning / hidden unicode), free preview") in docker/mcp-gateway#607, IBM/mcp-context-forge#7285, archestra-ai/archestra#9285, aklivity/zilla#2751 — 0 👍 each.
- @Paraphern "tool contract drift … plus a PR diff action" in modelcontextprotocol/servers#5218 and microsoft/playwright-mcp#1796 — product pitch.
- Spec proposals that read AI-drafted / vendor-driven and were closed: modelcontextprotocol/modelcontextprotocol#3452 (@Ablation-Tool, 26 c), #3538 (@AdamDiStefanoAI, 7 c), #3471 (@quantova-inc), #3465 (@carlos-olivera).
- PrefectHQ/fastmcp Discussions in window: 24 listed, almost all "Show and tell" self-promotion with 1 upvote / 0–3 comments (e.g. "mcp-slim … (-50% to -98.7% schema tokens …)" #6459, "Review MCP config changes in PRs with Permission Delta" #6490, "fastmcp-forge — CLI scaffolding & pytest harness" #6076). Supply-side signal (many people building token-slimmers, test harnesses, policy middleware), not demand.
- modelcontextprotocol/modelcontextprotocol Discussions in window: 13, all working-group meeting notes (Progressive Disclosure, Skills over MCP, Interceptors, Files, Inspector V2), 1–3 upvotes, 0 comments.
- archestra-ai/archestra: ~30 of 44 issues are "[MCP Catalog] Add …" vendor self-listings. github/github-mcp-server: many empty/junk issues ("001", "Ok", "Km").
- Global GitHub search for "mcp" is dominated by agent-run coordination boards with 1,300–2,500 comments (e.g. autonomous-ai/lampOS, SoulSchoolAcademy/NayaPOWER) — bot traffic, ignored.
- modelcontextprotocol/servers (185 issues), python-sdk (62), typescript-sdk (49), go/csharp/rust SDKs: almost entirely precise bug reports with 0 👍; maintainers fix them. metatool-ai/metamcp (8) is all security-disclosure requests. docker/mcp-gateway (9) all 0 👍 / 0–1 c.

## Themes — distinct people
Counting rule: issue authors of records in the theme + additional named commenters/duplicate-issue authors captured above. Reaction-only supporters are listed separately (not people-identifiable).

| # | Theme | Records | Distinct named people | Extra signal |
|---|---|---|---|---|
| 1 | Distribution, trust & registry quality (E) | R52–R59 | **≈39** (7 issue authors + 27 commenters on R52 + kaspermuutra-dotcom, ondraulehla on R54 + gnomed + ≥2 named discussion posters; R59's ≥18 onboarding posters not all named) | 👍12, 14, 14 on top issues |
| 2 | OAuth / auth for remote MCP (A) | R01–R16 | **≈32** (16 issue authors incl. @yirmio + 16 non-staff commenters on R01) | 👍131 on R01; 119 c |
| 3 | Cost, metering, spend visibility (D) | R43–R51 | **≈33** (11 issue authors + 13 other participants on R47 + 8 duplicate-issue authors + @mixaaaa) | 👍32, 19, 16, 15 |
| 4 | Enterprise/team governance & managed rollout (B) | R17–R32 | **≈22** (16 authors + YngveMolnes, jonasfelber-art, zaphod72, eurrag, darander, edonaliko) | 👍21 on R18, 👍29 on gateway bug |
| 5 | Tool/context overload (C) | R33–R42 | **12** | low 👍 (max 6); many independent small reports |
| 6 | Breakage / silent regressions / churn (H) | R76–R81 | **11** (6 authors + aailabs, jeangv, rczubak, spooler, lerugray) | 👍 up to 11 |
| 7 | Security: secrets, leakage, audit, privacy (F) | R60–R67 | **≈11** (8 authors + AndreRochaDev, connorads, luisnquin) | 👍798 on R63 (privacy/egress) |
| 8 | Debugging/testing/observability (G) | R68–R75 | **9** | 👍7 on R71, R75 |
| 9 | Config scope / sync (I) | R82–R85 | 4 | 👍8–10 each |

Caveats on counts: R01/R47/R52 commenter totals come from WebFetch page reads of partially loaded threads (R01 had 94 timeline items unloaded), so they are lower bounds for R01 and approximate elsewhere. People who appear in two themes (e.g. @ehrtech, @CloneOfAlex) are counted once per theme.

## Not reached
- GitHub REST `repos/…` endpoints, GraphQL and the GitHub MCP tool are blocked for repos outside this session → no API access to comment bodies, comment permalinks, per-comment reactions, or Discussions search. Only `search/issues` worked (issue body + counts).
- Comments were read (via WebFetch) for only 5 threads: atlassian #281, claude-plugins-official #7024, registry #1715, claude-code #107757, claude-code #103376. All other comment counts are counts only.
- Org-level discussions (github.com/orgs/modelcontextprotocol/discussions) returned 404. Discussions for typescript-sdk, python-sdk, servers, inspector, registry, playwright-mcp, IBM/mcp-context-forge, docker/mcp-gateway, metamcp were not fetched; anthropics/claude-code discussions not checked.
- anthropics/claude-code had 7,623 issues in the window; I sampled the top ~50 by 👍 and by comments for ~25 keyword queries, so low-engagement MCP pain there is under-sampled.
- jlowin/fastmcp no longer resolves in search; PrefectHQ/fastmcp was used (205 issues in window, nearly all 0 👍). sparfenyuk/mcp-proxy (7), supercorp-ai/supergateway (2), TBXark/mcp-proxy (0), microsoft/mcp-gateway (1), lastmile-ai/mcp-agent (5) had nothing with engagement.
- No explicit "I would pay for X" statement was found in any body read; payment evidence is indirect (paid plans named, dollar losses, forks/internal tools built).
