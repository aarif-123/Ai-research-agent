import { tavily } from "@tavily/core";
import { ToolResult } from "../agent/state";

export async function searchTavily(
  ticker: string,
  company: string
): Promise<ToolResult> {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return {
        tool: "tavilySearch",
        data: null,
        error: "TAVILY_API_KEY not set",
      };
    }

    const client = tavily({ apiKey });

    const response = await client.search(
      `${company} (${ticker}) stock latest news financial analysis 2024 2025`,
      {
        maxResults: 8,
        searchDepth: "advanced",
        includeAnswer: true,
      }
    );

    const articles = response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content.slice(0, 500),
      score: r.score,
    }));

    return {
      tool: "tavilySearch",
      data: {
        answer: response.answer ?? "",
        articles,
        resultCount: articles.length,
      },
    };
  } catch (error: any) {
    return {
      tool: "tavilySearch",
      data: null,
      error: `Tavily search error: ${error.message}`,
    };
  }
}
