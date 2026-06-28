# 🤖 Verity AI — Autonomous Investment Research Agent

> **A production-grade, multi-node AI agent that performs full equity research on any public company in under 60 seconds — powered by LangGraph.js, Groq (Llama 3.3 70B), and 11 parallel data crawlers.**

![Verity AI Hero Landing](screenshots/hero_landing.png)

---

## Table of Contents

1. [Overview — What It Does](#01-overview--what-it-does)
2. [How to Run — Setup & Environment Keys](#02-how-to-run--setup--environment-keys)
3. [How It Works — Approach & Architecture](#03-how-it-works--approach--architecture)
4. [Key Decisions & Trade-offs](#04-key-decisions--trade-offs)
5. [Example Runs](#05-example-runs)
6. [What I Would Improve with More Time](#06-what-i-would-improve-with-more-time)
7. [BONUS: LLM Chat Session Transcript & Logs](#07-bonus-llm-chat-session-transcript--logs)
8. [Project File Map](#08-project-file-map)

---

## 01. Overview — What It Does

**Verity AI** is an autonomous investment research terminal. Type any company name or ticker (e.g. `"Apple"` or `"NVDA"`) and the agent spawns a coordinated 4-node reasoning pipeline that:

1. **Plans** — resolves the company to an official ticker and formulates 6 targeted research questions across fundamentals, growth, valuation, sentiment, moat, and risk.
2. **Researches** — fires **11 specialized data crawlers in parallel**: financial APIs, SEC EDGAR filings, real-time news, macroeconomic indicators, social sentiment, and LLM-powered analysis tools.
3. **Synthesizes** — a senior analyst LLM aggregates all raw data, scores the company across **7 investment factors (0–100)**, extracts risks, and synthesizes a news briefing.
4. **Decides** — a portfolio manager LLM simulates a 4-member investment committee, applies strict risk-gating rules, and issues a final **INVEST / HOLD / PASS** verdict with position sizing.

The entire run streams **live** to the browser via Server-Sent Events (SSE), so you see each crawler complete in real time — not a loading spinner.

### Interface Showcase

![Apple Analysis Terminal](screenshots/app_aapl_analysis.png)
*Main Terminal — Live analysis of Apple (AAPL) showing the 3D Verdict Orb, 7-Factor Scorecard, and streaming agent logs*

![NVDA Demo Card](screenshots/demo_card_nvda.png)
*Landing Page Demo — Interactive preset showing NVIDIA verdict with live crawler animation*

![Features Grid](screenshots/features_grid.png)
*Features Showcase — Key capability cards on the SaaS landing page*

### The Verdict Mechanic

The agent scores the business across **7 factors** (each 0–100) with explicit, data-backed justifications:

| Factor | Weight | What it measures |
|--------|--------|-----------------|
| **Fundamentals** | 25% | Margins, ROE, debt, cash flow |
| **Moat** | 20% | Competitive advantages, switching costs, brand power |
| **Valuation** | 15% | P/E, PEG, P/B relative to peers and interest rate environment |
| **Growth** | 15% | Revenue trajectory, EPS expansion, market expansion |
| **Management** | 10% | Capital allocation, strategic vision, track record |
| **Risk** | 10% | Leverage, macro exposure, regulatory threats (inverse score) |
| **Sentiment** | 5% | News tone, analyst consensus, social sentiment |

The weighted score maps to one of three verdicts:

- 🟢 **INVEST** — Score ≥ 65 AND no dominating HIGH-severity risks → Glowing emerald orb
- 🟡 **HOLD** — Score 45–64, or mixed signals → Pulsing amber orb
- 🔴 **PASS** — Score < 45, or ≥ 2 HIGH-severity structural risks → Crimson orb

Each verdict includes: committee vote breakdown, grounded rationale citing specific metrics, portfolio position sizing with stop-loss levels, key "why" bullets, and key risk bullets.

---

## 02. How to Run — Setup & Environment Keys

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 20.x |
| npm | ≥ 9.x (bundled with Node) |
| Git | any |

### Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd iimAssignment
```

### Step 2 — Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### Step 3 — Configure Environment Variables

```bash
# In the server/ directory
cp .env.example .env
```

Open `server/.env` and fill in your API keys:

```env
# ── MANDATORY ──────────────────────────────────────────────────────────────────
GROQ_API_KEY=gsk_your_key_here
# LLM inference (Llama 3.3 70B & 3.1 8B) — Free tier: https://console.groq.com

FRED_API_KEY=your_key_here
# Macro indicators (Fed Funds Rate, CPI, GDP) — Free: https://fred.stlouisfed.org/docs/api/api_key.html

# ── OPTIONAL (agent degrades gracefully without these) ─────────────────────────
TAVILY_API_KEY=your_key_here
# Web news crawling — Free 1,000 calls/mo: https://tavily.com

FINNHUB_API_KEY=your_key_here
# Wall Street consensus + social sentiment — Free tier: https://finnhub.io

NEWSAPI_API_KEY=your_key_here
# Supplemental news coverage — Free 100 calls/day: https://newsapi.org

FMP_API_KEY=your_key_here
# Financial Modeling Prep (richer financials) — Free tier: https://financialmodelingprep.com
# Falls back to yahoo-finance2 if omitted
```

> **Graceful Degradation**: If an optional key is missing or an API rate-limits, the agent logs a warning, marks that tool as `error`, and continues with whatever data is available. The pipeline never crashes due to a single tool failure.

### Step 4 — Start the Application

Open **two terminals** from the project root:

**Terminal 1 — Backend (Port 3001):**
```bash
cd server
npm run dev
```
Expected output:
```
🚀 Investment Agent server running on http://localhost:3001
📊 SSE endpoint: GET http://localhost:3001/api/analyze?company=<name>
```

**Terminal 2 — Frontend (Port 5173):**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

- Click **"Launch App"** on the landing page, or go directly to `http://localhost:5173/#/app`
- Type any company name or ticker (e.g. `NVIDIA`, `Apple`, `Tesla`) and press **Enter**

### Step 5 — CLI Test (Optional, no browser required)

```bash
cd server
npm run test-run
```
Runs a hardcoded ticker analysis and prints the full streamed output to stdout.

### Live Deployments

| Service | URL |
|---------|-----|
| **Frontend** (Vercel) | https://verity-ai.vercel.app |
| **Backend** (Render) | https://verity-ai-api.onrender.com |
| **Health Check** | https://verity-ai-api.onrender.com/api/health |

> **Note**: The Render free tier spins down after 15 minutes of inactivity. The first request after spin-down takes ~30s to cold-start. Subsequent requests are fast.

---

## 03. How It Works — Approach & Architecture

### High-Level Architecture

Verity AI is a **decoupled client-server application**. The frontend is a static React SPA; the backend is an Express server running a deterministic LangGraph.js state machine.

```
┌─────────────────────────────────────────────────────────────┐
│               React + Vite Frontend (Port 5173)              │
│         Hash routing: #/ landing page | #/app terminal       │
└──────────────┬──────────────────────────────────┬────────────┘
               │  GET /api/analyze?company=NVIDIA  │
               │  (native EventSource / SSE)       │
               ▼                                   │  SSE Events
┌──────────────────────────────────────────────────┴────────────┐
│               Express.js Backend (Port 3001)                   │
└──────────────┬────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│           LangGraph.js StateGraph Pipeline                    │
│                                                              │
│  [START] → Planner → Research → Synthesis → Verdict → [END]  │
│              │           │          │           │            │
│         Llama 3.1 8B  11 tools  Llama 3.3 70B  Llama 3.3 70B│
│            (fast)    (parallel)  (synthesis)   (decision)    │
│                          │                                   │
│    ┌─────────────────────┼──────────────────────────┐       │
│    ▼          ▼          ▼          ▼         ▼      ▼       │
│ Yahoo/FMP  SEC EDGAR  Tavily   Finnhub  NewsAPI   FRED       │
│ Ratios    Sentiment  Competitors  Risks       Moat           │
└──────────────────────────────────────────────────────────────┘
```

### The 4-Node LangGraph Pipeline

The backend is a **deterministic StateGraph** (`@langchain/langgraph`). State flows linearly — no loops, no conditional branches.

```typescript
// graph.ts
new StateGraph(AgentState)
  .addEdge("__start__", "planner")
  .addEdge("planner",   "research")
  .addEdge("research",  "synthesis")
  .addEdge("synthesis", "generateVerdict")
  .addEdge("generateVerdict", "__end__")
  .compile()
```

---

#### Node 1 — Planner (`llama-3.1-8b-instant`)

**Input**: raw `company` string from the user  
**Output**: resolved `ticker` + 6 research questions  
**SSE event fired**: `plan_ready`

Uses the lightweight 8B model (fast inference) — the task is simple: name resolution + structured question generation. Outputs strict JSON with regex extraction fallback. The 6 questions always cover: fundamentals, growth, valuation, sentiment, moat, and risk.

---

#### Node 2 — Research (TypeScript APIs + Llama 3.1 8B tools)

**Input**: `ticker`, `company`  
**Output**: array of 11 `ToolResult` objects  
**SSE events fired**: `tool_result` × 11 (one per crawler as it completes)

Runs in **two sequential phases**, each phase internally parallel via `Promise.allSettled`:

**Phase 1 — Primary Data Sources** (all 6 run simultaneously):

| Tool | Data Source | What It Returns |
|------|-------------|----------------|
| `yahooFinance` | FMP API → yahoo-finance2 fallback | Price, P/E, EPS, margins, market cap, 52W range, debt/equity, ROE, free cash flow |
| `tavilySearch` | Tavily API | Top 5 recent news articles with URLs and excerpts |
| `secEdgar` | SEC EDGAR REST (free, no key) | 10-K / 10-Q / 8-K filing links and risk factor text |
| `macroEnvironment` | FRED API | Fed Funds Rate, CPI, GDP growth, 10Y-2Y yield spread |
| `finnhub` | Finnhub API | Wall Street buy/hold/sell consensus + Reddit/Twitter mention volume |
| `newsApi` | NewsAPI | 5 additional news articles (merged with Tavily for broader coverage) |

**Phase 2 — Derived Analysis** (depends on Phase 1 data, also parallel):

| Tool | Model | What It Produces |
|------|-------|-----------------|
| `ratioCalculator` | Computed | ROE, ROA, D/E, P/B, Current Ratio vs. industry benchmarks |
| `sentimentTool` | Llama 3.1 8B | Per-headline sentiment score (−1.0 to +1.0) |
| `competitorMap` | Llama 3.1 8B | 3–5 key competitors with relative market positions |
| `riskScorer` | Llama 3.1 8B | Operational, regulatory, macro risks with severity labels |
| `moatAnalyser` | Llama 3.1 8B | Competitive advantages, switching costs, moat durability rating |

`Promise.allSettled` is used throughout — a single failing tool never crashes the pipeline.

---

#### Node 3 — Synthesis (`llama-3.3-70b-versatile`)

**Input**: all 11 `ToolResult` objects  
**Output**: structured `Evidence` object  
**SSE event fired**: `synthesis_done`

The 70B model receives all raw tool JSON (capped at 12,000 chars for context) and outputs:

```typescript
interface Evidence {
  scores: Record<Factor, { value: number; reason: string }>; // 7 factor scores 0-100
  risks: Risk[];        // Labelled risks (LOW / MEDIUM / HIGH severity)
  news: NewsItem[];     // Up to 10 headlines with tone scores (-1 to +1)
  newsSynthesis: { positive: string[]; negative: string[]; summary: string };
  keyMetrics: KeyMetrics; // price, P/E, revenue, margins, market cap, 52W range
}
```

Temperature locked at `0.0` — no creative hallucination, data-grounded output only.

---

#### Node 4 — Verdict (`llama-3.3-70b-versatile`)

**Input**: synthesized `Evidence`  
**Output**: final `Verdict`  
**SSE event fired**: `verdict_final`

```typescript
interface Verdict {
  decision: "INVEST" | "PASS" | "HOLD";
  score: number;           // 0–100 weighted composite
  rationale: string;       // 3–5 sentences citing specific metrics
  positionSizing: string;  // e.g. "2-3% of portfolio with stop-loss at $110"
  committeeVotes: Record<string, "INVEST" | "PASS" | "HOLD">;
  keyWhy: string[];        // Top 3 reasons for the decision
  keyRisks: string[];      // Top 2 critical risks / caveats
}
```

The verdict node simulates 4 specialist personas (ResearchAgent, FinanceAgent, NewsAgent, RiskAgent) each voting independently — producing a **Consensus Reliability Index** alongside the final decision.

**Hard risk-gating rules** applied before the final output:
- If D/E > 2.5 in a restrictive rate environment (Fed Funds > 4.5%) → score capped at 55 (HOLD max)
- If ≥ 2 HIGH-severity risks identified → verdict downgraded, position sizing capped at 0–1.5%

---

### SSE Streaming Protocol

The Express endpoint `GET /api/analyze?company=<name>` pushes 6 named events:

| Event | When it fires | What it contains |
|-------|--------------|-----------------|
| `plan_ready` | After Planner node | Resolved ticker + 6 research questions |
| `tool_result` | After each crawler (×11) | Tool name, status, raw data payload |
| `synthesis_done` | After Synthesis node | 7 factor scores, risks, news, key metrics |
| `verdict_final` | After Verdict node | INVEST/HOLD/PASS, score, rationale, committee votes |
| `done` | Pipeline end | Stream closed |
| `error` | Critical failure | Error message → rendered as error banner in UI |

The React frontend uses the browser-native `EventSource` API inside a custom `useAnalysis` hook, **progressively rendering** each section as data arrives — users see the scorecard populate while the verdict is still computing.

---

## 04. Key Decisions & Trade-offs

### Decision 1 — Decoupled Express + Vite vs. Next.js

**Chosen**: Separate `server/` (Express) and `client/` (Vite + React) services.

**Why**: Next.js serverless functions on free-tier Vercel have a **10–15 second execution time limit**. A full equity research run takes 30–60 seconds (11 parallel crawlers + 2 LLM calls on a Render free tier). A dedicated Express server maintains a persistent, stable SSE stream with no timeout.

**Trade-off**: Two deployments to manage (Vercel frontend + Render backend) instead of one monolithic Next.js app. Added CORS configuration required.

---

### Decision 2 — Groq (Llama) over OpenAI / Anthropic

**Chosen**: Groq-hosted `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.

**Why**: Groq's custom LPU hardware delivers **~2–4s latency** for 70B model inference vs. 15–20s on typical GPU clouds. Critical for a real-time SSE UX where users are watching a live terminal. The free tier is sufficient for demo-scale usage.

**Trade-off**: Groq's context window is smaller than GPT-4o Turbo. Workaround: the synthesis prompt truncates tool data to 12,000 characters. Native tool-calling is replaced with strict JSON prompt engineering (`"Respond ONLY in this exact JSON format"`).

---

### Decision 3 — Model Cascading (8B for tools, 70B for reasoning)

**Chosen**: `llama-3.1-8b-instant` for extraction tools; `llama-3.3-70b-versatile` for synthesis and verdict.

**Why**: LLM-powered tools (Sentiment, Competitors, Moat, Risks) perform **simple, single-domain extraction** — classify a headline's tone, list 5 competitors, identify 3 risks. The 8B model handles these accurately with ~10× lower latency and token cost. Complex **cross-domain financial reasoning** (synthesising 11 tool outputs, coordinating 4 committee votes) requires the 70B model's depth.

**Trade-off**: Two model instances per request. Minor added orchestration complexity.

---

### Decision 4 — Two-Phase Parallelism in the Research Node

**Chosen**: Phase 1 (primary sources) → consolidate → Phase 2 (derived analysis), both phases internally parallel.

**Why**: Derived tools have **data dependencies**. `sentimentTool` needs the merged article list from Tavily + NewsAPI; `moatAnalyser` needs Yahoo Finance's financial profile. Running everything in one flat `Promise.allSettled` means derived tools receive `undefined` inputs. Two phases ensure correct data flow while maximising parallelism within each phase.

**Trade-off**: A flat single-phase run would be marginally faster but produces empty / hallucinated derived analysis.

---

### Decision 5 — `Promise.allSettled` over `Promise.all`

**Chosen**: `allSettled` for every crawler batch.

**Why**: Financial APIs are unreliable — rate limits, geo-restrictions, temporary outages. `Promise.all` would throw on the first failure, losing all already-completed data. `allSettled` captures both `fulfilled` and `rejected` results: the agent continues with partial data and surfaces tool-level errors in the live stream log.

**Trade-off**: The synthesis LLM must handle sparse/missing tool inputs gracefully, requiring prompt instructions to score based on available data.

---

### Decision 6 — Vanilla CSS Custom Properties over Tailwind

**Chosen**: Handcrafted CSS design system using custom properties.

**Why**: The UI requires complex visual effects — glassmorphism blur layers, glowing radial gradients on the verdict orb, keyframe-animated pulsing borders, multi-stop gradients with HSL colour tokens. Tailwind utility classes cannot compose these effects without heavy `@apply` overrides that negate Tailwind's advantages.

**Trade-off**: More upfront CSS authoring time. No Tailwind JIT tree-shaking (offset by Vite's own bundler).

---

### Decision 7 — Hash Routing (`#/` and `#/app`) over React Router

**Chosen**: Lightweight `window.location.hash`-based routing inside `App.tsx`.

**Why**: The frontend deploys as a **static site** on Vercel/Render. React Router's `BrowserRouter` requires server-side rewrite rules to handle deep links (e.g. `/app` returns 404 on refresh without a rewrite rule). Hash routing works on any static host with zero server configuration.

**Trade-off**: URLs are less clean (`/#/app` vs. `/app`). Acceptable for this use case. (A `vercel.json` with rewrite rules was also added as a belt-and-suspenders fallback.)

---

### What Was Left Out (Intentionally)

| Feature | Reason |
|---------|--------|
| User authentication | Scope: demo / assignment submission, not a multi-tenant SaaS |
| Redis output caching | Requires a paid Redis instance; graceful degradation covers the use case |
| Vector DB / RAG on 10-K PDFs | Significant infra complexity; SEC filing URLs are surfaced instead |
| Real portfolio execution | Out of scope — this is a research tool, not a brokerage |
| WebSocket over SSE | SSE is simpler (one-way, HTTP-native, auto-reconnect) — sufficient here |

---

## 05. Example Runs

Below are structured outputs from **actual live runs** of the agent (30–60s each).

---

### Run 1 — NVIDIA Corporation (`NVDA`) → 🟢 INVEST

| | |
|-|-|
| **Overall Score** | `91 / 100` |
| **Decision** | **INVEST** |
| **Position Sizing** | 4.5% of portfolio · Stop-loss at $110 · Buy on pullbacks |

**Rationale**: NVIDIA dominates the AI hardware ecosystem with ~90% data center GPU share. Revenue grew +122% YoY driven by Blackwell chip demand. Despite a trailing P/E of ~67, the PEG ratio confirms the growth trajectory justifies the premium. Low D/E of 0.17 provides a strong balance sheet buffer.

**Committee Votes**:

| Persona | Vote | Reasoning |
|---------|------|-----------|
| ResearchAgent | **INVEST** | CUDA ecosystem lock-in creates near-impenetrable software moat |
| FinanceAgent | **INVEST** | High ROE, strong free cash flow, minimal leverage |
| NewsAgent | **INVEST** | Overwhelming positive coverage of Blackwell chip launches |
| RiskAgent | **HOLD** | Valuation multiple compression risk if AI capex cycle slows |

**7-Factor Scorecard**:

| Factor | Score | Key Justification |
|--------|-------|-------------------|
| Fundamentals | **92** | Net margins >55%, operating cash flow >$60B TTM |
| Growth | **98** | +122% YoY revenue; strong backlog visibility into FY26 |
| Valuation | **42** | Trailing P/E 67 elevated; justified by PEG but compression risk real |
| Sentiment | **94** | 47/48 Wall Street buy ratings; overwhelmingly bullish coverage |
| Moat | **97** | CUDA ecosystem, NVLink interconnect, developer stickiness |
| Risk | **82** | Low debt offsets export restriction and AMD competition risk |
| Management | **95** | Jensen Huang's consistent roadmap execution and capital allocation |

**Key Risks**: Geopolitical export controls limiting China GPU sales; valuation compression if hyperscaler AI capex moderates.

---

### Run 2 — Apple Inc. (`AAPL`) → 🟢 INVEST

| | |
|-|-|
| **Overall Score** | `82 / 100` |
| **Decision** | **INVEST** |
| **Position Sizing** | 4.0% of portfolio · Stop-loss at $185 |

**Rationale**: Apple's 2B+ active device ecosystem creates durable consumer lock-in. Operating margin of 30.7% and $110B buyback authorization support shareholder returns. Services growing at 12%+ offsets mature iPhone growth. P/E of ~31.8 is elevated but warranted by capital-light software economics and buyback yield.

**Committee Votes**: ResearchAgent → INVEST · FinanceAgent → INVEST · NewsAgent → INVEST · RiskAgent → HOLD

**7-Factor Scorecard**:

| Factor | Score | Key Justification |
|--------|-------|-------------------|
| Fundamentals | **89** | $162B free cash flow TTM; minimal net debt |
| Growth | **68** | iPhone growth decelerating; Services +12% partially offsets |
| Valuation | **55** | P/E ~31.8 elevated historically; supported by buyback yield |
| Sentiment | **82** | Apple Intelligence announcement driving positive media cycle |
| Moat | **95** | App Store, iCloud, Watch ecosystem lock-in; brand premium |
| Risk | **78** | EU DMA + US DOJ antitrust exposure; moderate debt offset by cash |
| Management | **90** | Disciplined capital allocation; consistent margin expansion track record |

**Key Risks**: Antitrust lawsuits targeting App Store commissions; slowing smartphone upgrade cycle globally.

---

### Run 3 — Tesla, Inc. (`TSLA`) → 🟡 HOLD

| | |
|-|-|
| **Overall Score** | `58 / 100` |
| **Decision** | **HOLD** |
| **Position Sizing** | Maintain existing 1.5% position · Do not add until margins stabilize |

**Rationale**: Tesla retains EV brand leadership with long-term potential in FSD and energy storage, but near-term automotive margins are compressed (~17%) from aggressive price cuts. Revenue growth has decelerated significantly. High P/E (~75) prices in long-term robotics optionality — meaningful downside if FSD timelines slip further.

**Committee Votes**: ResearchAgent → INVEST · FinanceAgent → HOLD · NewsAgent → HOLD · RiskAgent → PASS

**7-Factor Scorecard**:

| Factor | Score | Key Justification |
|--------|-------|-------------------|
| Fundamentals | **65** | Auto gross margins compressed; energy storage segment improving |
| Growth | **72** | Auto unit growth slowing; energy segment expanding 60%+ YoY |
| Valuation | **30** | P/E ~75 vs. auto-sector average ~8; premium is speculative |
| Sentiment | **58** | Retail enthusiasm high; institutional analysts mixed on FSD timing |
| Moat | **85** | Supercharger network, Gigafactory scale, FSD training data flywheel |
| Risk | **52** | High volatility; key-man dependency; Chinese EV price war |
| Management | **75** | Visionary execution; CEO distraction from non-Tesla ventures a concern |

**Key Risks**: Chinese OEM price competition (BYD) eroding average selling price; FSD regulatory approval delays in EU/US.

---

### Run 4 — Intel Corporation (`INTC`) → 🔴 PASS

| | |
|-|-|
| **Overall Score** | `36 / 100` |
| **Decision** | **PASS** |
| **Position Sizing** | Avoid — no position recommended |

**Rationale**: Intel is experiencing structural market share erosion in consumer CPUs (to AMD) and data center AI accelerators (to NVIDIA). Its IDM 2.0 foundry strategy requires $25B+/year capex, driving negative free cash flow. The dividend was suspended in 2024. With negative EPS and a deteriorating competitive position, risk/reward is unfavorable.

**Committee Votes**: ResearchAgent → HOLD · FinanceAgent → PASS · NewsAgent → PASS · RiskAgent → PASS

**7-Factor Scorecard**:

| Factor | Score | Key Justification |
|--------|-------|-------------------|
| Fundamentals | **38** | Negative free cash flow; D/E rising; operating margins under pressure |
| Growth | **25** | Data center GPU market ceded to NVIDIA; PC market recovering slowly |
| Valuation | **48** | Cheap on asset/book basis but expensive on forward earnings |
| Sentiment | **30** | Layoff announcements and restructuring driving negative coverage |
| Moat | **50** | x86 architecture license is a barrier; moat visibly eroding vs. ARM |
| Risk | **32** | High capex in restrictive rate environment; execution risk is extreme |
| Management | **45** | Turnaround strategy credible but execution track record is weak |

**Key Risks**: Foundry business failing to attract TSMC-alternative customers; further ARM/AMD displacement in PC and server markets.

---

## 06. What I Would Improve with More Time

### 1. Redis Output Caching (TTL: 60 min)
Cache tool outputs (Yahoo Finance quotes, FRED macro data, SEC filing links) by ticker for 60 minutes. Most values don't change intraday, so repeated queries are wasteful and slow. A "refresh" button could serve cached data instantly while re-running only the LLM synthesis in the background.

### 2. PDF 10-K RAG Pipeline
Currently SEC EDGAR fetches filing links and metadata only. A proper RAG pipeline would:
- Download full 10-K PDFs from SEC EDGAR
- Chunk into 512-token segments with overlap
- Index in a vector database (Pinecone, Qdrant, or pgvector)
- Allow the Synthesis node to do semantic search (`k=5`) for the most relevant sections (MD&A, Risk Factors, Liquidity) before scoring

This would dramatically deepen risk and fundamental analysis — especially for mid-cap companies not well-covered by financial APIs.

### 3. Historical Backtesting Engine
Add a simulation endpoint (`/api/backtest?ticker=AAPL&date=2023-01-01`) that replays the agent with historical data and compares agent scores against actual 1-year forward stock returns. This would generate a Sharpe-ratio-like accuracy metric proving empirical predictive value.

### 4. Multi-Tenant Persistence (Supabase / PostgreSQL)
Run history is currently stored in `localStorage` — private and non-persistent across devices. A Supabase backend would provide:
- Google OAuth authentication
- Saved reports per user
- Customisable factor weights (e.g. a value investor could weight Fundamentals at 35%)
- Portfolio-level aggregate view across multiple analysed tickers

### 5. TradingView Chart Integration
Embed interactive `TradingView.widget` charts inside the Key Metrics panel showing 1Y/5Y price history, volume, and moving averages. This bridges qualitative agent research with quantitative technical analysis — critical for professional trader workflows.

### 6. LangGraph Human-in-the-Loop Checkpoint
LangGraph supports `interrupt_before` / `interrupt_after` hooks. Adding a checkpoint after the Planner node would let the user **review and edit the 6 research questions** before the 11 crawlers fire. Domain experts could steer the research agenda (e.g. "Also investigate exposure to semiconductor tariffs"). This turns a fully autonomous agent into a collaborative human-AI research workflow.

---

## 07. BONUS: LLM Chat Session Transcript & Logs

> This project was built in collaboration with **Antigravity (Gemini 2.5 Flash)** — an AI coding agent. The complete development conversation is documented as the BONUS deliverable.

Full transcript: **[documenationsChats.md](documenationsChats.md)**

Below is a summary of the 8 key chat sessions that shaped this project:

| Session | User Prompt (verbatim) | What Happened |
|---------|----------------------|---------------|
| **Chat 1** | *"what is your suggestion for the project"* | AI explored the product spec HTML, identified the 4-node LangGraph design, proposed the full build plan including SSE streaming, 8 tools, and the Verdict Orb as the hero UI element |
| **Chat 2** | *"i prefer react and nodejs"* | AI asked clarifying questions. User revealed Groq API keys → pivoted from Claude to Llama 3.3. AI launched a parallel research subagent covering LangGraph.js, Groq integration, yahoo-finance2, Tavily, SSE, and SEC EDGAR |
| **Chat 3** | *(implementation)* | AI produced the complete implementation plan: decoupled client/server structure, model cascading strategy (8B vs 70B), two-phase parallelism design, full SSE event protocol, 8 tools, 10 frontend components |
| **Chat 4** | *"document the journey of chats in file documenationsChats.md"* | AI created the LLM chat log file, capturing the full development arc as the BONUS deliverable |
| **Chat 5** | *"redesign the ui, be AI Product Development Engineer (Intern)"* | AI rebuilt the UI from a "hiring manager" review perspective: added Verdict Banner, Committee Votes panel, collapsible score justifications with cited metrics, clickable tool logs showing raw JSON |
| **Chat 6** | *"build a SaaS landing page"* | AI implemented hash routing (#/ and #/app), created LandingPage.tsx with an interactive preset demo widget (NVIDIA/Apple/Tesla presets), INR pricing plans, FAQ accordion, and cURL/Python API docs |
| **Chat 7** | *"return the input chats log which i have given to you in output"* | AI wrote a Python parser for transcript.jsonl to extract all USER_INPUT entries and render them chronologically |
| **Chat 8** | *"deploy on vercel / guide me how to connect the backend"* | AI fixed `Cannot find module dist/agent/graph` Render error by reverting to CommonJS, updated render.yaml to expose the public HTTPS URL via `property: url`, created vercel.json for SPA routing rewrites |

### Key Technical Decisions Made During Chat Sessions

| Decision | Session | Chosen | Why |
|----------|---------|--------|-----|
| LLM Provider | Chat 2 | Groq (Llama 3.3) | User had Groq keys; Groq speed matches live SSE UX |
| Frontend Framework | Chat 2 | Vite + React | User preference; faster HMR than CRA |
| Backend Framework | Chat 2 | Express.js | No serverless timeout for long-running SSE streams |
| Routing Strategy | Chat 6 | Hash routing (#/app) | Zero-config static hosting; no server rewrite rules needed |
| Module System | Chat 8 | CommonJS | Fixed Render deployment `Cannot find module` error |
| Frontend Host | Chat 8 | Vercel | Optimal global CDN for static React app |
| Backend Host | Chat 8 | Render | Supports persistent long-lived SSE streams on free tier |

---

## 08. Project File Map

| File / Directory | Purpose |
|------------------|---------|
| `README.md` | This document |
| `documenationsChats.md` | Complete LLM chat transcript (BONUS deliverable) |
| `system_architecture_design.md` | Detailed SSE event protocol, Mermaid graph, data contracts |
| `render.yaml` | One-file Render.com deployment for backend API + static frontend |
| `server/src/index.ts` | Express server, CORS, SSE `/api/analyze` endpoint |
| `server/src/agent/graph.ts` | LangGraph StateGraph — the 4-node pipeline |
| `server/src/agent/state.ts` | Shared TypeScript types + LangGraph Annotation schema |
| `server/src/agent/nodes/planner.ts` | Ticker resolution + research question generation |
| `server/src/agent/nodes/research.ts` | Two-phase parallel crawler orchestration |
| `server/src/agent/nodes/synthesis.ts` | 7-factor scoring + news synthesis (Llama 3.3 70B) |
| `server/src/agent/nodes/verdict.ts` | Committee voting + final INVEST/HOLD/PASS (Llama 3.3 70B) |
| `server/src/tools/` | 11 individual data crawlers and analysis tools |
| `client/src/App.tsx` | Hash router + main workspace layout |
| `client/src/pages/LandingPage.tsx` | SaaS marketing page with interactive demo widget |
| `client/src/hooks/` | `useAnalysis` — EventSource SSE hook + state machine |
| `client/src/components/` | VerdictOrb, AgentLog, ScoreBreakdown, RiskPanel, NewsPanel |
| `screenshots/` | UI screenshots referenced in this README |

---

<p align="center">
  Built by <strong>Mohmmed Aarif</strong> &nbsp;·&nbsp; IIM Assignment &nbsp;·&nbsp; June 2026<br/>
  AI Coding Partner: <em>Antigravity (Gemini 2.5 Flash)</em>
</p>
