import { ChatGroq } from "@langchain/groq";
import { ToolResult } from "../agent/state";

export async function identifyCompetitors(
  ticker: string,
  company: string,
  financialData: any
): Promise<ToolResult> {
  try {
    const llm = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });

    const context = financialData
      ? `Market Cap: ${financialData.marketCap}, Industry: ${financialData.exchange}, Revenue: ${financialData.totalRevenue}`
      : "No financial data available";

    const prompt = `You are a competitive intelligence analyst. For the company ${company} (ticker: ${ticker}), identify the top 5 direct competitors.

Company context: ${context}

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "competitors": [
    {
      "name": "<company name>",
      "ticker": "<ticker symbol>",
      "relationship": "<how they compete>",
      "relativeSize": "<Larger|Similar|Smaller>",
      "threatLevel": "<Low|Medium|High>"
    }
  ],
  "competitiveLandscape": "<2-3 sentence summary of the competitive landscape>",
  "marketPosition": "<Leader|Strong Challenger|Challenger|Niche Player>"
}`;

    const response = await llm.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        tool: "competitorMap",
        data: { competitors: [], competitiveLandscape: "Could not parse.", marketPosition: "Unknown" },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return { tool: "competitorMap", data: parsed };
  } catch (error: any) {
    return {
      tool: "competitorMap",
      data: null,
      error: `Competitor analysis error: ${error.message}`,
    };
  }
}
