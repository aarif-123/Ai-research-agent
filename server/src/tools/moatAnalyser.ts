import { ChatGroq } from "@langchain/groq";
import { ToolResult } from "../agent/state";

export async function analyzeMoat(
  ticker: string,
  company: string,
  financialData: any,
  competitorData: any
): Promise<ToolResult> {
  try {
    const llm = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });

    const financialContext = financialData
      ? `Gross Margin: ${financialData.grossMargins}, Operating Margin: ${financialData.operatingMargins}, ROE: ${financialData.returnOnEquity}, Market Cap: ${financialData.marketCap}`
      : "No financial data available";

    const competitorContext = competitorData?.competitors
      ? competitorData.competitors.map((c: any) => `${c.name} (${c.threatLevel} threat)`).join(", ")
      : "Unknown competitors";

    const prompt = `You are a strategic moat analyst (Warren Buffett style). Analyze the economic moat for ${company} (${ticker}).

Financial context: ${financialContext}
Key competitors: ${competitorContext}

Evaluate these moat sources: Brand Power, Network Effects, Switching Costs, Cost Advantages, Intangible Assets (patents, licenses), Efficient Scale.

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "moatRating": "<None|Narrow|Wide>",
  "moatScore": <number 0-100>,
  "moatSources": [
    {
      "source": "<moat source name>",
      "strength": "<Weak|Moderate|Strong>",
      "evidence": "<1-2 sentence evidence>"
    }
  ],
  "durability": "<Low|Medium|High>",
  "moatTrend": "<Eroding|Stable|Strengthening>",
  "summary": "<2-3 sentence moat analysis>"
}`;

    const response = await llm.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        tool: "moatAnalyser",
        data: { moatRating: "Unknown", moatScore: 50, moatSources: [], durability: "Unknown", moatTrend: "Unknown", summary: "Could not analyze." },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return { tool: "moatAnalyser", data: parsed };
  } catch (error: any) {
    return {
      tool: "moatAnalyser",
      data: null,
      error: `Moat analysis error: ${error.message}`,
    };
  }
}
