import { Annotation } from "@langchain/langgraph";

// ── Shared Types ──────────────────────────────────────────────────────────

export type Factor =
  | "fundamentals"
  | "growth"
  | "valuation"
  | "sentiment"
  | "moat"
  | "risk"
  | "management";

export interface ToolResult {
  tool: string;
  data: any;
  error?: string;
}

export interface Risk {
  label: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  desc: string;
}

export interface NewsItem {
  headline: string;
  tone: number; // -1 to +1
  source: string;
  url?: string;
}

export interface KeyMetrics {
  price: number;
  pe: number;
  revenue: string;
  revenueGrowth: number;
  grossMargin: number;
  operatingMargin: number;
  marketCap: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

export interface NewsSynthesis {
  positive: string[];
  negative: string[];
  summary: string;
}

export interface Evidence {
  scores: Record<Factor, { value: number; reason: string }>;
  risks: Risk[];
  news: NewsItem[];
  newsSynthesis: NewsSynthesis;
  keyMetrics: KeyMetrics;
}

export interface Verdict {
  decision: "INVEST" | "PASS" | "HOLD";
  score: number;
  rationale: string;
  positionSizing: string;
  committeeVotes: Record<string, "INVEST" | "PASS" | "HOLD">;
  keyWhy: string[];
  keyRisks: string[];
}

// ── LangGraph State Annotation ────────────────────────────────────────────

export const AgentState = Annotation.Root({
  company: Annotation<string>(),
  ticker: Annotation<string>(),
  researchQuestions: Annotation<string[]>(),
  toolResults: Annotation<ToolResult[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  evidence: Annotation<Evidence | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  verdict: Annotation<Verdict | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
