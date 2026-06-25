# 🧠 Chat Journey Documentation — AI Investment Research Agent

> **Project:** AI Investment Research Agent (IIM Assignment)
> **Date:** June 22, 2026
> **AI Assistant:** Antigravity (Claude Opus 4.6 Thinking)
> **Human:** Mohmmed Aarif

---

## Table of Contents

1. [Chat 1 — Initial Project Exploration & Suggestions](#chat-1--initial-project-exploration--suggestions)
2. [Chat 2 — Tech Stack Preference & Clarifications](#chat-2--tech-stack-preference--clarifications)
3. [Chat 3 — Full Implementation Plan](#chat-3--full-implementation-plan)
4. [Chat 4 — Documentation of Chat Journey](#chat-4--documentation-of-chat-journey)

---

## Chat 1 — Initial Project Exploration & Suggestions

**User Prompt:**
> "what is your suggestion for the project"

**What the AI Did:**

1. **Explored the project directory** (`iimAssignment/`) and discovered:
   - A detailed product specification file: `investment_agent_product_spec.html`
   - A freshly scaffolded Next.js project inside `investment-agent/` (default boilerplate, no custom code yet)

2. **Read the product spec** — a comprehensive HTML document defining:
   - 9 core product features (universal search, live agent stream, animated verdict orb, 7-factor scores, risk extraction, news sentiment, rationale, run history, export)
   - A 4-node LangGraph agent pipeline: **Planner → Research → Synthesis → Verdict**
   - 8 research tools (Yahoo Finance, Tavily, SEC EDGAR, Ratio Calculator, Sentiment, Competitor Map, Risk Scorer, Moat Analyser)
   - Full TypeScript state schema (`AgentState`)
   - Prompt engineering directives per node
   - Key design decisions and trade-offs
   - README structure with 7 required sections

3. **Inspected the existing code** — confirmed the Next.js app was at the default `create-next-app` boilerplate with no custom implementation.

**AI's Suggestions:**

- Recommended a tech stack: Next.js App Router, LangGraph.js, Anthropic Claude, Yahoo Finance, Tavily, SEC EDGAR
- Proposed a priority build order: Backend → SSE endpoint → Frontend UI → Polish
- Highlighted key differentiators to stand out:
  - The **verdict orb** as the hero UI element
  - **Real-time streaming UX** with terminal-style logs
  - **Strict JSON output** with Zod schema validation
  - **Graceful degradation** via `Promise.allSettled`
- Offered to build the entire project end-to-end

---

## Chat 2 — Tech Stack Preference & Clarifications

**User Prompt:**
> "i prefer react and nodejs"

**What the AI Did:**

1. **Asked clarifying questions** via an interactive questionnaire:

   | Question | User's Answer |
   |----------|---------------|
   | Frontend framework? | **Vite + React** |
   | Backend framework? | *(No preference stated — defaulted to Express.js)* |
   | API keys available? | **"I have Groq API keys"** |

2. **Key pivot:** The user revealed they have **Groq API keys** (not Anthropic). This changed the LLM provider from Claude to **Groq (Llama 3.3 70B)** — which is actually advantageous for speed due to Groq's fast inference.

3. **Launched a research subagent** to investigate 6 technical areas in parallel:
   - LangGraph.js StateGraph setup
   - Groq + LangChain.js integration
   - `yahoo-finance2` npm package APIs
   - `@tavily/core` search API
   - SSE streaming in Express.js with React `EventSource`
   - SEC EDGAR REST API (no key required)

**Research Findings Summary:**

| Area | Key Finding |
|------|-------------|
| **LangGraph.js** | Use `Annotation.Root` for state, `StateGraph` for graph, `.stream()` with `streamMode: "updates"` for SSE |
| **Groq** | `@langchain/groq` package, `ChatGroq` class, models: `llama-3.3-70b-versatile` (quality) + `llama-3.1-8b-instant` (speed) |
| **Yahoo Finance** | `yahoo-finance2` — `quote()`, `quoteSummary()`, `search()` for autocomplete |
| **Tavily** | `@tavily/core` — `search()` with `searchDepth: "advanced"`, free tier 1,000/month |
| **SSE** | Express: `res.writeHead()` with `text/event-stream`, React: `EventSource` API |
| **SEC EDGAR** | Free REST API, requires `User-Agent` header, CIK-based filing lookup |

---

## Chat 3 — Full Implementation Plan

**What the AI Produced:**

A comprehensive implementation plan covering the entire project architecture. Key decisions:

### Architecture: Separate Client + Server

```
iimAssignment/
├── server/          # Node.js (Express) backend
│   ├── src/
│   │   ├── index.ts           # Express + SSE
│   │   ├── agent/
│   │   │   ├── state.ts       # LangGraph state schema
│   │   │   ├── graph.ts       # StateGraph compilation
│   │   │   └── nodes/         # 4 pipeline nodes
│   │   └── tools/             # 8 research tools
│   └── package.json
│
├── client/          # React (Vite) frontend
│   ├── src/
│   │   ├── App.tsx            # Main layout
│   │   ├── hooks/             # useAnalysis SSE hook
│   │   └── components/        # 10 UI components
│   └── package.json
│
└── README.md
```

### LangGraph Pipeline Design

```
START → Planner → Research → Synthesis → Verdict → END
         │           │           │           │
    Groq 8B      8 tools    Groq 70B    Groq 70B
   (fast)     (parallel)   (quality)   (quality)
```

### LLM Model Strategy

| Node | Model | Reason |
|------|-------|--------|
| Planner | `llama-3.1-8b-instant` | Simple task (resolve ticker, generate questions), speed matters |
| Synthesis | `llama-3.3-70b-versatile` | Complex aggregation, quality matters |
| Verdict | `llama-3.3-70b-versatile` | Final decision, accuracy is critical |
| Sentiment Tool | `llama-3.1-8b-instant` | Simple classification task |
| Competitor/Risk/Moat Tools | `llama-3.1-8b-instant` | Lightweight analysis tasks |

### 8 Research Tools

| # | Tool | Data Source | What It Returns |
|---|------|-------------|-----------------|
| 1 | Yahoo Finance | `yahoo-finance2` API | Price, P/E, revenue, margins, market cap |
| 2 | Tavily Search | `@tavily/core` API | Top 5 recent news articles |
| 3 | SEC EDGAR | SEC REST API (free) | 10-K/10-Q risk factor excerpts |
| 4 | Ratio Calculator | Computed from Yahoo data | ROE, D/E, P/B, ROA |
| 5 | Sentiment Tool | Groq LLM | Tone scores (−1 to +1) per headline |
| 6 | Competitor Map | Groq LLM | 3–5 key competitors |
| 7 | Risk Scorer | Groq LLM | Macro/sector/geopolitical risks |
| 8 | Moat Analyser | Groq LLM | Competitive advantages assessment |

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `SearchBar` | Company name / ticker input |
| `VerdictOrb` | **Hero component** — animated circle (gray → green/red/amber) with score |
| `AgentLog` | Terminal-style live streaming log |
| `ScoreBreakdown` | 7-factor animated horizontal bars |
| `RiskPanel` | Risk cards with severity badges |
| `NewsPanel` | 4 news items with tone-colored stripes |
| `Rationale` | Full-paragraph verdict with position sizing |
| `KeyMetrics` | Price, P/E, Revenue, Margin cards |
| `HistorySidebar` | Past analyses from localStorage |
| `ExportButton` | Download as JSON / Markdown |

### Design System

- **Theme:** Dark (deep navy/charcoal)
- **Font:** Inter (Google Fonts)
- **Verdict Colors:**
  - 🟢 INVEST: `hsl(145, 65%, 48%)`
  - 🔴 PASS: `hsl(0, 72%, 55%)`
  - 🟡 HOLD: `hsl(40, 90%, 55%)`
- **Style:** Glassmorphism cards, smooth gradients, micro-animations

### Open Questions Raised

1. **Tavily API key** — Does the user have one, or fallback to Yahoo Finance news only?
2. **Deployment** — Local-only or deploy to Vercel/Railway?
3. **Existing Next.js scaffold** — Delete and replace with new structure?

### Verification Plan

- Backend health check: `curl http://localhost:3001/api/health`
- Full pipeline test: `curl http://localhost:3001/api/analyze?company=Apple`
- Frontend dev server: `npm run dev` on port 5173
- Manual testing: AAPL (INVEST), INTC (PASS), TSLA (HOLD) scenarios
- Graceful degradation when tools fail

---

## Chat 4 — Documentation of Chat Journey

**User Prompt:**
> "document the journey of chats in file documenationsChats.md"

**What the AI Did:**

Created this file (`documenationsChats.md`) to capture the full conversation arc — from initial project exploration, through tech stack decisions, to the complete implementation plan. This serves as the **BONUS deliverable** (Section 7 of the README spec: "LLM logs / transcript").

---

## Summary of Key Decisions Made

| Decision | What Was Chosen | Why |
|----------|----------------|-----|
| Frontend | React + Vite | User preference; modern DX, fast HMR |
| Backend | Node.js + Express | User preference; simple, widely adopted |
| LLM Provider | Groq (Llama 3.3) | User has Groq API keys; blazing fast inference |
| Agent Framework | LangGraph.js | Spec requirement; explicit node boundaries, clean SSE emit points |
| Data Transport | SSE (Server-Sent Events) | Unidirectional, lightweight, no WebSocket overhead |
| Styling | Vanilla CSS (dark theme) | Maximum control, premium look, no framework bloat |
| Primary Data | Yahoo Finance (free) | No API key friction, sufficient for MVP |
| State Management | React hooks + localStorage | Simple, no Redux overhead for this scope |

---

## Timeline

| Time (IST) | Event |
|-------------|-------|
| 16:17 | User asks for project suggestions |
| 16:17 | AI explores project structure and reads product spec |
| 16:17 | AI delivers architecture suggestions and build recommendations |
| 16:18 | User states preference: React + Node.js |
| 16:18 | AI asks clarifying questions (framework, API keys) |
| 16:19 | User confirms: Vite + React, Groq API keys |
| 16:19 | AI launches research subagent for tech stack investigation |
| 16:20 | Research complete: LangGraph.js, Groq, Yahoo Finance, Tavily, SSE, SEC EDGAR |
| 16:21 | AI delivers full implementation plan for user review |
| 16:21 | User requests chat journey documentation |
| 16:21 | AI creates `documenationsChats.md` (this file) |

---

> *This document was auto-generated from the conversation transcript and serves as both a project decision log and the BONUS deliverable for the IIM assignment.*
