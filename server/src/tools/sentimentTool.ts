import { ChatGroq } from "@langchain/groq";
import { ToolResult } from "../agent/state";

export async function analyzeSentiment(
  newsData: any,
  ticker: string
): Promise<ToolResult> {
  try {
    if (!newsData || newsData.error || !newsData.articles?.length) {
      return {
        tool: "sentimentTool",
        data: {
          overallSentiment: 0,
          sentimentLabel: "Neutral",
          newsItems: [],
          summary: "No news data available for sentiment analysis.",
        },
      };
    }

    const llm = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });

    const articlesText = newsData.articles
      .map((a: any, i: number) => `[${i + 1}] "${a.title}" — ${a.content?.slice(0, 200) ?? ""}`)
      .join("\n");

    const prompt = `You are a financial sentiment analyst. Analyze the following news articles about ${ticker} and score each headline's sentiment from -1.0 (very negative) to +1.0 (very positive).

Articles:
${articlesText}

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "overallSentiment": <number between -1 and 1>,
  "sentimentLabel": "<Strongly Bearish|Bearish|Slightly Bearish|Neutral|Slightly Bullish|Bullish|Strongly Bullish>",
  "newsItems": [
    {"headline": "<headline>", "tone": <number -1 to 1>, "source": "<source or domain>", "url": "<url if available>"}
  ],
  "summary": "<2-3 sentence summary of overall sentiment>"
}`;

    const response = await llm.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        tool: "sentimentTool",
        data: { overallSentiment: 0, sentimentLabel: "Neutral", newsItems: [], summary: "Could not parse sentiment." },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return { tool: "sentimentTool", data: parsed };
  } catch (error: any) {
    return {
      tool: "sentimentTool",
      data: null,
      error: `Sentiment analysis error: ${error.message}`,
    };
  }
}
