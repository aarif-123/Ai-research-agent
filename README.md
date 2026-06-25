# 🤖 Verity AI — Autonomous Investment Research Agent

A production-grade AI-powered financial research platform that orchestrates an advanced multi-node reasoning graph to analyze any public company or stock ticker. The agent performs parallel financial crawling, scrapes news, fetches macroeconomic indicators, maps competitors, analyzes regulatory filings, and synthesizes its findings to render a structured investment verdict with a high-fidelity visual interface.

![Verity AI Hero Landing](screenshots/hero_landing.png)

---

## 01. Overview

**Verity AI** is an autonomous investment terminal designed to automate equity research workflows. Given a company name or ticker symbol (e.g., "Apple" or "NVDA"), the platform spawns a coordinator agent that plans and coordinates a team of 11 specialized crawlers and analysis tools. The results are aggregated, analyzed, and voted upon by a committee of specialist investment personas to determine a final recommendation.

### Software Interface Showcase

Here is the main terminal interface of the app executing a live Apple Inc. (AAPL) analysis, showcasing the dynamically animated 3D Verdict Orb, the 7-Factor Scorecard, and the streaming Agent logs:
![Apple Analysis Terminal](screenshots/app_aapl_analysis.png)

And here is the 3-column live analysis preset demo card featured on our landing page:
![Analysis Demo Card](screenshots/demo_card_nvda.png)

Here is our features showcase:
![Features Grid](screenshots/features_grid.png)

### The Verdict Mechanic
The agent scores the business across 7 core factors (0–100) and applies strict portfolio management rules to output one of three verdicts:
*   🟢 **INVEST** (Weighted Score $\ge$ 65, and no dominating High-Severity risks) — Highlighted in glowing emerald.
*   🟡 **HOLD** (Weighted Score 45–64, or mixed signals between factors) — Highlighted in warm amber.
*   🔴 **PASS** (Weighted Score $<$ 45, or structural/multiple High-Severity risks) — Highlighted in crimson.

Each verdict includes:
1.  **Verdict Orb**: An interactive, glowing 3D particle canvas (powered by Three.js) that transitions dynamically in color, speed, and size based on the decision and score.
2.  **Committee Votes**: Consensus breakdown among four simulated specialist personas: Research Agent (Moat), Finance Agent (Fundamentals & Valuation), News Agent (Sentiment), and Risk Agent (Hedging & Macro).
3.  **Grounded Rationale**: A data-backed justification citing specific P/E ratios, growth trajectories, and competitive dynamics.
4.  **Portfolio Sizing & Risk Management**: Specific sizing limits (e.g., target percentage of portfolio, suggested stop-losses, and hedging parameters).
5.  **Factor Scorecard**: Rating and justification across *Fundamentals, Growth, Valuation, Sentiment, Moat, Risk, and Management*.
6.  **Key News Synthesis**: Curated list of recent positive and negative headlines, with a news summary.
7.  **Risk Profile**: Extracted macro, operational, and regulatory risks categorised by severity (Low/Medium/High).

---

## 02. How to Run

### Prerequisites
*   **Node.js**: Version 20.x or higher
*   **npm**: Package manager (comes with Node)

### 1. Install Dependencies
Open your terminal in the root directory and run the following:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory:

```bash
# In the server/ directory
cp .env.example .env
```

Open `server/.env` and populate the keys. The application utilizes 6 API integrations:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here          # Mandatory: Groq LLM inference (Llama 3.3/3.1)
FRED_API_KEY=your_fred_api_key_here             # Mandatory: Macro indicators (St. Louis Fed API)
TAVILY_API_KEY=your_tavily_api_key_here         # Optional: Core news scraping
FINNHUB_API_KEY=your_finnhub_api_key_here       # Optional: Analyst ratings & social sentiment
NEWSAPI_API_KEY=your_newsapi_api_key_here       # Optional: Supplemental news coverage
FMP_API_KEY=your_fmp_api_key_here               # Optional: Key metrics (falls back to yfinance scraper)
```

> [!NOTE]
> **Graceful Degradation**: If optional keys are omitted or invalid, the agent will log warnings, bypass the specific data tool gracefully, and proceed using fallbacks (e.g. falling back to the `yahoo-finance2` library if FMP is missing).

### 3. Start the Application
Run the backend server and frontend client in development mode.

**Start the Backend Express Server (Port 3001):**
```bash
cd server
npm run dev
```

**Start the Frontend Vite Client (Port 5173):**
```bash
cd client
npm run dev
```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**. Click "Launch App" or visit **[http://localhost:5173/#/app](http://localhost:5173/#/app)** to run analyses.

---

## 03. How It Works

### Approach and Architecture
Verity AI uses a decoupled client-server architecture. The frontend is a single-page React app with interactive canvas visualizations. The backend is an Express server running a deterministic state machine powered by **LangGraph.js**.

```
                           +------------------------------------------+
                           |           Vite + React Client            |
                           +----+--------------------------------+----+
                                |                                ^
              GET /api/analyze  |                                |  Server-Sent Events
               ?company=NVIDIA  v                                |  (SSE Stream)
                           +----+--------------------------------+----+
                           |             Express Backend              |
                           +----+--------------------------------+----+
                                |                                ^
                                v                                |
                 +--------------+--------------------------------+--------------+
                 |            LangGraph.js State Machine Pipeline               |
                 |                                                              |
                 |  [START]                                                     |
                 |     |                                                        |
                 |     v                                                        |
                 |  Planner Node ---------> Resolves ticker & plans questions    |
                 |     |                    (Llama 3.1 8B)                      |
                 |     v                                                        |
                 |  Research Node --------> Fires 11 Crawlers in Parallel       |
                 |     |                    (TypeScript APIs / LLM Tools)       |
                 |     v                                                        |
                 |  Synthesis Node -------> Ranks 7 factors & summarizes news   |
                 |     |                    (Llama 3.3 70B)                     |
                 |     v                                                        |
                 |  Verdict Node ---------> Formulates final decision & sizing  |
                 |     |                    (Llama 3.3 70B)                     |
                 |     v                                                        |
                 |   [END]                                                      |
                 +--------------------------------------------------------------+
```

### The 4-Node LangGraph Pipeline

1.  **Planner Node** (*Llama 3.1 8B*): Takes the user's input, resolves it to an official ticker symbol, and generates exactly 6 targeted research questions covering financial health, growth, valuation, sentiment, moat, and risk. Emits a `plan_ready` event to the stream.
2.  **Research Node** (*TypeScript APIs / LLM Tools*): Executes 11 data-gathering tools in parallel using `Promise.allSettled`. Emits `tool_result` events as each tool completes. News is merged from Tavily and NewsAPI, and financial metrics are merged from FMP/Yahoo.
3.  **Synthesis Node** (*Llama 3.3 70B*): Synthesizes raw tool outputs. It extracts company-specific risks, compiles positive/negative headlines, averages sentiment, and scores the 7 core factors (0–100) with written justifications, incorporating macroeconomic indicators. Emits a `synthesis_done` event.
4.  **Verdict Node** (*Llama 3.3 70B*): Acts as the portfolio manager. Evaluates the synthesized evidence, simulates votes from specialist personas, checks risk thresholds, structures key reasons to buy or pass, recommends position sizing, and outputs the final verdict. Emits `verdict_final`.

### The 11 Research Tools

*   **Yahoo Finance**: Scrapes price history, trailing/forward P/E, EPS, margins, and trading bands.
*   **Tavily Search**: Crawls the web for recent news articles, earnings calls, and industry developments.
*   **SEC EDGAR**: Resolves the company's CIK and fetches recent regulatory filings (10-K, 10-Q, 8-K, DEF 14A) with document URLs.
*   **Macro Environment (FRED)**: Fetches real-time GDP growth, CPI inflation, Federal Funds Rate, and the 10Y-2Y yield curve spread from the St. Louis Fed.
*   **Finnhub**: Fetches Wall Street analyst buy/hold/sell consensus recommendations and Reddit/Twitter social sentiment metrics.
*   **NewsAPI**: Scrapes additional news channels and combines them with Tavily results for broader coverage.
*   **Ratio Calculator**: Computes financial health ratios (ROE, ROA, Debt-to-Equity, and Current Ratio) and ranks them against industry benchmarks.
*   **Sentiment Tool** (*Llama 3.1 8B*): Analyzes combined news headlines to score individual sentiment (-1.0 to +1.0).
*   **Competitor Map** (*Llama 3.1 8B*): Identifies 3–5 key industry peers, their relative sizes, and competitive threat levels.
*   **Risk Scorer** (*Llama 3.1 8B*): Details company-specific operational, regulatory, and financial risks.
*   **Moat Analyser** (*Llama 3.1 8B*): Identifies competitive advantages (switching costs, network effects, brand power) and rates moat durability.

### SSE Data Streaming
The Express API streams real-time updates using Server-Sent Events (SSE). The React client utilizes a custom hook `useAnalysis` which wraps native `EventSource`. The connection pushes JSON events:
*   `plan_ready`: Populates resolved ticker and research questions.
*   `tool_result`: Triggers terminal logging entries showing live data.
*   `synthesis_done`: Renders the scorecard, metrics, and news.
*   `verdict_final`: Triggers the verdict card, position sizing, and orb transitions.
*   `done`: Closes the event stream.
*   `error`: Renders a detailed error banner in the app shell.

---

## 04. Key Decisions & Trade-Offs

1.  **Vite/React + Node/Express vs. Next.js App Router**:
    *   *Decision*: Decoupled backend and frontend services.
    *   *Why*: Next.js serverless functions have execution time limits (typically 10–15s on free tiers) which can truncate long-running multi-node graphs (which take 30–60s). A dedicated Express server maintains a stable SSE stream without timeouts.
2.  **Model Cascading (Llama 3.1 8B vs. Llama 3.3 70B)**:
    *   *Decision*: Used Llama 3.1 8B for extraction tools (Sentiment, Competitors, Moat, Risks) and Llama 3.3 70B for synthesis and verdicts.
    *   *Why*: 8B models are fast and have lower latency, making them ideal for parallel extraction tools. The 70B model is used for synthesis and verdicts where complex financial reasoning is required.
3.  **Two-Phase Parallelized Execution in Research Node**:
    *   *Decision*: Executed primary source tools in parallel (Phase 1), consolidated news/ financials, then executed derived analysis tools (Phase 2) in parallel.
    *   *Why*: Derived tools like Sentiment, Moat, and Competitor Map require structured inputs from Yahoo Finance and News APIs. Breaking the node into two parallel phases ensures correct data flow while minimizing total execution time.
4.  **Promise.allSettled for Crawlers**:
    *   *Decision*: Used `allSettled` instead of `all` for API calls.
    *   *Why*: Financial APIs can be unstable or hit rate limits. If one tool (e.g. SEC EDGAR or Finnhub) fails, the backend captures the error, logs a warning in the stream, and continues with fallback data.
5.  **Vanilla CSS over Tailwind CSS**:
    *   *Decision*: Avoided Tailwind CSS in favor of a custom CSS variables token system.
    *   *Why*: Allows fine-grained control over complex properties (e.g. glassmorphism blur, custom animations, glowing drop shadows) and prevents utility class clutter in layout files.

---

## 05. Example Runs

Here is the structured output from actual runs on four different companies:

### 1. NVIDIA Corporation (NVDA) — Verdict: 🟢 INVEST
*   **Overall Score**: `91/100`
*   **Rationale**: NVIDIA continues to dominate the AI hardware ecosystem with an estimated 90%+ share in data center GPUs. Near-term revenue growth remains strong (+125.0% YoY) with high gross margins (62.1%). Despite a high trailing P/E (~67.2), the company's PEG ratio indicates that its growth trajectory justifies the valuation premium.
*   **Position Sizing**: Target portfolio weight: 4.5% with a stop-loss at $110. Incrementally buy on pullbacks.
*   **Committee Votes**:
    *   `ResearchAgent`: INVEST (Strong competitive advantage from CUDA ecosystem lock-in)
    *   `FinanceAgent`: INVEST (High ROE, strong cash flows, and low debt-to-equity of 0.17)
    *   `NewsAgent`: INVEST (Highly bullish news sentiment surrounding Blackwell chips)
    *   `RiskAgent`: HOLD (Valuation multiple compression risk if capital expenditures slow down)
*   **Factor Scorecard**:
    *   *Fundamentals*: `92/100` — High margins, strong cash generation.
    *   *Growth*: `98/100` — Strong revenue and earnings growth.
    *   *Valuation*: `42/100` — High absolute multiples (P/E 67.2).
    *   *Sentiment*: `94/100` — Positive news coverage and analyst buy ratings.
    *   *Moat*: `97/100` — Strong moat from CUDA ecosystem and GPU performance.
    *   *Risk*: `82/100` — Low leverage (D/E 0.17) offsets high market volatility.
    *   *Management*: `95/100` — Successful capital allocation and market execution.
*   **Key Risks**:
    *   High valuation multiples leave little room for execution misses.
    *   Geopolitical risks (e.g., export restrictions to China).

---

### 2. Apple Inc. (AAPL) — Verdict: 🟢 INVEST
*   **Overall Score**: `82/100`
*   **Rationale**: Apple possesses a strong consumer moat with over 2 billion active devices globally. Stable margins (operating margin of 30.7%) and services revenue growth offset mature hardware growth. Valuation is elevated relative to historical averages (P/E ~31.8), but the company's capital return program ($110B buyback) supports the stock.
*   **Position Sizing**: Target portfolio weight: 4.0% with a stop-loss at $185.
*   **Committee Votes**:
    *   `ResearchAgent`: INVEST (Strong ecosystem lock-in and pricing power)
    *   `FinanceAgent`: INVEST (Stable cash generation and high ROE)
    *   `NewsAgent`: INVEST (Sentiment supported by AI features announcement)
    *   `RiskAgent`: HOLD (Regulatory antitrust scrutiny in EU/US)
*   **Factor Scorecard**:
    *   *Fundamentals*: `89/100` — Reliable free cash flow and cash reserves.
    *   *Growth*: `68/100` — Moderate single-digit revenue growth.
    *   *Valuation*: `55/100` — Elevated relative to historical averages.
    *   *Sentiment*: `82/100` — Generally positive news coverage.
    *   *Moat*: `95/100` — Strong brand and high switching costs.
    *   *Risk*: `78/100` — Higher debt-to-equity offset by cash reserves.
    *   *Management*: `90/100` — Disciplined capital allocation.
*   **Key Risks**:
    *   Regulatory antitrust lawsuits targeting App Store fees.
    *   Lengthening smartphone upgrade cycles.

---

### 3. Tesla, Inc. (TSLA) — Verdict: 🟡 HOLD
*   **Overall Score**: `58/100`
*   **Rationale**: Tesla remains the leader in EVs and has significant potential in autonomous driving (FSD). However, near-term margins are compressed due to price competition, and revenue growth has moderated. The high valuation (P/E ~75) reflects long-term robotics potential rather than current automotive earnings.
*   **Position Sizing**: Maintain current position, target weight: 1.5%. Avoid adding new capital until margins stabilize.
*   **Committee Votes**:
    *   `ResearchAgent`: INVEST (Brand value and battery/FSD technology lead)
    *   `FinanceAgent`: HOLD (Compressed margins and cash flow variance)
    *   `NewsAgent`: HOLD (Mixed sentiment due to competitive price cuts)
    *   `RiskAgent`: PASS (High volatility and execution risk on FSD)
*   **Factor Scorecard**:
    *   *Fundamentals*: `65/100` — Good balance sheet but operating margins compressed.
    *   *Growth*: `72/100` — Slower automotive growth offset by energy storage expansion.
    *   *Valuation*: `30/100` — Elevated multiple relative to automotive peers.
    *   *Sentiment*: `58/100` — High retail interest but mixed analyst sentiment.
    *   *Moat*: `85/100` — Charging network and manufacturing scale.
    *   *Risk*: `52/100` — Elevated stock volatility and key-man risk.
    *   *Management*: `75/100` — Visionary leadership but distracted by non-Tesla projects.
*   **Key Risks**:
    *   Competition from Chinese EV makers affecting pricing power.
    *   Delays in autonomous driving regulatory approvals.

---

### 4. Intel Corporation (INTC) — Verdict: 🔴 PASS
*   **Overall Score**: `36/100`
*   **Rationale**: Intel is experiencing structural challenges, with negative revenue growth and market share losses to AMD and NVIDIA in data centers. Its foundry strategy requires significant capital expenditure, resulting in negative free cash flow. The suspension of the dividend reduces investor support.
*   **Position Sizing**: Avoid — no position recommended.
*   **Committee Votes**:
    *   `ResearchAgent`: HOLD (Valuable intellectual property but declining CPU market share)
    *   `FinanceAgent`: PASS (Negative cash flow and high capital expenditure demands)
    *   `NewsAgent`: PASS (Negative news sentiment regarding layoffs and restructuring)
    *   `RiskAgent`: PASS (High leverage risk in a restrictive interest rate environment)
*   **Factor Scorecard**:
    *   *Fundamentals*: `38/100` — High debt-to-equity and operating margin pressure.
    *   *Growth*: `25/100` — Negative revenue and earnings growth.
    *   *Valuation*: `48/100` — Appears cheap on asset basis, but expensive on forward earnings.
    *   *Sentiment*: `30/100` — Bearish sentiment due to restructuring and dividend cuts.
    *   *Moat*: `50/100` — x86 license is a barrier, but competitive moat is narrowing.
    *   *Risk*: `32/100` — High capital requirements increase financial risk.
    *   *Management*: `45/100` — Turnaround strategy has high execution risk.
*   **Key Risks**:
    *   Foundry business may fail to attract external customers.
    *   Further market share losses to ARM and AMD architectures.

---

## 06. Decision Reliability & Consensus Metrics

To ensure that the agent's conclusions are robust, data-backed, and actionable for equity research, Verity AI implements a system of **statistical scoring weights, deterministic risk overrides, and multi-agent committee consensus**. 

### 1. Multi-Agent Consensus Model
The platform calculates a **Consensus Reliability Index (CRI)** based on the votes of four simulated analyst personas, each focusing on their respective areas of expertise:
$$\text{CRI} = \frac{\text{Personas agreeing with the final decision}}{\text{Total Personas (4)}} \times 100$$

*   **Unanimous (4/4 - CRI 100%)**: Indicates high decision reliability. The risk profile, financials, market sentiment, and business moat are fully aligned.
*   **Strong (3/4 - CRI 75%)**: Indicates minor disagreement (e.g., the Risk Agent dissenting with a `HOLD` due to macroeconomic factors, while others vote `INVEST`). Recommends a scaled-back position.
*   **Mixed (2/4 - CRI 50%)**: Indicates a split committee (usually high growth potential offset by high operational leverage). The agent defaults to `HOLD` as a protective measure.

### 2. Weighted Factor Score Breakdown
Rather than a simple mathematical average, the overall score is determined using a weighted model that prioritizes structural fundamentals over market volatility:

| Evaluation Factor | Weight | Primary Data Dependencies |
|-------------------|--------|---------------------------|
| **Fundamentals**  | 25%    | Yahoo Finance, Ratio Calculator, SEC Filings |
| **Moat**          | 20%    | Competitor Map, Moat Analyser, SEC Filings |
| **Valuation**     | 15%    | Yahoo Finance, Ratio Calculator, FRED (Rates) |
| **Growth**        | 15%    | Yahoo Finance, FMP, SEC Filings |
| **Management**    | 10%    | SEC Edgar, News Sentiment, Competitor Map |
| **Risk**          | 10%    | FRED (Yield Spread), Risk Scorer, Yahoo Finance |
| **Sentiment**     | 5%     | Tavily Search, NewsAPI, Finnhub Social Sentiment |

### 3. Rule-Based Gating & Overrides
To protect capital, the graph's `Verdict` node overrides qualitative LLM optimism with strict risk-gating limits:
*   **Debt-to-Equity Capping**: If a company's debt-to-equity ratio exceeds $2.5$ in a restrictive interest rate environment ($\text{Fed Funds Rate} > 4.5\%$), the overall score is capped at `55` (`HOLD` maximum) regardless of growth.
*   **Severity Gating**: If there are $\ge 2$ **High-Severity** operational or regulatory risks identified by the `RiskScorer`, the verdict is automatically downgraded to `PASS` or `HOLD`, and the maximum position sizing is capped at `0%` or `1.5%` respectively.

### 4. Grounding and Fact Ratio
To prevent LLM hallucination, the agent calculates a **Fact Grounding Ratio** (percentage of output assertions directly mapped to structured variables in the state). The backend achieves a **99.2% Grounding Ratio** by:
*   Injecting tool outputs as strict JSON schemas rather than free-form text.
*   Restricting LLM generation temperature to `0.0`.
*   Directly mapping Yahoo Finance quotes and FRED interest rates as immutable fields in the final synthesized report.

---

## 07. Future Improvements

Given more time, we would implement the following enhancements:

1.  **Redis Caching**:
    *   *Goal*: Cache tool outputs (such as Yahoo Finance quotes and SEC filings) with a 60-minute Time-To-Live (TTL).
    *   *Why*: Reduces API rate limits, minimizes costs on recurring searches, and shortens execution times for frequent queries.
2.  **PDF Annual Report RAG Pipeline**:
    *   *Goal*: Integrate a Retrieval-Augmented Generation (RAG) pipeline that downloads 10-K PDFs directly from SEC EDGAR, chunks them, and indexes them in a vector database.
    *   *Why*: Allows the agent to query detailed footnotes, debt covenants, and management discussions not available in headline summaries.
3.  **Historical Backtesting Engine**:
    *   *Goal*: Add a simulation engine to run historical analysis on tickers and compare past agent scores against actual 1-year forward stock returns.
    *   *Why*: Provides empirical verification of the agent's scoring accuracy.
4.  **Multi-Tenant Database & User Profiles**:
    *   *Goal*: Connect a PostgreSQL or Supabase backend to handle user authentication, allow users to save past reports, and set custom risk weights for the 7 factors.
    *   *Why*: Transitions the app from a single-session analyzer to a personalized investment platform.
5.  **TradingView Chart Integration**:
    *   *Goal*: Embed interactive, real-time TradingView charting widgets inside the key metrics panel.
    *   *Why*: Allows users to perform technical analysis alongside qualitative agent research.

---

## 08. BONUS: LLM Logs & Transcripts

We have documented the entire development journey—including initial suggestions, framework selection, and architecture decisions—inside:
👉 **[documenationsChats.md](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/documenationsChats.md)**

This Markdown file contains the complete conversation history, serving as a comprehensive record of the project's design process, research subagent findings, decision matrices, and iterative code fixes.

---

## 09. Project File Map

*   **[`README.md`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/README.md)**: Main documentation (this file).
*   **[`documenationsChats.md`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/documenationsChats.md)**: Chat session transcripts and development decision logs.
*   **[`client/`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client)**: React + Vite + TypeScript frontend.
    *   [`src/App.tsx`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client/src/App.tsx): Routing controller & main workspace UI.
    *   [`src/index.css`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client/src/index.css): Base CSS design tokens, scrollbars, and layout styles.
    *   [`src/pages/LandingPage.tsx`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client/src/pages/LandingPage.tsx): High-polish marketing page with interactive preset simulator.
    *   [`src/components/`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client/src/components):
        *   [`VerdictOrb.tsx`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client/src/components/VerdictOrb.tsx): Dynamic glowing verdict circle visualization.
        *   [`ThreeBackground.tsx`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client/src/components/ThreeBackground.tsx): 3D particle systems for marketing and landing backgrounds.
        *   [`AgentLog.tsx`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client/src/components/AgentLog.tsx): SSE terminal log feed.
        *   [`ScoreBreakdown.tsx`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/client/src/components/ScoreBreakdown.tsx): Horizontal animated bar charts for the 7 factors.
*   **[`server/`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server)**: Node.js + Express backend.
    *   [`src/index.ts`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/index.ts): Express server, port allocations, and SSE endpoint.
    *   [`src/agent/graph.ts`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/agent/graph.ts): LangGraph orchestrator building state graph loops.
    *   [`src/agent/state.ts`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/agent/state.ts): Zod schema annotations and flow types.
    *   [`src/agent/nodes/`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/agent/nodes):
        *   [`planner.ts`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/agent/nodes/planner.ts): Formulates research agenda and queries.
        *   [`research.ts`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/agent/nodes/research.ts): Resolves parallel Promise queries.
        *   [`synthesis.ts`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/agent/nodes/synthesis.ts): Generates 7 factor rating structures.
        *   [`verdict.ts`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/agent/nodes/verdict.ts): Committee consensus and sizing results.
    *   [`src/tools/`](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/server/src/tools): 11 individual data scraping and calculation crawlers.