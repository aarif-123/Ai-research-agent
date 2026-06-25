# 🤖 AI Investment Research Agent

A production-grade AI-powered financial research assistant that executes a multi-node reasoning graph to analyze any company or stock ticker. The agent performs automated financial analysis, scrapes news and regulatory filings, maps competitors, assesses risks, and renders a structured investment verdict with an animated visual interface.

---

## 01. Overview

The **AI Investment Research Agent** is a professional investment terminal designed to automate equity research workflows. It takes any company name or ticker (e.g., "Apple" or "AAPL") and orchestrates a team of specialized analytical agents to perform a rigorous 7-factor evaluation.

### The Verdict Mechanic
At the end of the analysis, the agent outputs a structured verdict:
*   **INVEST** (Weighted Score $\ge$ 65, and no dominating high-severity risks) - Highlighted in vibrant green.
*   **HOLD** (Weighted Score between 45 and 64, or mixed signals) - Highlighted in warm amber.
*   **PASS** (Weighted Score $<$ 45, or structural red flags) - Highlighted in soft red.

Each verdict includes:
1.  **Verdict Orb**: An animated, glowing central visualization transitioning color dynamically based on the final confidence score and decision.
2.  **Grounded Rationale**: A concise 3-5 sentence justification citing specific valuation ratios and market factors.
3.  **Position Sizing**: A concrete recommendation (e.g., target percentage of portfolio, suggested stop-losses, and hedging parameters).
4.  **7-Factor Scores**: Score breakdown (0–100) across: *Fundamentals, Growth, Valuation, Sentiment, Moat, Risk, and Management*.

### Technology Stack
*   **Frontend**: React (Vite) + TypeScript + Vanilla CSS (Custom dark theme & glassmorphism layout).
*   **Backend**: Node.js + Express + TypeScript + Server-Sent Events (SSE) streaming.
*   **Agent Orchestration**: LangGraph.js (`StateGraph` for explicit execution bounds).
*   **Inference Engine**: Groq API hosting **Llama 3.3 70B** (high-quality reasoning) and **Llama 3.1 8B** (fast extraction).
*   **Data APIs**: `yahoo-finance2` (quotes & financials), Tavily Search (recent news), and SEC EDGAR REST API (filings).

---

## 02. How to Run

Follow these steps to run the application locally on your machine.

### Prerequisites
*   Node.js (version 20 or higher)
*   npm (installed with Node)
*   A **Groq API Key** (Get one at [console.groq.com](https://console.groq.com/))
*   *(Optional)* A **Tavily API Key** (Get one at [tavily.com](https://tavily.com/))

### 1. Clone & Install Dependencies
First, open your terminal in the project directory and install the dependencies for both client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
Copy the env example or use the generated `.env` file in the `server` directory:

```bash
# In the server/ directory
cp .env.example .env
```

Open `server/.env` and add your API keys:
```env
GROQ_API_KEY=gsk_your_actual_groq_key_here
TAVILY_API_KEY=tvly_your_actual_tavily_key_here  # Optional
```

*Note: If no Tavily key is supplied, the Tavily search tool will report a missing key error, and the agent will degrade gracefully using Yahoo Finance news only.*

### 3. Start the Application
Run both the server and client in development mode.

**Start the Backend Server (Port 3001):**
```bash
cd server
npm run dev
```

**Start the Frontend Client (Port 5173):**
```bash
cd client
npm run dev
```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to access the terminal.

---

## 03. How It Works

The backend utilizes **LangGraph.js** to construct a deterministic state machine with 4 nodes:

```
[START] ──> Planner ──> Research (Parallel Tools) ──> Synthesis ──> Verdict ──> [END]
```

### The 4-Node Pipeline
1.  **Planner Node** *(Llama 3.1 8B)*: Resolves the company name input to an official ticker symbol and designs 6 targeted research questions covering the evaluation metrics. Emits a `plan_ready` event.
2.  **Research Node** *(TypeScript API / LLM Tools)*: Executes all 8 research tools in parallel via `Promise.allSettled`. Emits `tool_result` events as they resolve.
3.  **Synthesis Node** *(Llama 3.3 70B)*: Gathers all raw tool outputs, structures key financial statistics, extracts risks, sentiment-scores recent headlines, and rates the 7 core factors. Emits `synthesis_done`.
4.  **Verdict Node** *(Llama 3.3 70B)*: Evaluates the synthesized evidence, applies investment decision rules, generates a portfolio-sizing strategy, and details the final investment verdict. Emits `verdict_final`.

### The 8 Research Tools
*   **Yahoo Finance**: Fetches real-time price, market cap, trailing P/E, EPS, operating/gross margins, and growth figures.
*   **Tavily Search**: Queries the live web for the top 8 recent news articles and earnings call summaries.
*   **SEC EDGAR**: Resolves the company CIK and pulls the latest 10-K/10-Q filing metadata and document URLs.
*   **Ratio Calculator**: Computes derived metrics (ROE, ROA, Debt-to-Equity, Current Ratio) and ranks them against industry benchmarks (Excellent / Good / Fair / Poor).
*   **Sentiment Tool** *(Llama 3.1 8B)*: Classifies headline tones (-1.0 to +1.0) to generate an aggregate sentiment score.
*   **Competitor Map** *(Llama 3.1 8B)*: Maps out 3-5 direct industry peers, their threat level, and relative sizes.
*   **Risk Scorer** *(Llama 3.1 8B)*: Pinpoints macro, regulatory, operational, and competitive risk variables.
*   **Moat Analyser** *(Llama 3.1 8B)*: Rates competitive advantages (high switching costs, network effects, brand power) and assigns a moat durability score.

---

## 04. Key Decisions & Trade-Offs

During architecture design, several deliberate trade-offs were made to balance speed, reliability, and visual clarity:

1.  **Server-Sent Events (SSE) vs. WebSockets**: Chosen because SSE is native, unidirectional, and works out-of-the-box on serverless hosts without the configuration complexity of full-duplex WebSockets.
2.  **Separate Synthesis and Verdict Nodes**: Separating the data aggregation (Synthesis) from the portfolio decision (Verdict) allows independent tuning of the prompt engineering and A/B testing of decision rules without contaminating raw data.
3.  **Model Cascading**: 
    *   `llama-3.1-8b-instant` is used for Planner, Sentiment, Competitor, Risk, and Moat tools where fast, parallel structured extraction is needed.
    *   `llama-3.3-70b-versatile` is used for Synthesis and Verdict where high-level financial analysis and qualitative reasoning are required.
4.  **Promise.allSettled for Tools**: If a single tool fails (e.g., SEC EDGAR times out or Tavily runs out of credits), the node captures the failure as a warning, fills in fallback data, and proceeds. Partial data is always preferred over full system crashes.
5.  **Strict JSON Schemas**: Every LLM node is strictly prompted to return structured JSON. The server parses this JSON and validates it, preventing conversational prose or explanations from leaking into structural frontend panels.

---

## 05. Example Runs to Try

To see the agent's full range of behaviors, try searching for these three companies:

1.  **Apple Inc. (AAPL)** — **Expected: INVEST or HOLD**
    *   *Why*: Strong fundamentals, high gross margins, massive competitive brand moat, but potentially high valuation score (high P/E).
2.  **Intel Corporation (INTC)** — **Expected: PASS or HOLD**
    *   *Why*: Weakening revenue growth, substantial turnaround risk, high capital expenditure requirements, and stiff competition from AMD/NVIDIA.
3.  **Tesla, Inc. (TSLA)** — **Expected: HOLD**
    *   *Why*: Strong growth trajectory and market leadership in EVs, but extremely high valuation multiples and geopolitical/macroeconomic risks.

---

## 06. Future Roadmap & Improvements

Given more time, we would add the following production-grade enhancements:
*   **Redis Caching**: Cache tool queries for the same ticker (e.g., 60-minute TTL) to avoid redundant API rate limits and improve speed on frequent searches.
*   **PDF Annual Report Ingestion**: Integrate a RAG pipeline that downloads the PDF 10-K from SEC EDGAR, chunks it, and performs vector searches for detailed accounting footnotes.
*   **Historical Backtesting**: Add a mock testing module to compare the agent's historical ratings against actual 1-year stock returns.
*   **Authentication & User Spaces**: A database layer (such as PostgreSQL) to isolate user analysis histories, save custom reports, and support multi-user sessions.

---

## 07. BONUS: LLM logs & transcripts

We have documented the entire development journey—including initial suggestions, framework selection, and architecture decisions—inside:
👉 **[documenationsChats.md](file:///c:/Users/Mohmmed%20Aarif/Downloads/iimAssignment/documenationsChats.md)**

This Markdown file contains the complete Claude conversation history, serving as a comprehensive record of the project's design process.
#   A i - r e s e a r c h - a g e n t  
 