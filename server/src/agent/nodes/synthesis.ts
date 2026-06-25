import { ChatGroq } from "@langchain/groq";
import { AgentStateType, Evidence, Factor } from "../state";

export async function synthesisNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
  });

  // Collect tool results into a digestible summary
  const toolDataMap: Record<string, any> = {};
  for (const result of state.toolResults) {
    toolDataMap[result.tool] = result.error
      ? { error: result.error }
      : result.data;
  }

  const prompt = `You are a senior equity analyst. Given the raw tool data below for ${state.ticker} (${state.company}), produce a structured evidence object.

Score each of these 7 factors from 0 to 100 and provide a precise, data-backed reason for the score. Ensure you evaluate and factor in the overall macroeconomic context (such as interest rates, inflation, and yield spread trends retrieved from the macroEnvironment tool, if present) when scoring:
- fundamentals: Financial health (margins, ROE, debt levels, cash flow) and macroeconomic impacts
- growth: Revenue growth trajectory, earnings growth, and market expansion
- valuation: PE, PEG, PB ratios relative to peers, historical averages, and interest rate environments (restrictive rates compress multiples)
- sentiment: News sentiment, analyst opinions (including Wall Street buy/hold/sell consensus trends and social media sentiment/mentions from the finnhub tool if available), and macroeconomic market perception
- moat: Competitive advantages, barriers to entry, and pricing power
- risk: Overall risk profile (inverse — lower risk = higher score), factoring in debt-to-equity vulnerability to high interest rates, and yield curve recession warnings
- management: Capital allocation, strategic vision, and track record in navigating the macro cycle

Synthesize recent news into a concise summary with bullet points of positive and negative signals.

RAW TOOL DATA:
${JSON.stringify(toolDataMap, null, 2).slice(0, 12000)}

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "scores": {
    "fundamentals": { "value": <0-100>, "reason": "<1-sentence justification referencing specific metrics>" },
    "growth": { "value": <0-100>, "reason": "<1-sentence justification referencing growth figures>" },
    "valuation": { "value": <0-100>, "reason": "<1-sentence justification referencing PE/multiples>" },
    "sentiment": { "value": <0-100>, "reason": "<1-sentence justification referencing news tone>" },
    "moat": { "value": <0-100>, "reason": "<1-sentence justification referencing barriers to entry>" },
    "risk": { "value": <0-100>, "reason": "<1-sentence justification referencing risk profile>" },
    "management": { "value": <0-100>, "reason": "<1-sentence justification referencing track record>" }
  },
  "newsSynthesis": {
    "positive": [
      "<positive signal/highlight from the news>",
      "<another positive signal/highlight>"
    ],
    "negative": [
      "<negative signal/highlight from the news>",
      "<another negative signal/highlight>"
    ],
    "summary": "<2-sentence synthesis of overall market sentiment and news>"
  },
  "risks": [
    {"label": "<risk label>", "severity": "<LOW|MEDIUM|HIGH>", "desc": "<description>"}
  ],
  "news": [
    {"headline": "<headline>", "tone": <-1 to 1>, "source": "<source>", "url": "<url or empty>"}
  ],
  "keyMetrics": {
    "price": <number>,
    "pe": <number>,
    "revenue": "<formatted string>",
    "revenueGrowth": <decimal>,
    "grossMargin": <decimal>,
    "operatingMargin": <decimal>,
    "marketCap": "<formatted string>",
    "fiftyTwoWeekHigh": <number>,
    "fiftyTwoWeekLow": <number>
  }
}`;

  const response = await llm.invoke(prompt);
  const content = typeof response.content === "string" ? response.content : "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Synthesis node failed to produce valid JSON.");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate and provide defaults for scores
  const factors: Factor[] = [
    "fundamentals", "growth", "valuation", "sentiment", "moat", "risk", "management",
  ];
  const scores: Record<Factor, { value: number; reason: string }> = {} as Record<Factor, { value: number; reason: string }>;
  for (const f of factors) {
    const scoreObj = parsed.scores?.[f];
    scores[f] = {
      value: typeof scoreObj?.value === "number" && scoreObj.value >= 0 && scoreObj.value <= 100 ? scoreObj.value : 50,
      reason: scoreObj?.reason ?? "No justification provided.",
    };
  }

  const evidence: Evidence = {
    scores,
    risks: Array.isArray(parsed.risks)
      ? parsed.risks.map((r: any) => ({
          label: r.label ?? "Unknown",
          severity: ["LOW", "MEDIUM", "HIGH"].includes(r.severity) ? r.severity : "MEDIUM",
          desc: r.desc ?? "",
        }))
      : [],
    news: Array.isArray(parsed.news)
      ? parsed.news.slice(0, 10).map((n: any) => ({
          headline: n.headline ?? "",
          tone: typeof n.tone === "number" ? Math.max(-1, Math.min(1, n.tone)) : 0,
          source: n.source ?? "",
          url: n.url ?? "",
        }))
      : [],
    newsSynthesis: {
      positive: Array.isArray(parsed.newsSynthesis?.positive) ? parsed.newsSynthesis.positive : [],
      negative: Array.isArray(parsed.newsSynthesis?.negative) ? parsed.newsSynthesis.negative : [],
      summary: parsed.newsSynthesis?.summary ?? "No news synthesis available.",
    },
    keyMetrics: {
      price: parsed.keyMetrics?.price ?? 0,
      pe: parsed.keyMetrics?.pe ?? 0,
      revenue: parsed.keyMetrics?.revenue ?? "N/A",
      revenueGrowth: parsed.keyMetrics?.revenueGrowth ?? 0,
      grossMargin: parsed.keyMetrics?.grossMargin ?? 0,
      operatingMargin: parsed.keyMetrics?.operatingMargin ?? 0,
      marketCap: parsed.keyMetrics?.marketCap ?? "N/A",
      fiftyTwoWeekHigh: parsed.keyMetrics?.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: parsed.keyMetrics?.fiftyTwoWeekLow ?? 0,
    },
  };

  return { evidence };
}
