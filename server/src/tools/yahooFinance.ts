import YahooFinance from "yahoo-finance2";
import { ToolResult } from "../agent/state";

const yahooFinance = new YahooFinance();

async function fetchFromFmp(ticker: string, apiKey: string): Promise<any> {
  const symbol = ticker.toUpperCase();
  
  // Concurrently fetch FMP stable endpoints
  const [profileRes, quoteRes, incomeRes, balanceRes, cashflowRes, ratiosRes, metricsRes] = await Promise.all([
    fetch(`https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${apiKey}`),
    fetch(`https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${apiKey}`),
    fetch(`https://financialmodelingprep.com/stable/income-statement?symbol=${symbol}&limit=2&apikey=${apiKey}`),
    fetch(`https://financialmodelingprep.com/stable/balance-sheet-statement?symbol=${symbol}&limit=1&apikey=${apiKey}`),
    fetch(`https://financialmodelingprep.com/stable/cash-flow-statement?symbol=${symbol}&limit=1&apikey=${apiKey}`),
    fetch(`https://financialmodelingprep.com/stable/ratios?symbol=${symbol}&limit=1&apikey=${apiKey}`),
    fetch(`https://financialmodelingprep.com/stable/key-metrics?symbol=${symbol}&limit=1&apikey=${apiKey}`)
  ]);

  if (!profileRes.ok || !quoteRes.ok) {
    throw new Error(`Profile/Quote fetch failed: Profile status ${profileRes.status}, Quote status ${quoteRes.status}`);
  }

  const [profileData, quoteData, incomeData, balanceData, cashflowData, ratiosData, metricsData] = await Promise.all([
    profileRes.json(),
    quoteRes.json(),
    incomeRes.json(),
    balanceRes.json(),
    cashflowRes.json(),
    ratiosRes.json(),
    metricsRes.json()
  ]);

  const profile = Array.isArray(profileData) ? profileData[0] : profileData;
  const quote = Array.isArray(quoteData) ? quoteData[0] : quoteData;
  const income = Array.isArray(incomeData) ? incomeData[0] : incomeData;
  const incomePrior = Array.isArray(incomeData) && incomeData.length > 1 ? incomeData[1] : null;
  const balance = Array.isArray(balanceData) ? balanceData[0] : balanceData;
  const cashflow = Array.isArray(cashflowData) ? cashflowData[0] : cashflowData;
  const ratios = Array.isArray(ratiosData) ? ratiosData[0] : ratiosData;
  const metrics = Array.isArray(metricsData) ? metricsData[0] : metricsData;

  // We need at least basic profile or quote data to consider FMP fetch successful
  if (!profile && !quote) {
    throw new Error("No profile or quote data returned from FMP");
  }

  const formatNum = (n: number | undefined | null): string => {
    if (n === undefined || n === null || isNaN(n)) return "N/A";
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    return n.toFixed(2);
  };

  const marketCapRaw = quote?.marketCap ?? profile?.marketCap ?? 0;
  const totalRevenueRaw = income?.revenue ?? 0;

  // Calculate YoY revenue growth
  let revenueGrowth = 0;
  if (income && incomePrior && incomePrior.revenue && incomePrior.revenue !== 0) {
    revenueGrowth = (income.revenue - incomePrior.revenue) / incomePrior.revenue;
  } else if (metrics?.revenueGrowth) {
    revenueGrowth = metrics.revenueGrowth;
  }

  // FMP returns ratios as decimals (e.g. 0.354), similar to what our local calculator expects
  const grossMargins = ratios?.grossProfitMargin ?? 0;
  const operatingMargins = ratios?.operatingProfitMargin ?? 0;
  const profitMargins = ratios?.netProfitMargin ?? 0;
  const returnOnEquity = ratios?.returnOnEquity ?? 0;
  const returnOnAssets = ratios?.returnOnAssets ?? 0;
  const debtToEquity = ratios?.debtEquityRatio ?? 0;
  const currentRatio = ratios?.currentRatio ?? 0;
  
  const priceToBook = metrics?.priceToBookRatio ?? 0;
  const beta = profile?.beta ?? quote?.beta ?? 0;
  const enterpriseValueRaw = metrics?.enterpriseValue ?? 0;
  const pegRatio = metrics?.pegRatio ?? 0;

  const data = {
    ticker,
    price: quote?.price ?? profile?.price ?? 0,
    previousClose: quote?.previousClose ?? profile?.price ?? 0,
    marketCap: formatNum(marketCapRaw),
    marketCapRaw,
    pe: quote?.pe ?? 0,
    forwardPE: metrics?.forwardPeRatio ?? quote?.pe ?? 0,
    eps: quote?.eps ?? 0,
    fiftyTwoWeekHigh: quote?.yearHigh ?? 0,
    fiftyTwoWeekLow: quote?.yearLow ?? 0,
    fiftyDayAverage: quote?.priceAvg50 ?? 0,
    twoHundredDayAverage: quote?.priceAvg200 ?? 0,
    volume: quote?.volume ?? profile?.volume ?? 0,
    averageVolume: quote?.avgVolume ?? profile?.averageVolume ?? 0,

    // Financial data
    totalRevenue: formatNum(totalRevenueRaw),
    totalRevenueRaw,
    revenueGrowth,
    grossMargins,
    operatingMargins,
    profitMargins,
    returnOnEquity,
    returnOnAssets,
    debtToEquity,
    currentRatio,
    freeCashflow: formatNum(cashflow?.freeCashFlow),
    operatingCashflow: formatNum(cashflow?.operatingCashFlow),

    // Key stats
    priceToBook,
    beta,
    enterpriseValue: formatNum(enterpriseValueRaw),
    pegRatio,

    currency: quote?.currency ?? profile?.currency ?? "USD",
    exchange: profile?.exchangeShortName ?? quote?.exchange ?? "",
    shortName: profile?.companyName ?? quote?.name ?? "",
  };

  return data;
}

export async function fetchYahooFinance(ticker: string): Promise<ToolResult> {
  const fmpApiKey = process.env.FMP_API_KEY;

  if (fmpApiKey) {
    try {
      console.log(`[FMP] Fetching stable metrics for ticker ${ticker}...`);
      const data = await fetchFromFmp(ticker, fmpApiKey);
      return { tool: "yahooFinance", data };
    } catch (fmpError: any) {
      console.warn(`[FMP] Fetch failed for ${ticker}: ${fmpError.message}. Falling back to Yahoo Finance...`);
    }
  }

  // Fallback to Yahoo Finance scraper library
  try {
    const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: [
        "financialData",
        "defaultKeyStatistics",
        "incomeStatementHistory",
        "earningsHistory",
      ],
    }).catch(() => null);

    const financialData = summary?.financialData;
    const keyStats = summary?.defaultKeyStatistics;

    const formatNum = (n: number | undefined | null): string => {
      if (n === undefined || n === null) return "N/A";
      if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
      if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
      if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
      return n.toFixed(2);
    };

    const data = {
      ticker,
      price: quote?.regularMarketPrice ?? 0,
      previousClose: quote?.regularMarketPreviousClose ?? 0,
      marketCap: formatNum(quote?.marketCap),
      marketCapRaw: quote?.marketCap ?? 0,
      pe: quote?.trailingPE ?? keyStats?.trailingPE ?? 0,
      forwardPE: quote?.forwardPE ?? keyStats?.forwardPE ?? 0,
      eps: quote?.epsTrailingTwelveMonths ?? 0,
      fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: quote?.fiftyTwoWeekLow ?? 0,
      fiftyDayAverage: quote?.fiftyDayAverage ?? 0,
      twoHundredDayAverage: quote?.twoHundredDayAverage ?? 0,
      volume: quote?.regularMarketVolume ?? 0,
      averageVolume: quote?.averageDailyVolume3Month ?? 0,

      // Financial data
      totalRevenue: formatNum(financialData?.totalRevenue),
      totalRevenueRaw: financialData?.totalRevenue ?? 0,
      revenueGrowth: financialData?.revenueGrowth ?? 0,
      grossMargins: financialData?.grossMargins ?? 0,
      operatingMargins: financialData?.operatingMargins ?? 0,
      profitMargins: financialData?.profitMargins ?? 0,
      returnOnEquity: financialData?.returnOnEquity ?? 0,
      returnOnAssets: financialData?.returnOnAssets ?? 0,
      debtToEquity: financialData?.debtToEquity ?? 0,
      currentRatio: financialData?.currentRatio ?? 0,
      freeCashflow: formatNum(financialData?.freeCashflow),
      operatingCashflow: formatNum(financialData?.operatingCashflow),

      // Key stats
      priceToBook: keyStats?.priceToBook ?? 0,
      beta: keyStats?.beta ?? 0,
      enterpriseValue: formatNum(keyStats?.enterpriseValue),
      pegRatio: keyStats?.pegRatio ?? 0,

      currency: quote?.currency ?? "USD",
      exchange: quote?.fullExchangeName ?? "",
      shortName: quote?.shortName ?? "",
    };

    return { tool: "yahooFinance", data };
  } catch (error: any) {
    return {
      tool: "yahooFinance",
      data: null,
      error: `Yahoo Finance fallback error: ${error.message}`,
    };
  }
}
