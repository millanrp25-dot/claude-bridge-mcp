# Market file: AI agent / dev tooling (B2B)

Running file. Updated each run; newest entry first. Full sourced detail for each run is in `raw/`.

## Run 2026-11-15 (first run)

Detail and source links: [raw/market-map.md](raw/market-map.md). Almost every price, funding and revenue figure there comes from web-search summaries of third-party pages, because vendor sites could not be opened from this environment. Only GitHub facts were read directly. Treat figures as unconfirmed unless the raw file marks them `[GH]`.

### How the money flows

1. Developers and companies pay coding-agent subscriptions: $20 / $100 / $200 per seat per month is the standard ladder, or metered credits (Copilot since June 2026).
2. Coding-agent vendors pay model providers for tokens.
3. Agent builders pay infrastructure by usage: sandboxes per vCPU-second, browsers per hour, observability per trace.
4. Enterprises pay governance vendors (MCP gateways, agent identity), mostly on quote. 2026 venture rounds and acquisitions cluster here.
5. Frameworks, protocols and registries are free; they are distribution for the layers above.

### Five biggest products

| # | Product | Scale | Price |
|---|---|---|---|
| 1 | Cursor | $3B ARR (May 2026) | $20 / $60 / $200; Teams $40/user |
| 2 | Claude Code | >$2.5B run-rate (Feb 2026) | $20 / $100 / $200 |
| 3 | GitHub Copilot | 4.7M paid (Jan 2026); revenue undisclosed | $10 / $39; metered credits |
| 4 | Cognition (Devin) | ~$0.9–1B run-rate (unconfirmed) | $20 / $200; Teams $80 + $40/seat |
| 5 | OpenAI Codex | no revenue figure found | via ChatGPT plans, $8 to $500 |

Positions 3–5 are an ordering on incomplete data, not a sourced ranking.

### Growing

- Coding agents: every major player raised or was acquired at a step-up in 2026.
- MCP security and governance gateways: Runlayer $30M (June), WhiteMatter $20M (2026-11-10).
- Agent identity: WorkOS $100M at $2B, Arcade $60M Series A, Oasis $120M.

### Dying, shrinking or absorbed

- Independent LLM observability: Langfuse → ClickHouse, Helicone → Mintlify, Promptfoo → OpenAI, Galileo → Cisco, Arize → Dynatrace ($915M).
- Roo Code (shut down 2026-05-15), Kilo Code → Anaconda, AutoGen in maintenance, OpenAI Agent Builder shutting down 2026-11-30.
- Agent memory: thinnest funding, and Anthropic and Cloudflare shipped native memory.
- Sandbox compute is near-commodity (E2B and Daytona list the same per-vCPU price); Daytona went closed-source.

### Pay a lot and still complain

- **Coding-agent subscriptions** are the clearest case: $100–$200 seats with opaque, jumping usage meters (Claude Code, Codex) and metered billing surprises (Copilot).
- LangSmith trace billing is a weaker fourth.

### Markets to watch / stop watching

- Stop watching (too funded or too close to vendor roadmaps for a solo builder): MCP gateways and governance, agent identity, sandboxes, agent memory, human-in-the-loop approval tools.
- Watch: the operational gaps around coding-agent fleets in small and mid-size teams (see `ideas.md`).

### Sources unavailable this run

Reddit, Hacker News, X, G2 and vendor sites could not be read directly. Evidence is GitHub issues and discussions plus web-search summaries.
