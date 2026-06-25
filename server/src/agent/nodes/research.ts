import { AgentStateType, ToolResult } from "../state";
import { fetchYahooFinance } from "../../tools/yahooFinance";
import { searchTavily } from "../../tools/tavilySearch";
import { fetchSECFilings } from "../../tools/secEdgar";
import { fetchMacroEnvironment } from "../../tools/macroEnvironment";
import { fetchFinnhubData } from "../../tools/finnhub";
import { fetchNewsApiData } from "../../tools/newsApi";
import { calculateRatios } from "../../tools/ratioCalculator";
import { analyzeSentiment } from "../../tools/sentimentTool";
import { identifyCompetitors } from "../../tools/competitorMap";
import { assessRisks } from "../../tools/riskScorer";
import { analyzeMoat } from "../../tools/moatAnalyser";

export async function researchNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { ticker, company } = state;

  // Phase 1: Primary data fetch — run all data-source tools in parallel
  const [
    yahooResult,
    tavilyResult,
    secResult,
    macroResult,
    finnhubResult,
    newsApiResult,
  ] = await Promise.allSettled([
    fetchYahooFinance(ticker),
    searchTavily(ticker, company),
    fetchSECFilings(ticker),
    fetchMacroEnvironment(),
    fetchFinnhubData(ticker),
    fetchNewsApiData(ticker, company),
  ]);

  const yahoo =
    yahooResult.status === "fulfilled"
      ? yahooResult.value
      : { tool: "yahooFinance", data: null, error: `Failed: ${(yahooResult as PromiseRejectedResult).reason}` };

  const tavily =
    tavilyResult.status === "fulfilled"
      ? tavilyResult.value
      : { tool: "tavilySearch", data: null, error: `Failed: ${(tavilyResult as PromiseRejectedResult).reason}` };

  const sec =
    secResult.status === "fulfilled"
      ? secResult.value
      : { tool: "secEdgar", data: null, error: `Failed: ${(secResult as PromiseRejectedResult).reason}` };

  const macro =
    macroResult.status === "fulfilled"
      ? macroResult.value
      : { tool: "macroEnvironment", data: null, error: `Failed: ${(macroResult as PromiseRejectedResult).reason}` };

  const finnhub =
    finnhubResult.status === "fulfilled"
      ? finnhubResult.value
      : { tool: "finnhub", data: null, error: `Failed: ${(finnhubResult as PromiseRejectedResult).reason}` };

  const newsApi =
    newsApiResult.status === "fulfilled"
      ? newsApiResult.value
      : { tool: "newsApi", data: null, error: `Failed: ${(newsApiResult as PromiseRejectedResult).reason}` };

  // Combine news from Tavily and NewsAPI
  const tavilyArticles = tavily.data?.articles || [];
  const newsApiArticles = newsApi.data?.articles || [];
  const combinedArticles = [...tavilyArticles, ...newsApiArticles];

  // Phase 2: Derived analysis — these depend on Phase 1 data, run in parallel
  const [ratioResult, sentimentResult, competitorResult, riskResult, moatResult] =
    await Promise.allSettled([
      calculateRatios(yahoo.data),
      analyzeSentiment({ articles: combinedArticles }, ticker),
      identifyCompetitors(ticker, company, yahoo.data),
      assessRisks(ticker, company, yahoo.data, tavily.data),
      analyzeMoat(ticker, company, yahoo.data, null), // competitors not yet available
    ]);

  const extractResult = (
    settled: PromiseSettledResult<ToolResult>,
    fallbackTool: string
  ): ToolResult => {
    if (settled.status === "fulfilled") return settled.value;
    return {
      tool: fallbackTool,
      data: null,
      error: `Failed: ${(settled as PromiseRejectedResult).reason}`,
    };
  };

  const allResults: ToolResult[] = [
    yahoo,
    tavily,
    sec,
    macro,
    finnhub,
    newsApi,
    extractResult(ratioResult, "ratioCalculator"),
    extractResult(sentimentResult, "sentimentTool"),
    extractResult(competitorResult, "competitorMap"),
    extractResult(riskResult, "riskScorer"),
    extractResult(moatResult, "moatAnalyser"),
  ];

  return {
    toolResults: allResults,
  };
}
