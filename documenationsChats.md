# 🧠 Chat Journey Documentation — AI Investment Research Agent

> **Project:** AI Investment Research Agent (IIM Assignment)
> **AI Assistant:** Antigravity (Gemini 3.5 Flash)
> **Human:** Mohmmed Aarif

---

## Table of Contents

1. [Chat 1 — Initial Project Exploration & Suggestions](#chat-1--initial-project-exploration--suggestions)
2. [Chat 2 — Tech Stack Preference & Clarifications](#chat-2--tech-stack-preference--clarifications)
3. [Chat 3 — Full Implementation Plan](#chat-3--full-implementation-plan)
4. [Chat 4 — Documentation of Chat Journey](#chat-4--documentation-of-chat-journey)
5. [Chat 5 — Hiring Manager Review & Full UI Redesign](#chat-5--hiring-manager-review--full-ui-redesign)
6. [Chat 6 — SaaS Landing Page Design & Implementation](#chat-6--saas-landing-page-design--implementation)
7. [Chat 7 — Conversation Log Retrieval](#chat-7--conversation-log-retrieval)
8. [Chat 8 — Vercel Frontend & Render Backend Deployments](#chat-8--vercel-frontend--render-backend-deployments)

---

## Chat 1 — Initial Project Exploration & Suggestions

**User Prompt:**
> *"what is your suggestion for the project"*

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
> *"i prefer react and nodejs"*

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

---

## Chat 4 — Documentation of Chat Journey

**User Prompt:**
> *"document the journey of chats in file documenationsChats.md"*

**What the AI Did:**

Created this file (`documenationsChats.md`) to capture the full conversation arc — from initial project exploration, through tech stack decisions, to the complete implementation plan. This serves as the **BONUS deliverable** (Section 7 of the README spec: "LLM logs / transcript").

---

## Chat 5 — Hiring Manager Review & Full UI Redesign

**User Prompts:**
> *"Since you asked for reality, I'll review it as if I were the engineer/hiring manager at Altuni AI Labs spending 5–7 minutes on your submission..."*
> *"redesing the ui, be AI Product Development Engineer (Intern)..."*
> *"id dont liek this , change the ui"*
> *"can you justify the descion and the numbers you hsared"*

**What the AI Did:**

1. **Critical Vulnerabilities Addressed**:
   - **Lack of Final Outcome**: Previously, the INVEST/PASS decision was not prominently highlighted.
   - **Insight-Light Dashboards**: Factor scores looked arbitrary. The user needed to see *why* a score was given (e.g. why is Growth 60 instead of 75?).
   - **Fake-Looking Logs**: Log actions had simple checkmarks, looking like static front-end animations.
   - **Dead Space**: The center panel lacked structured layout hierarchy.

2. **Visual & Structural Re-engineering**:
   - **Verdict Banner**: Re-designed the top panel to show a massive verdict (e.g., INVEST, PASS, HOLD) in neon green/red/amber alongside an SVG confidence ring and recommended position sizing (e.g., 5.0% allocation).
   - **Audit Trail & Factor scorecard**: Showed the exact weights and metrics for the 7 scoring factors (Fundamentals, Growth, Valuation, Moat, Sentiment, Risk, Management). Added collapsible "↳ justification" blocks for each score to make the LLM reasoning transparent.
   - **Committee Votes Panel**: Created a grid displaying the individual votes of the 5 board members (e.g., Growth Investor, Skeptic Risk Officer, Value Fundamentalist) to prove multi-agent consensus.
   - **Detailed Agent Log**: Refactored the logs panel so users can click on any completed crawler tool (Yahoo Finance, SEC Edgar, Risk Scorer, Moat Analyser, etc.) to inspect the raw JSON/structured return data, proving the crawlers are real.
   - **Key Drivers & Risks**: Built a two-column card layout displaying the main reasons for investing and key warning signs extracted by the agent.

---

## Chat 6 — SaaS Landing Page Design & Implementation

**User Prompt:**
> *"i am giving you prompt ajust the prompt as per current project and build on the current poject. Design a conversion-focused, free-to-use SaaS landing page that leads with a single clear value proposition..."*

**What the AI Did:**

1. **Hash Routing System**:
   - Implemented standard, lightweight hash routing (`window.location.hash`) inside `App.tsx` to switch between the marketing landing page (`#/`) and the research terminal (`#/app`) smoothly. This avoids 404 router errors on static hosts.
   - Added a "Back to Landing Page" button in the research terminal header.

2. **Designed the Landing Page**:
   - Created `LandingPage.tsx` and `LandingPage.css` featuring:
     - **Hero Section**: Outcome-led copy ("Get Actionable Investment Decisions in 60 Seconds — Free Forever"), call-to-action buttons, and trust badges explaining free access and local Indian CDN speeds.
     - **Interactive Demo Widget**: An above-the-fold live simulator displaying planner resolution, crawler progress with logs, and an final verdict orb (INVEST/PASS) on presets (NVIDIA, Tech Mahindra, Apple).
     - **Role Micro-Paths**: Segmented tabs for Retail Traders, Equity Analysts, and Portfolio Managers that dynamically update system presets.
     - **Docs & cURL Terminal**: Code switcher displaying programmatic access via Python, Node.js, and cURL requests with copy-to-clipboard functionality.
     - **Pricing**: Outlined plans in Indian Rupees (₹0 Hobbyist, ₹1,999 Pro Terminal, ₹4,999 Developer API).
     - **FAQ**: Clean, collapsible accordion question blocks.
     - **Contact Form**: Interactive email submit forms.

3. **Verification**:
   - Built the frontend bundle with `npm run build` in 1.61 seconds.
   - Executed a browser subagent that automatically clicked elements, validated simulations, and verified routing paths.

---

## Chat 7 — Conversation Log Retrieval

**User Prompt:**
> *"return the input chats log which i have given to you in output"*

**What the AI Did:**

1. Created a Python parsing script (`parse_logs.py`) to safely load the local file `transcript.jsonl` located in the workspace logs directory.
2. Filtered out all `USER_INPUT` entries, extracted the contents inside the `<USER_REQUEST>` blocks, and compiled them into a clean chronological list to present to the user.

---

## Chat 8 — Vercel Frontend & Render Backend Deployments

**User Prompts:**
> *"deploy on vercel"*
> *"https://verity-ai-api.onrender.com this is backend"*
> *"guide me how to connect the backend"*
> *"now add deployment sections"*

**What the AI Did:**

1. **Repaired Backend Compilation**:
   - Analyzed the Render log error `Cannot find module .../dist/agent/graph` that was triggered after compiling the backend to ES Modules (`"type": "module"`).
   - Reverted the package module structure in `server/package.json` and updated `server/tsconfig.json` to target **CommonJS** with standard **Node** resolution. This allows Node.js to resolve imports dynamically without requiring `.js` file extensions.
   - Built and tested the server locally, confirming successful initialization on port 3001. Pushed the fix to the GitHub repository which automatically triggered a successful Render redeployment.

2. **Resolved Public API Endpoint**:
   - Re-configured `render.yaml` to change `VITE_API_BASE_URL`'s mapping from `property: host` to `property: url`. This ensures Render passes the **public HTTPS address** (`https://verity-ai-api.onrender.com`) to the client during build time, rather than the unresolvable internal host.

3. **Configured Vercel Routing**:
   - Created `client/vercel.json` to define clean URL parameters and single-page routing rewrites so the React frontend hosts seamlessly on Vercel without breaking client-side routes.

4. **Created Frontend Deployment Instructions**:
   - Provided a guide for setting up the Vercel project using the Vite framework preset, mapping the root directory to the `client` folder, and binding the backend Render URL to the `VITE_API_BASE_URL` environment variable.

---

## Summary of Key Project Decisions

| Decision | What Was Chosen | Why |
|----------|----------------|-----|
| **Frontend** | React + Vite | Fast HMR, user preference, lightweight build output |
| **Backend** | Node.js + Express | Highly compatible with LangChain/LangGraph, simple to deploy |
| **LLM Provider** | Groq (Llama 3.3) | Blazing fast inference speeds matching the SSE streaming UX |
| **Agent State** | LangGraph.js StateGraph | Explicit node boundaries, clean state updates |
| **Routing** | Hash Routing (`#/app`) | Bulletproof routing on static hosts without server rewrite setups |
| **Pricing** | Localized INR (₹) | Customized pricing for the Indian market and local CDN low-latency notes |
| **Hosting & Cloud** | Vercel (Frontend) + Render (Backend) | Vercel delivers high-speed global static pages; Render sustains long-running, state-full SSE stream queries without timeouts |

---

## Timeline of Events

| Time / Date | Phase | Action / Event |
|-------------|-------|----------------|
| **June 22, 2026** | Setup | Discovered specifications and Next.js boilerplate |
| **June 22, 2026** | Planning | Proposed separate client + server architecture |
| **June 22, 2026** | Refactoring | Overhauled dashboard UI to justify decisions and show tool data |
| **June 22, 2026** | Landing Page | Built complete SaaS landing page with simulated widget presets |
| **June 26, 2026** | Audit | Extracted input chat logs and compiled complete project record |
| **June 26, 2026** | Deployments | Configured CommonJS compilation, added vercel.json, set VITE_API_BASE_URL to public URL, and successfully deployed to Vercel/Render |

---

> *This document was updated from the workspace conversation logs and serves as the BONUS deliverable (LLM logs/transcripts) for the Altuni AI Labs Take-Home Assignment.*
