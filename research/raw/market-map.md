# Market map: AI agent / developer tooling (B2B) — Pass 1

Compiled 2026-11-15. Factual map only; no gap analysis here.

## How to read this file

- **Evidence labels.** `[GH]` = I read the GitHub page myself on 2026-11-15. `[S]` = taken from a web-search result summary; I could not open the source page (vendor sites, news sites and forums are unreachable from this container), so treat every `[S]` item as **unconfirmed, from search summary** even where I don't repeat the phrase. `[S×n]` = the same fact appeared in several independent results (still not opened, but more reliable).
- **Prices** come almost entirely from third-party pricing guides, not vendor pricing pages. Check the vendor page before relying on any number.
- Nothing here is from memory unless marked "(from memory, unverified)".
- GitHub star counts are rounded as GitHub displays them.

---

## 1. MCP servers, gateways, registries, hosting

**Context.** Anthropic donated MCP to the Agentic AI Foundation (a Linux Foundation directed fund) on 2025-12-09; OpenAI and Block are co-founders, AWS/Google/Microsoft/Cloudflare/GitHub/Bloomberg supporting members [S] ([MCP blog](https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/), [GitHub blog](https://github.blog/open-source/maintainers/mcp-joins-the-linux-foundation-what-this-means-for-developers-building-the-next-era-of-ai-tools-and-agents/)). The official registry is still labelled preview; its README says GA "will follow later" with no date [GH] ([modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry), 7.5k stars). One analysis counts 47,267 active servers in the official registry on 2026-10-21 and 400M+ monthly SDK downloads in July 2026 [S] ([digitalapplied](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol), [growthmethod](https://growthmethod.com/is-mcp-dead/)). Reference servers repo: 92.0k stars [GH] ([modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)).

| Player | What | Pricing | Funding | Signals |
|---|---|---|---|---|
| [Composio](https://composio.dev) | Tool/integration layer + MCP | Free 20K tool calls/mo; Standard $29/mo (200K); Professional $229/mo (2M); Enterprise custom; "premium" calls bill 3x [S] ([composio.dev](https://composio.dev/content/smithery-alternative)) | ~$25M Series A led by Lightspeed (2025), ~$29–30M total; no Series B found [S] ([Tracxn](https://tracxn.com/d/companies/composio/__S4CqdyIkWZd1BSTOwnjS82Hz0ppMkmDoAP_j4_oMBfk/funding-and-investors), [Forbes India](https://www.forbesindia.com/article/30-under-30-2026/talent-may-eventually-decide-who-wins-the-ai-race-composio-co-founder/2990635/1)) | — |
| [Smithery](https://smithery.ai) | Registry + hosting | Paid subscriptions reportedly cancelled/refunded back to 2026-08-05 [S, single source] ([bestmcptools](https://bestmcptools.org/glama-vs-smithery)) | Acquired by Arcade, announced 2026-08-05, terms undisclosed [S×n] ([Arcade blog](https://www.arcade.dev/blog/smithery-joins-arcade/), [Forbes](https://www.forbes.com/sites/janakirammsv/2026/08/10/arcade-acquires-smithery-to-own-the-agent-tool-supply-chain/)) | Independent registry absorbed by an auth vendor; neutrality concerns raised [S] ([runtimewire](https://runtimewire.com/article/arcade-acquires-smithery-agent-tool-supply-chain)) |
| [Glama](https://glama.ai) | Registry, inspector, gateway | Listing free; boosted listing $49/mo; site schema shows offers from $9 to $80 [S] ([apideck](https://www.apideck.com/blog/mcp-server-directories), [glama.ai](https://glama.ai/)) | Not found | — |
| [Runlayer](https://dealroom.co/companies/runlayer/) | Enterprise MCP security gateway | Not found | $11M seed (Khosla, Felicis; out of stealth Nov 2025); $30M Series A led by Felicis, 2026-06-24; Dealroom lists $120M valuation [S×n] ([Yahoo/PR](https://finance.yahoo.com/technology/ai/articles/runlayer-raises-30m-series-help-130000711.html), [ventureburn](https://ventureburn.com/runlayer-seed-11m/)) | Seed to Series A in ~7 months |
| [Manufact](https://manufact.com/blog/seed-announcement) (ex mcp-use) | OSS SDK + cloud for MCP servers/apps | Not found | $6.3M seed, Feb 2026, led by Peak XV, YC [S×n] ([VentureBeat](https://venturebeat.com/infrastructure/manufact-raises-usd6-3m-as-mcp-becomes-the-usb-c-for-ai-powering-chatgpt-and), [FinSMEs](https://www.finsmes.com/2026/02/manufact-raises-6-3m-in-seed-funding.html)) | Targets $2–3M ARR by end of 2026 (company goal) [S] |
| [WhiteMatter](https://www.prnewswire.com/news-releases/whitematter-raises-20m-series-a-to-close-the-growing-gap-between-ai-autonomy-and-enterprise-governance-302934477.html) (ex QuilrAI) | Agent/MCP governance gateway | Not found | $20M Series A, 2026-11-10, Blumberg Capital [S×n] ([SecurityWeek](https://www.securityweek.com/whitematter-raises-20-million-in-series-a-funding/)) | Claims 5x revenue in 6 months (company-reported) |

**Entrants since Nov 2025:** Runlayer (stealth exit Nov 2025), Manufact (seed Feb 2026), WhiteMatter (rebrand + Series A Nov 2026), Helmet Security ($9M, SYN Ventures) and Operant AI named in a March 2026 MCP-security roundup [S] ([softwarestrategiesblog](https://softwarestrategiesblog.com/2026/03/28/agentic-ai-security-startups-funding-mna-rsac-2026/)). Platform moves: Anthropic "MCP tunnels" for private MCP servers in Managed Agents (2026-05-19) [S] ([the-decoder](https://the-decoder.com/anthropic-adds-self-hosted-sandboxes-and-mcp-tunnels-to-claude-managed-agents/)); Anthropic MCP connector in the Messages API (beta) [S] ([docs](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector)).

**Growth / decline.** Money is going to *security/governance gateways*, not directories. Directories monetise weakly ($9–$80 tiers, boosted listings) and the best-known one was acquired. Recurring criticism: token/context bloat, tool poisoning, "thin wrappers around APIs" [S] ([StackOne](https://www.stackone.com/blog/mcp-tool-bloat-stateless-spec/), [CSA note](https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-security-crisis-20260504-csa-styled/), [mcp.directory](https://mcp.directory/blog/mcp-context-bloat-fix-2026-tool-search-code-mode-progressive-disclosure)). A new spec revision dated 2026-07-28 moved MCP toward stateless request/response [S] ([StackOne](https://www.stackone.com/blog/mcp-tool-bloat-stateless-spec/)).

---

## 2. Agent frameworks / orchestration

| Player | Stars [GH] | Pricing | Funding | Signals |
|---|---|---|---|---|
| [LangChain](https://github.com/langchain-ai/langchain) / [LangGraph](https://github.com/langchain-ai/langgraph) | 149.6k / 45.0k | Frameworks free (MIT). LangSmith Plus $39/seat/mo, 10K base traces included, ~$2.50 per 1K base traces overage; a tracker says on 2026-07-21 usage moved to two meters, LCU $1.50 and LSU $1.00 [S, conflicting] ([usagepricing](https://www.usagepricing.com/blueprint/langsmith), [inference.net](https://platform.inference.net/content/langsmith-pricing/)) | **$300M at $3B, led by CapitalG, reported 2026-11-13**; $460M total; prior $1.25B Series B (late 2025); claims 7,000 LangSmith customers [S×n] ([TechCrunch](https://techcrunch.com/2026/11/13/ai-agent-startup-langchain-hits-3b-valuation/), [Yahoo/PR](https://finance.yahoo.com/technology/ai/articles/langchain-raises-300m-enable-every-155300515.html)) | Valuation 2.4x in ~a year |
| [CrewAI](https://github.com/crewAIInc/crewAI) | 61.0k | Framework free (MIT); hosted pricing not found | $18M Series A Oct 2024 (Tracxn); PitchBook lists a $20M Series B Apr 2026, $44.5M total — **sources conflict** [S] ([Tracxn](https://tracxn.com/d/companies/crewai/__5sItJve5QhflF2dH7U1TN7h20PJauFNCVGN8ZUg5wrM/funding-and-investors), [PitchBook](https://pitchbook.com/profiles/company/590845-78)) | — |
| [Mastra](https://github.com/mastra-ai/mastra) (TypeScript) | 29.5k | Free tier; Teams $250/mo [S] ([wetheflywheel](https://wetheflywheel.com/en/comparisons/langgraph-vs-crewai-vs-mastra/)) | $22M Series A, Spark Capital, Apr 2026; ~$35M total [S, single source] (same) | v1.0 Jan 2026 [S] |
| [Pydantic AI](https://github.com/pydantic/pydantic-ai) | 21.2k | Library only, no hosted product [S] | Not found | v2 on 2026-06-23 [S] ([speakeasy](https://www.speakeasy.com/blog/ai-agent-framework-comparison)) |
| Microsoft Agent Framework | not checked | Free OSS | n/a (Microsoft) | 1.0 GA ~2026-04-02/03; successor to AutoGen and Semantic Kernel [S×n] ([atlan](https://atlan.com/know/ai-agent/microsoft/agent-framework/)) |
| Vendor SDKs (Claude Agent SDK, OpenAI Agents SDK, Google ADK) | not checked | Free; monetised via model tokens | n/a | All ship MCP support in 2026 [S] ([socialcrawl](https://www.socialcrawl.dev/blog/ai-agent-frameworks-2026-developer-field-guide)) |

**Declining / dead.** AutoGen in maintenance mode since Oct 2025 [S×n] ([LangChain resource](https://www.langchain.com/resources/langchain-vs-autogen)). OpenAI Agent Builder (visual tool) deprecated 2026-06-03, shuts down 2026-11-30; users pushed to the Agents SDK [S] ([founderventures](https://founderventures.io/intel/openai-winds-down-agent-builder-sdk-shift)). Relay (workflow automation) shut down Aug 2026 [S] ([TechCrunch AI graveyard](https://techcrunch.com/2026/11/14/the-ai-graveyard-a-running-list-of-projects-and-startups-that-didnt-make-it)).

**Entrants since Nov 2025:** Microsoft Agent Framework GA; Anthropic Claude Managed Agents (public beta Apr 2026: hosted sandboxing, state, tool execution) [S] ([ai-heroes](https://www.ai-heroes.co/en-us/blog/how-claude-managed-agents-work-2026)).

**Pattern.** Frameworks themselves are free; revenue is in the attached paid product (LangSmith, hosted runtimes). Model vendors now ship both the SDK and the hosted runtime.

---

## 3. LLM / agent observability and evals

| Player | Pricing | Funding / ownership | Signals |
|---|---|---|---|
| [Langfuse](https://github.com/langfuse/langfuse) (37.5k stars [GH]) | Hobby free (50k units/mo); Core $29/mo; Pro $199/mo; Enterprise $2,499/mo [S] ([llmtools.cc](https://llmtools.cc/blog/llm-observability-acquisitions-2026/)) | **Acquired by ClickHouse, 2026-01-16**, alongside ClickHouse's $400M Series D at $15B [S×n] (same) | OSS still maintained; roadmap questions [S] |
| LangSmith | See section 2 | Part of LangChain ($3B) | 7,000 customers claimed [S] |
| [Braintrust](https://www.braintrust.dev) | Free Starter (1GB, 10k scores); Pro $249/mo [S] ([atlan](https://atlan.com/know/ai-agent/ai-agent-evals/braintrust-alternatives/)) | $80M Series B at $800M, Feb 2026, ICONIQ [S×n] ([botmemo](https://botmemo.com/ai-observability-llmops-funding-map)) | Largest remaining independent |
| [Arize](https://arize.com) (Phoenix OSS, AX) | AX Pro $50/mo; Phoenix free self-hosted [S] ([appstackbuilder](https://appstackbuilder.com/blog/llm-observability-evals-2026)) | **Acquired by Dynatrace for $915M** (~$815M cash), announced Aug 2026, closed 2026-10-01 per Dynatrace 8-K [S×n] ([SEC 8-K exhibit](https://www.sec.gov/Archives/edgar/data/0001773383/000177338326000069/q2fy27-earningsreleaseex99.htm), [ITPro](https://www.itpro.com/business/acquisition/dynatrace-acquires-observability-firm-arize-in-usd915m-deal)) | Prior round $70M Series C Feb 2025 [S] |
| [Helicone](https://github.com/Helicone/helicone) (6.3k stars [GH]) | — | **Acquired by Mintlify 2026-03-03; maintenance mode** [S×n] ([dev.to](https://dev.to/stockyarddev/the-llm-proxy-landscape-in-2026-helicone-acquired-litellm-compromised-and-whats-next-3oon), [chatforest](https://chatforest.com/reviews/helicone-llm-observability-gateway/)). Note: the GitHub README shows no such notice [GH] | ~16,000 orgs at acquisition [S] |
| Promptfoo | OSS | Acquired by OpenAI 2026-03-09 [S] ([llmtools.cc](https://llmtools.cc/blog/llm-observability-acquisitions-2026/)) | — |
| Galileo | — | Acquired by Cisco (now under Splunk), closed May 2026 [S, single source] ([botmemo](https://botmemo.com/ai-observability-llmops-funding-map)) | — |
| Patronus AI | Not found | $50M Series B, Jun 2026, Greenfield Partners [S, single source] (same) | — |

**Entrants since Nov 2025 (seed stage):** Plurai $13M seed (Team8, 2026-11-11) ([wowtale](https://en.wowtale.net/2026/11/13/235981/)); Respan $5M seed (Gradient, Mar 2026) ([tamradar](https://www.tamradar.com/funding-rounds/respan-seed-5m)); Laminar $3M seed (2026-03-17, YC) ([tech.eu](https://tech.eu/2026/03/17/agent-debugging-startup-laminar-raises-3m-seed-to-tackle-the-observability-gap-in-ai-agents/)); Lemma $2.3M pre-seed (2026-08-13) ([Yahoo](https://finance.yahoo.com/technology/ai/articles/2-3m-pre-seed-lemma-160000653.html)). All [S].

**Adjacent (LLM gateway).** LiteLLM (63.3k stars [GH], [repo](https://github.com/BerriAI/litellm)) suffered two supply-chain compromises in 2026: March 24 (v1.82.7/1.82.8) and October 21 (v1.107.0, PyPI + Docker) [S×n] ([Hacker News security](https://thehackernews.com/2026/10/litellm-compromised-in-supply-chain.html), [Microsoft Security blog](https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/), [Help Net Security](https://www.helpnetsecurity.com/2026/10/22/litellm-compromised-supply-chain-attack-pypi-docker/)).

**Pattern.** Heaviest consolidation of any sub-category: five acquisitions in ~10 months (Langfuse, Helicone, Promptfoo, Galileo, Arize), buyers are data/APM/docs/model vendors. Seed money still flows to "agent debugging/simulation" framing.

---

## 4. Agent auth, identity, permissions, secrets

| Player | Pricing | Funding | Signals |
|---|---|---|---|
| [Arcade](https://www.arcade.dev) | Conflicting: free 2,000 auth events/tool calls then $25/mo; another source says from $50/mo; a third says not publicly listed, "priced by usage" [S] ([agentmail](https://www.agentmail.to/blog/ai-agent-authentication-platforms-compared-2026), [developersdigest](https://www.developersdigest.tech/blog/arcade-ai-agent-authorization-developer-guide-2026)) | $60M Series A, Jun 2026, SYN Ventures; $12M seed before; ~$72M total [S×n] ([SiliconANGLE](https://siliconangle.com/2026/06/15/ai-agent-authorization-startup-arcade-nabs-60m-investment/)) | Bought Smithery Aug 2026 |
| Keycard | Not found | $38M across seed + Series A (a16z, boldstart, Acrew), announced Oct 2025 [S] ([idsync](https://idsync.com/directory/keycard)) | No 2026 round found |
| Auth0 for AI Agents (Okta) | Free to 25,000 MAU; Essentials from $35/mo; Professional from $240/mo; no published per-agent rate [S] ([nhigovernance](https://nhigovernance.com/companies/auth0-for-ai-agents.html)) | n/a (Okta) | — |
| [Descope](https://www.descope.com) | Free 7,500 MAU + 2,000 monthly active tokens; Pro $249/mo; Growth $799/mo [S] ([devtune](https://devtune.ai/verticals/agent-authentication-identity-for-ai/descope)) | $53M seed (2023) + $35M extension Sep 2025 = ~$88M [S] | — |
| [WorkOS](https://workos.com) | Not found for agent product | $100M Series C at $2B, 2026-03-02 [S, single tracker] ([nhigovernance](https://nhigovernance.com/companies/workos.html)) | Agent Auth early access 2026-09-02; auth.md spec 2026-05-21 [S] |
| Stytch | Connected Apps free to 10,000 MAU; $125 per SSO/SCIM connection beyond 5 [S] ([markaicode](https://markaicode.com/pricing/stytch-pricing/)) | Acquired by Twilio, closed 2025-11-14; price disputed ($104.1M cited from 10-K by one tracker) [S] ([nhigovernance](https://nhigovernance.com/companies/stytch.html)) | — |
| Clerk | Base from $25/mo; API keys and M2M tokens are usage add-ons (1,000 / 2,500 free creations per month) [S] ([clerk.com](https://clerk.com/articles/best-sso-and-mfa-providers-for-b2b-saas)) | Not found | Feb 2026 pricing restructure [S] |
| Aembit (workload/agent identity) | Teams $20 per agent or workload per month; free Starter [S, single source] ([accuroai](https://accuroai.co/blog/nhi-vendor-landscape-2026)) | Not found | Still independent [S] |

**Secrets / non-human identity (NHI).** GitGuardian $50M Series C, Feb 2026, Insight ([SiliconANGLE](https://siliconangle.com/2026/02/11/gitguardian-raises-50m-expand-non-human-identity-ai-agent-security/)); Oasis Security $120M Series B, Mar 2026 ([SiliconANGLE](https://siliconangle.com/2026/03/19/oasis-security-raises-120m-secure-non-human-identities-across-ai-cloud-environments/)). Consolidation reported by one source: Cisco–Astrix, SailPoint–Entro, Cyera–Oasis, Delinea–StrongDM, Palo Alto–CyberArk (~$25B, closed Feb 2026) [S, single source for most] ([accuroai](https://accuroai.co/blog/nhi-vendor-landscape-2026)). HashiCorp Vault (IBM) added an agent registry and ephemeral per-request credentials in May 2026 [S] (same). An identity funding report says 49 of 99 identity equity rounds (Jan 2025–Oct 2026) targeted AI agents / NHI [S] ([startwithidentity](https://startwithidentity.com/reports/identity-funding-report-2026/)).

**Entrants since Nov 2025:** WorkOS Agent Auth, Vault agent features, plus the MCP-security gateways in section 1 (which overlap this category). Third-party Claude Code add-on "MCP-Warden" (credential brokering) appears in an Oct 2026 launch roundup [S] ([getreadyforagents](https://www.getreadyforagents.com/news/claude-code-ecosystem-tools-launch/)).

**Pattern.** Heavily funded and consolidating fast; pricing is mostly MAU-based or quote-based — per-agent pricing is rare and unpublished.

---

## 5. Coding agents and tooling around them

### Core products

| Product | Pricing | Revenue / adoption | Ownership / funding | Signals |
|---|---|---|---|---|
| [Claude Code](https://github.com/anthropics/claude-code) (155.8k stars, 5k+ open issues [GH]) | Pro $20/mo (~$17 annual); Max $100/mo (5x Pro); Ultra $200/mo (renamed from Max 20x on 2026-10-30); rolling 5-hour + weekly limits, no published token figures [S×n] ([sentra](https://www.sentra.app/articles/claude-code-pricing), [developersdigest](https://www.developersdigest.tech/coding-agent-plans/claude-code)) | Run-rate >$2.5B as of Feb 2026 (last Claude Code-specific figure) [S] ([andrew.ooo](https://andrew.ooo/answers/ai-coding-agent-market-share-cursor-claude-code-copilot-july-2026/)). Anthropic overall: $65B run-rate end of July 2026 ([CNBC](https://www.cnbc.com/2026/08/17/anthropic-says-annualized-revenue-climbed-to-65-billion-in-july.html)); ">$80B in October" is single-source [S] ([cryptobriefing](https://cryptobriefing.com/anthropic-revenue-run-rate-80-billion-ipo/)) | Anthropic; $965B valuation cited for May 2026 Series H; IPO planned [S] | Plugin/skills marketplace opened Feb 2026 [S] |
| [Cursor](https://cursor.com) | Pro $20; Pro+ $60; Ultra $200; Teams $40/user [S×n] ([fireup.pro](https://fireup.pro/news/spacex-cursor-acquisition-developers-2026), [justinmckelvey](https://justinmckelvey.com/blog/cursor-usage-limits)). One review mentions newer "X Subscription" plans (Plus $8, Premium $30) [S, single source] ([hackceleration](https://hackceleration.com/labs/review/cursor)) | $3B ARR May 2026 (Wikipedia/Bloomberg); ~$4B early June is secondary [S] ([Wikipedia](https://en.wikipedia.org/wiki/Cursor_(company))) | **SpaceX agreed to acquire for $60B all-stock, announced 2026-06-16** ([CNBC](https://www.cnbc.com/2026/06/16/spacex-spcx-cursor-acquisition-ipo.html)); reported closed 2026-08-14 [S, secondary] | Nov 2026 forum backlash over weekly limits |
| GitHub Copilot | Pro $10; Pro+ $39; Business $19/user; Enterprise $39/user; **since 2026-06-01 all plans on usage-based "AI Credits"** (1 credit = $0.01) [S×n] ([GitHub community FAQ](https://github.com/orgs/community/discussions/197089), [devtoolsreview](https://devtoolsreview.com/pricing/copilot-pricing/)) | 4.7M paid subscribers (Jan 2026, last disclosed); 50M users (Jul 2026); revenue not broken out — outside estimates ~$0.45–1B are **estimates** [S] ([aibusiness.vc](https://aibusiness.vc/b2b/github-copilot-2b-arr)) | Microsoft | Metered-billing backlash (see complaints) |
| [OpenAI Codex](https://github.com/openai/codex) (135.4k stars [GH]) | Bundled in ChatGPT: Free; Go $8; Plus $20; Pro $100 / $200 / $500; Business ~$20–25/user; token-based credits since 2026-04-02 [S×n] ([morphllm](https://www.morphllm.com/codex-pricing), [taskade](https://www.taskade.com/blog/codex-pricing-explained)) | No Codex-specific revenue found. OpenAI run-rate ">$40B, July 2026" is single-source [S] | OpenAI | $500 tier added 2026-09-29 [S] |
| Cognition (Devin, Devin Desktop ex-Windsurf) | Free; Pro $20; Max $200; Teams $80 + $40/seat; Enterprise custom (ACU-billed) [S×n] ([nhimg](https://nhimg.org/devin-desktop-and-windsurf-guide), [replicas.dev](https://replicas.dev/resources/devin-pricing)) | ~$0.9–1B run-rate claimed [S, secondary] | $1B at $26B (May 2026); a $48B Series E (2026-09-08) is reported by blogs only — **unconfirmed** [S] ([Wikipedia](https://en.wikipedia.org/wiki/Cognition_AI), [valueaddvc](https://valueaddvc.com/blog/cognition-devin-ai-coding-agent-company-deep-dive)) | Windsurf renamed Devin Desktop June 2026 |
| [Factory](https://techcrunch.com/2026/04/16/factory-hits-1-5b-valuation-to-build-ai-coding-for-enterprises/) (Droid) | Not found | Not found | $150M at $1.5B (Apr 2026); $200M at $5B (2026-09-15) [S×n] ([Reuters via The Star](https://www.thestar.com.my/tech/tech-news/2026/09/16/ai-coding-agent-startup-factory-triples-valuation-to-5-billion-in-latest-funding-round)) | Valuation 3.3x in 5 months |

### Open-source agents

- [OpenCode](https://github.com/anomalyco/opencode): 227.0k stars, MIT (sst/opencode now redirects to anomalyco/opencode) [GH] — the most-starred coding agent I checked.
- [Cline](https://github.com/cline/cline): 71.7k stars, Apache-2.0 [GH]; $27M Series A Jul 2025, no 2026 round found [S] ([newmarketpitch tracker](https://newmarketpitch.com/blogs/news/ai-code-assistant-list-deals)).
- **Roo Code: shut down 2026-05-15, repo archived** (24.2k stars) [GH] ([repo](https://github.com/RooCodeInc/Roo-Code)); team pivoted to a cloud agent, Roomote [S].
- Kilo Code: acquired by Anaconda, July 2026 [S×n] ([Anaconda blog](https://www.anaconda.com/blog/anaconda-acquires-kilo-code)); prior $8M seed.
- Warp open-sourced its terminal client in April 2026 [S] ([Wikipedia](https://en.wikipedia.org/wiki/Warp_(terminal))).
- Google: Jules being wound down into Antigravity (announced 2026-10-29); Gemini CLI stopped serving free and Pro/Ultra individual users on 2026-06-18 [S] ([TechCrunch AI graveyard](https://techcrunch.com/2026/11/14/the-ai-graveyard-a-running-list-of-projects-and-startups-that-didnt-make-it)).
- Amp: reported as spinning out of Sourcegraph; status unclear [S].

### Third-party add-ons (code review etc.)

Prices from comparison blogs [S]: CodeRabbit ~$24/dev/mo; Greptile $30/seat; Graphite $20–$40/user; Qodo ~$19–30/dev ([stork.ai](https://www.stork.ai/blog/best-ai-code-review-tools-2026), [ideaplan](https://www.ideaplan.io/blog/ai-code-review-tools-market-share-2026)). Anthropic launched its own multi-agent code review in March 2026 [S] ([buildmvpfast](https://www.buildmvpfast.com/blog/best-ai-code-review-tools-anthropic-2026)). Community guides count 26–40+ verified Claude Code extensions (token tracking, context compression, orchestration, security scanning) [S] ([claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/guide/ecosystem/third-party-tools.md)); Oct 2026 launches include Agent Tree, Perch, Compactly, MCP-Warden [S] ([getreadyforagents](https://www.getreadyforagents.com/news/claude-code-ecosystem-tools-launch/)). One analysis argues Claude Code keeps absorbing add-on features (opinion) [S] ([resolvewith.me](https://resolvewith.me/blog/claude-code-disrupting-ai-tooling-startups)).

---

## 6. Agent memory

| Player | Stars [GH] | Pricing | Funding |
|---|---|---|---|
| [Mem0](https://github.com/mem0ai/mem0) | 69.0k | Free; Starter $19/mo; Pro $249/mo (graph memory on Pro); one source also lists a $79 tier [S] ([mnemoverse](https://mnemoverse.com/docs/library/ai-memory-solutions-2026-q3), [ecorpit](https://ecorpit.com/ai-agent-memory-mem0-zep-letta-cloudflare-comparison-2026/)) | $24M seed + Series A (Oct 2025, Basis Set); no Series B found [S] |
| [Zep](https://github.com/getzep/graphiti) (Graphiti) | 32.8k | Free 10,000 credits/mo; Flex $125/mo (50,000 credits) [S] ([developersdigest](https://www.developersdigest.tech/blog/best-ai-agent-memory-providers-2026)) | Only a $500K pre-seed (YC W24) found; unclear [S] |
| [Letta](https://github.com/letta-ai/letta) (ex MemGPT) | 25.4k | Self-host free; Pro $20/mo; API priced per active agent [S] | $10M seed (Sep 2024, Felicis, ~$70M post) [S] |
| Supermemory | not checked (31.0k per [S]) | Free ($5 credits); Pro $19; Max $100; Scale $399 [S] | ~$2.6M seed [S] |
| Cognee | not checked | Not found | $7.5M seed, 2026-02-19, Pebblebed [S] ([cognee.ai](https://www.cognee.ai/cognee-1-0-announcement)) |

**Entrants since Nov 2025 (all platform-owned):** Anthropic Managed Agents memory (public beta 2026-04-23) and "Dreaming" consolidation (May 2026 research preview) [S] ([usewire](https://usewire.io/blog/anthropic-managed-agents-memory-context-engineering/)); Cloudflare Agent Memory (private beta, free during beta, pricing unpublished) [S] ([InfoQ](https://www.infoq.com/news/2026/04/cloudflare-agent-memory-beta/), [Cloudflare docs](https://developers.cloudflare.com/agent-memory/platform/pricing/)).

**Pattern.** Smallest funding of the seven categories (largest disclosed total: $24M); no 2026 growth rounds or acquisitions found; high GitHub interest; model and cloud platforms now ship memory natively.

---

## 7. Browser / sandbox / code-execution infrastructure

### Sandboxes

| Player | Pricing | Funding | Signals |
|---|---|---|---|
| [E2B](https://github.com/e2b-dev/E2B) (14.9k stars [GH]) | $0.0504/vCPU-hour, $0.0162/GiB-hour, per-second; Pro plan $150/mo; Hobby free with credit [S×n] ([fly.io](https://fly.io/learn/ai-sandbox-pricing/), [activepieces](https://www.activepieces.com/blog/e2b-pricing-plans-rates-and-limits-2026-guide)) | $21M Series A Jul 2025 (Insight); ~$32–44M total; no 2026 round found [S] | "Billionth sandbox" [S] ([bex.co](https://bex.co/blog/2026/09/11/ai-sandbox-funding-modal-daytona-e2b)) |
| [Modal](https://modal.com) | Starter $0 + $30 credit; Team $250/mo; sandbox CPU ~3x its function rate, ≈$0.071/vCPU-hour [S] (same sources) | **$355M Series C at $4.65B, May 2026** [S] ([bex.co](https://bex.co/blog/2026/09/11/ai-sandbox-funding-modal-daytona-e2b)) | Only one with native GPU [S] |
| [Daytona](https://github.com/daytonaio/daytona) (71.3k stars) | Same headline rate as E2B, $0.0504/vCPU-hour [S] | $24M Series A Feb 2026 (FirstMark); a $60M Series B (Oct 2026) appears in one aggregator only — unconfirmed [S] ([presspool](https://presspool.ai/companies/daytona-io)) | **Went closed-source: README says core development moved to a private codebase in June 2026; repo archived 2026-10-03** [GH] |
| Vercel Sandbox | $0.128 per active vCPU-hour + $0.0212/GB-hour [S] ([northflank](https://northflank.com/blog/ai-sandbox-pricing)) | n/a | — |
| Cloudflare Sandboxes | ≈$0.072/vCPU-hour normalised (third-party estimate) on $5 Workers Paid [S] | n/a | — |
| Anthropic Managed Agents | Not found | n/a | Hosted sandbox + self-hosted sandbox option (May 2026) [S] |

### Browsers

| Player | Pricing | Funding |
|---|---|---|
| [Browserbase](https://www.browserbase.com) ([Stagehand](https://github.com/browserbase/stagehand) 26.1k stars [GH]) | Free; Developer $20/mo (100 browser hours); Startup $99/mo (500 hours); Scale custom [S] ([makerstack](https://makerstack.co/reviews/browserbase-review/)) | $40M Series B at $300M (Jun 2025); ~$67.5M total; no 2026 round as of Sep 2026 [S] ([taskade](https://www.taskade.com/blog/history-of-browserbase)) |
| [Browser Use](https://github.com/browser-use/browser-use) (121.1k stars [GH]) | ~$0.02/browser-hour in one comparison [S] ([ecorpit](https://ecorpit.com/cloud-browsers-ai-agents-browserbase-steel-kernel-2026/)) | $17M seed (Mar 2025, Felicis); no 2026 round found [S] |
| Kernel | ~$0.055/hour headless [S] (same) | $22M seed + Series A (Oct 2025, Accel) [S] |
| Steel, Hyperbrowser | ~$0.10/hour each [S] (same) | Small/undisclosed [S] |
| Anchor Browser | Not found | $6M seed (Blumberg) [S] |

**Entrants since Nov 2025:** StableBrowse (YC Spring 2026, $125K) [S] ([vctavern](https://vctavern.com/stablebrowse-raises-seed-funding-to-build-a-machine-native-web-engine-for-ai-agents/)); Nightona, a community fork of Daytona v0.190.0 [S]; Anthropic and Cloudflare first-party sandboxes.

**Pattern.** Sandbox compute is near-commodity priced (E2B and Daytona list the identical rate). Capital concentrated in Modal. No 2026 venture rounds found for cloud browsers.

---

## Overall

### How the money flows

1. **Developers and companies → coding-agent subscriptions** ($20 / $100 / $200 per seat per month is the standard ladder at Anthropic, Cursor, OpenAI, Cognition) or metered credits (Copilot since June 2026).
2. **Coding-agent and agent-app vendors → model providers** for tokens. Anthropic's run-rate ($65B, July 2026) dwarfs every tooling vendor; Cursor's $3B ARR and Claude Code's >$2.5B are the largest tooling lines found.
3. **Agent builders → infrastructure by usage**: sandboxes per vCPU-second, browsers per browser-hour, observability per trace/unit, memory per credit, tool platforms per call.
4. **Enterprises → governance vendors** (MCP gateways, agent identity, NHI security), mostly quote-based contracts. This is where 2026 venture rounds and M&A cluster.
5. **Frameworks, protocols, registries are free**; they are distribution for layers 1–4.
6. **Exit route is acquisition by incumbents**: ClickHouse, Dynatrace, Cisco, Mintlify, OpenAI, Twilio, Arcade, Anaconda, SpaceX.

### Five biggest products (by disclosed revenue or adoption)

| # | Product | Scale | Price |
|---|---|---|---|
| 1 | Cursor | $3B ARR (May 2026) | $20 / $60 / $200; Teams $40/user |
| 2 | Claude Code | >$2.5B run-rate (Feb 2026; newer figure not split out) | $20 / $100 / $200 |
| 3 | GitHub Copilot | 4.7M paid (Jan 2026), 50M users (Jul 2026); revenue undisclosed | $10 / $39; $19 and $39 per user; metered credits |
| 4 | Cognition (Devin) | ~$0.9–1B run-rate (secondary sources, unconfirmed) | $20 / $200; Teams $80 + $40/seat |
| 5 | OpenAI Codex | No revenue figure found; 135.4k GitHub stars | $8 / $20 / $100 / $200 / $500 via ChatGPT |

Ranking 3–5 is my ordering on incomplete data, not a sourced ranking. Sources are in section 5.

### Growing

- Coding agents (every major player raised or was acquired at a step-up in 2026).
- Agent governance: MCP security gateways, agent identity, NHI (Runlayer, Arcade, WhiteMatter, WorkOS, Oasis, GitGuardian).
- Sandbox compute at the top end (Modal).
- LangChain ($3B, two days ago) and Braintrust ($800M) as the surviving independents in orchestration/evals.
- Open-source terminal agents by stars: OpenCode 227k, Claude Code 156k, Codex 135k.

### Dying, shrinking or absorbed

- Independent LLM observability: Langfuse, Helicone, Promptfoo, Galileo, Arize all acquired in 2026; Helicone in maintenance mode.
- Standalone MCP directories: Smithery acquired; listing revenue is small.
- Cline-fork extensions: Roo Code shut down; Kilo acquired.
- First-generation frameworks and visual builders: AutoGen (maintenance), OpenAI Agent Builder (shutting down 2026-11-30), Relay (shut down).
- Open-source sandbox core: Daytona archived its public repo.
- Google's Jules; free Gemini CLI access.
- Generous flat-rate plans: Copilot moved to metering; Cursor and Claude Code tightened weekly limits.

### Where customers pay a lot and visibly complain

1. **GitHub Copilot metered billing (June 2026).** Users report burning a month of credits in hours; some cancel. [The Register](https://www.theregister.com/ai-and-ml/2026/06/02/github-copilot-users-threaten-exit-as-metered-billing-kicks-in/5249826), [Visual Studio Magazine](https://visualstudiomagazine.com/articles/2026/06/04/copilot-billing-shock-hits-developers.aspx), [GitHub community FAQ thread](https://github.com/orgs/community/discussions/197089) [S×n].
2. **Claude Code weekly limits on $100–$200 plans.** [GitHub issue #9424 "Weekly Usage Limits Making Claude Subscriptions Unusable"](https://github.com/anthropics/claude-code/issues/9424) (opened ~Oct 2025); Oct–Nov 2026 reports of limits draining faster, with Anthropic granting a one-off reset [S] ([Startup Fortune](https://startupfortune.com/claude-admits-recent-issues-used-more-limits-than-intended-and-offers-users-a-reset-but-that-is-not-enough/), [teamorouter](https://teamorouter.com/blogs/claude-code-limits-guide)). Core grievance: limits are given as multiples, not numbers.
3. **Cursor.** Nov 2026 forum thread ["Latest pricing and usage policy changes are a massive step backward"](https://forum.cursor.com/t/latest-pricing-and-usage-policy-changes-are-a-massive-step-backward/177104) (monthly → weekly limits) [S]; earlier July 2025 apology and refunds.
4. **LangSmith trace billing.** Cost is cited as the top reason teams migrate; trace-count and retention-upgrade surprises [S] ([inference.net](https://platform.inference.net/content/langsmith-pricing/), [dailyaifixs](https://dailyaifixs.com/blog/langsmith-pricing-2026-the-trace-billing-catch)). These are third-party blogs (some from competitors), weaker evidence than items 1–3.

Common thread in 1–3: opaque or unpredictable usage accounting on expensive plans.

---

## Could not find / unresolved

- No vendor pricing page was opened; all prices are third-party.
- Download counts (npm/PyPI) — not collected.
- Pricing: Runlayer, Manufact, Keycard, WorkOS Agent Auth, Factory, CrewAI hosted, LangGraph Platform, Cloudflare remote-MCP hosting, Docker MCP Gateway/Catalog, Patronus, Anchor Browser.
- Funding: Glama, Pydantic (company), Clerk, Aembit, Steel, Hyperbrowser, Zep (only a $500K pre-seed surfaced), CodeRabbit, Greptile, Graphite, Qodo, OpenRouter, Portkey, Warp 2026.
- Conflicts left open: CrewAI Series B (Tracxn vs PitchBook); Daytona $60M Series B; Cognition $48B round; Cursor close date and the "X Subscription" plans; Arcade pricing; LangSmith post-July pricing; Helicone "maintenance mode" (blogs say yes, GitHub README silent); Anthropic >$80B run-rate; OpenAI run-rate.
- Codex and Copilot revenue; a Claude Code revenue figure newer than Feb 2026.
- Layoff data for this niche — none surfaced.
- Datadog LLM Observability pricing/complaints; W&B Weave; Amp spin-out status; Humanloop status.
- Complaint evidence from Hacker News/Reddit directly (unreachable); complaint links above are news, GitHub and vendor forums.
- Stars not checked for: Supermemory, Cognee, Phoenix, Promptfoo, Microsoft Agent Framework, OpenAI Agents SDK, Google ADK, AutoGen, Composio, mcp-use.
