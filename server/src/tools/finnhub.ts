import { ToolResult } from "../agent/state";

export async function fetchFinnhubData(ticker: string): Promise<ToolResult> {
  const apiKey = process.env.FINNHUB_API_KEY;
  const symbol = ticker.toUpperCase();

  // If API key is empty or placeholder, bypass gracefully
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_finnhub")) {
    return {
      tool: "finnhub",
      data: null,
      error: "FINNHUB_API_KEY is not set. Skipping Finnhub crawler.",
    };
  }

  try {
    console.log(`[Finnhub] Fetching analyst & social sentiment for ticker ${symbol}...`);
    
    const [recRes, sentimentRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/social-sentiment?symbol=${symbol}&token=${apiKey}`)
    ]);

    if (!recRes.ok || !sentimentRes.ok) {
      throw new Error(`Finnhub fetch failed: Recs status ${recRes.status}, Sentiment status ${sentimentRes.status}`);
    }

    const recs = await recRes.json() as any[];
    const sentiment = await sentimentRes.json() as any;

    // Parse latest analyst recommendation
    const latestRec = recs && recs.length > 0 ? recs[0] : null;
    let analystRecommendations = null;
    if (latestRec) {
      analystRecommendations = {
        strongBuy: latestRec.strongBuy ?? 0,
        buy: latestRec.buy ?? 0,
        hold: latestRec.hold ?? 0,
        sell: latestRec.sell ?? 0,
        strongSell: latestRec.strongSell ?? 0,
        period: latestRec.period ?? "",
        consensus: (latestRec.strongBuy * 2 + latestRec.buy) - (latestRec.sell + latestRec.strongSell * 2) > 0 ? "Bullish" : "Bearish"
      };
    }

    // Parse Reddit & Twitter sentiment
    const redditList = sentiment?.reddit || [];
    const twitterList = sentiment?.twitter || [];

    // Aggregate latest mentions and average positive scores
    let redditMentions = 0;
    let redditPositiveScoreSum = 0;
    let redditCount = 0;
    redditList.slice(0, 5).forEach((item: any) => {
      redditMentions += item.mention ?? 0;
      if (item.score !== undefined) {
        redditPositiveScoreSum += item.score;
        redditCount++;
      }
    });

    let twitterMentions = 0;
    let twitterPositiveScoreSum = 0;
    let twitterCount = 0;
    twitterList.slice(0, 5).forEach((item: any) => {
      twitterMentions += item.mention ?? 0;
      if (item.score !== undefined) {
        twitterPositiveScoreSum += item.score;
        twitterCount++;
      }
    });

    const socialSentiment = {
      reddit: {
        mentionsLast5Days: redditMentions,
        avgScore: redditCount > 0 ? parseFloat((redditPositiveScoreSum / redditCount).toFixed(2)) : 0.5,
      },
      twitter: {
        mentionsLast5Days: twitterMentions,
        avgScore: twitterCount > 0 ? parseFloat((twitterPositiveScoreSum / twitterCount).toFixed(2)) : 0.5,
      }
    };

    return {
      tool: "finnhub",
      data: {
        symbol,
        analystRecommendations,
        socialSentiment
      }
    };
  } catch (error: any) {
    return {
      tool: "finnhub",
      data: null,
      error: `Finnhub error: ${error.message}`,
    };
  }
}
