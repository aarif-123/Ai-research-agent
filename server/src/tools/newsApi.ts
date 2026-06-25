import { ToolResult } from "../agent/state";

export async function fetchNewsApiData(
  ticker: string,
  company: string
): Promise<ToolResult> {
  const apiKey = process.env.NEWSAPI_API_KEY;
  const symbol = ticker.toUpperCase();

  // If API key is empty or placeholder, bypass gracefully
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_newsapi")) {
    return {
      tool: "newsApi",
      data: null,
      error: "NEWSAPI_API_KEY is not set. Skipping NewsAPI crawler.",
    };
  }

  try {
    console.log(`[NewsAPI] Fetching articles for ${company} (${symbol})...`);
    
    const query = encodeURIComponent(`"${company}" OR "${symbol} stock"`);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`NewsAPI returned status ${res.status}`);
    }

    const data = await res.json() as any;
    if (data.status === "error") {
      throw new Error(data.message || "NewsAPI returned error status");
    }

    const articles = (data.articles || []).map((a: any) => ({
      title: a.title || "",
      url: a.url || "",
      content: a.description || a.content || "",
      source: a.source?.name || "",
      publishedAt: a.publishedAt || ""
    }));

    return {
      tool: "newsApi",
      data: {
        articles,
        resultCount: articles.length
      }
    };
  } catch (error: any) {
    return {
      tool: "newsApi",
      data: null,
      error: `NewsAPI error: ${error.message}`,
    };
  }
}
