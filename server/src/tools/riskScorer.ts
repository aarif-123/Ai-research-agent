import { ChatGroq } from "@langchain/groq";
import { ToolResult } from "../agent/state";

export async function assessRisks(
  ticker: string,
  company: string,
  financialData: any,
  newsData: any
): Promise<ToolResult> {
  try {
    const llm = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });

    const financialContext = financialData
      ? `PE: ${financialData.pe}, Debt/Equity: ${financialData.debtToEquity}, Beta: ${financialData.beta}, Current Ratio: ${financialData.currentRatio}, Revenue Growth: ${financialData.revenueGrowth}`
      : "No financial data available";

    const newsContext = newsData?.articles
      ? newsData.articles.slice(0, 5).map((a: any) => a.title).join("; ")
      : "No news available";

    const prompt = `You are a risk assessment specialist at a hedge fund. Analyze the risks for ${company} (${ticker}).

Financial context: ${financialContext}
Recent headlines: ${newsContext}

Identify 5-8 risks across these categories: Financial, Market, Operational, Regulatory, Competitive, Macroeconomic.

CRITICAL INSTRUCTION: Avoid generic, boilerplate risks (such as 'currency fluctuation', 'interest rate risks', 'general competition', or 'macroeconomic slowdown'). Every risk MUST be highly specific to ${company}'s unique business operations, products, customers, suppliers, financial ratios, or recent news events. For example, instead of 'competition', name their specific competitor and the threat they pose. Instead of 'regulatory risk', name the specific regulation, investigation, or country-specific constraint they face.

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "risks": [
    {
      "label": "<short, company-specific risk label>",
      "severity": "<LOW|MEDIUM|HIGH>",
      "category": "<Financial|Market|Operational|Regulatory|Competitive|Macroeconomic>",
      "desc": "<1-2 sentence description detailing how this affects ${company} specifically, quoting numbers or competitors where possible>",
      "probability": "<Low|Medium|High>",
      "impact": "<Low|Medium|High>"
    }
  ],
  "overallRiskLevel": "<Low|Moderate|Elevated|High>",
  "riskSummary": "<2-3 sentence risk overview summarizing ${company}'s primary vulnerability>"
}`;

    const response = await llm.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        tool: "riskScorer",
        data: { risks: [], overallRiskLevel: "Unknown", riskSummary: "Could not assess." },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return { tool: "riskScorer", data: parsed };
  } catch (error: any) {
    return {
      tool: "riskScorer",
      data: null,
      error: `Risk assessment error: ${error.message}`,
    };
  }
}
