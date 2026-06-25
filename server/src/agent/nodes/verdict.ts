import { ChatGroq } from "@langchain/groq";
import { AgentStateType, Verdict } from "../state";

export async function verdictNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
  });

  if (!state.evidence) {
    throw new Error("No evidence available for verdict.");
  }

  const prompt = `You are a portfolio manager at a top-tier investment fund. Given the evidence object below, produce a final investment verdict for ${state.ticker} (${state.company}).

Decision rules:
- INVEST if overall weighted score >= 65 AND no HIGH-severity risks dominate
- HOLD if score is 45-64, or there are mixed signals between factors
- PASS if score < 45, or there are structural red flags (multiple HIGH risks)

Also simulate votes from four of your sub-agents based on their specializations:
1. ResearchAgent (evaluates competitive moat and business profile)
2. FinanceAgent (evaluates fundamentals and valuation ratios)
3. NewsAgent (evaluates sentiment and recent news tone)
4. RiskAgent (evaluates risks, leverage, and regulatory issues)

EVIDENCE:
${JSON.stringify(state.evidence, null, 2)}

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "decision": "<INVEST|PASS|HOLD>",
  "score": <overall weighted score 0-100>,
  "rationale": "<3-5 sentence comprehensive rationale explaining the decision, citing specific metrics and factors>",
  "positionSizing": "<specific position sizing recommendation, e.g., '2-3% of portfolio with stop-loss at $X' or 'Avoid - no position recommended'>",
  "committeeVotes": {
    "ResearchAgent": "<INVEST|PASS|HOLD>",
    "FinanceAgent": "<INVEST|PASS|HOLD>",
    "NewsAgent": "<INVEST|PASS|HOLD>",
    "RiskAgent": "<INVEST|PASS|HOLD>"
  },
  "keyWhy": [
    "<first key reason to invest/hold/pass, backed by specific data>",
    "<second key reason, backed by specific data>",
    "<third key reason, backed by specific data>"
  ],
  "keyRisks": [
    "<first critical, company-specific risk or caveat>",
    "<second critical, company-specific risk or caveat>"
  ]
}`;

  const response = await llm.invoke(prompt);
  const content = typeof response.content === "string" ? response.content : "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Verdict node failed to produce valid JSON.");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const verdict: Verdict = {
    decision: ["INVEST", "PASS", "HOLD"].includes(parsed.decision)
      ? parsed.decision
      : "HOLD",
    score: typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : 50,
    rationale: parsed.rationale ?? "No rationale provided.",
    positionSizing: parsed.positionSizing ?? "No sizing recommendation.",
    committeeVotes: parsed.committeeVotes ?? {
      ResearchAgent: "HOLD",
      FinanceAgent: "HOLD",
      NewsAgent: "HOLD",
      RiskAgent: "HOLD",
    },
    keyWhy: Array.isArray(parsed.keyWhy) ? parsed.keyWhy : [],
    keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : [],
  };

  return { verdict };
}
