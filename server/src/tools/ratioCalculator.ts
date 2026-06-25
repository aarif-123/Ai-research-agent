import { ToolResult } from "../agent/state";

interface RatioInput {
  price?: number;
  eps?: number;
  pe?: number;
  forwardPE?: number;
  priceToBook?: number;
  debtToEquity?: number;
  currentRatio?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  grossMargins?: number;
  operatingMargins?: number;
  profitMargins?: number;
  revenueGrowth?: number;
  beta?: number;
  pegRatio?: number;
  freeCashflow?: string;
  marketCap?: string;
}

function rateMetric(
  value: number,
  thresholds: { excellent: number; good: number; fair: number },
  higherIsBetter = true
): { rating: string; score: number } {
  if (higherIsBetter) {
    if (value >= thresholds.excellent) return { rating: "Excellent", score: 95 };
    if (value >= thresholds.good) return { rating: "Good", score: 75 };
    if (value >= thresholds.fair) return { rating: "Fair", score: 50 };
    return { rating: "Poor", score: 25 };
  } else {
    if (value <= thresholds.excellent) return { rating: "Excellent", score: 95 };
    if (value <= thresholds.good) return { rating: "Good", score: 75 };
    if (value <= thresholds.fair) return { rating: "Fair", score: 50 };
    return { rating: "Poor", score: 25 };
  }
}

export async function calculateRatios(
  yahooData: any
): Promise<ToolResult> {
  try {
    if (!yahooData || yahooData.error) {
      return {
        tool: "ratioCalculator",
        data: null,
        error: "No Yahoo Finance data available for ratio calculation",
      };
    }

    const input: RatioInput = yahooData;

    const valuationAnalysis = {
      pe: {
        value: input.pe ?? 0,
        ...rateMetric(input.pe ?? 999, { excellent: 15, good: 25, fair: 35 }, false),
        interpretation:
          (input.pe ?? 0) < 15
            ? "Potentially undervalued"
            : (input.pe ?? 0) < 25
            ? "Fairly valued"
            : (input.pe ?? 0) < 35
            ? "Somewhat expensive"
            : "Potentially overvalued",
      },
      forwardPE: {
        value: input.forwardPE ?? 0,
        ...rateMetric(input.forwardPE ?? 999, { excellent: 12, good: 20, fair: 30 }, false),
      },
      pegRatio: {
        value: input.pegRatio ?? 0,
        ...rateMetric(input.pegRatio ?? 999, { excellent: 1, good: 1.5, fair: 2 }, false),
        interpretation:
          (input.pegRatio ?? 0) < 1
            ? "Undervalued relative to growth"
            : (input.pegRatio ?? 0) < 1.5
            ? "Fairly valued relative to growth"
            : "Expensive relative to growth",
      },
      priceToBook: {
        value: input.priceToBook ?? 0,
        ...rateMetric(input.priceToBook ?? 999, { excellent: 1.5, good: 3, fair: 5 }, false),
      },
    };

    const profitabilityAnalysis = {
      grossMargin: {
        value: ((input.grossMargins ?? 0) * 100).toFixed(1) + "%",
        ...rateMetric((input.grossMargins ?? 0) * 100, { excellent: 60, good: 40, fair: 20 }),
      },
      operatingMargin: {
        value: ((input.operatingMargins ?? 0) * 100).toFixed(1) + "%",
        ...rateMetric((input.operatingMargins ?? 0) * 100, { excellent: 25, good: 15, fair: 5 }),
      },
      profitMargin: {
        value: ((input.profitMargins ?? 0) * 100).toFixed(1) + "%",
        ...rateMetric((input.profitMargins ?? 0) * 100, { excellent: 20, good: 10, fair: 3 }),
      },
      roe: {
        value: ((input.returnOnEquity ?? 0) * 100).toFixed(1) + "%",
        ...rateMetric((input.returnOnEquity ?? 0) * 100, { excellent: 20, good: 12, fair: 5 }),
      },
      roa: {
        value: ((input.returnOnAssets ?? 0) * 100).toFixed(1) + "%",
        ...rateMetric((input.returnOnAssets ?? 0) * 100, { excellent: 10, good: 5, fair: 2 }),
      },
    };

    const healthAnalysis = {
      debtToEquity: {
        value: input.debtToEquity ?? 0,
        ...rateMetric(input.debtToEquity ?? 999, { excellent: 30, good: 80, fair: 150 }, false),
        interpretation:
          (input.debtToEquity ?? 0) < 30
            ? "Very low leverage"
            : (input.debtToEquity ?? 0) < 80
            ? "Moderate leverage"
            : "High leverage",
      },
      currentRatio: {
        value: input.currentRatio ?? 0,
        ...rateMetric(input.currentRatio ?? 0, { excellent: 2, good: 1.5, fair: 1 }),
        interpretation:
          (input.currentRatio ?? 0) > 2
            ? "Strong liquidity"
            : (input.currentRatio ?? 0) > 1
            ? "Adequate liquidity"
            : "Liquidity concern",
      },
      beta: {
        value: input.beta ?? 0,
        interpretation:
          (input.beta ?? 0) < 0.8
            ? "Low volatility / defensive"
            : (input.beta ?? 0) < 1.2
            ? "Market-like volatility"
            : "Higher volatility",
      },
    };

    const growthAnalysis = {
      revenueGrowth: {
        value: ((input.revenueGrowth ?? 0) * 100).toFixed(1) + "%",
        ...rateMetric((input.revenueGrowth ?? 0) * 100, { excellent: 20, good: 10, fair: 3 }),
      },
    };

    // Compute overall scores per category
    const avgScore = (items: { score?: number }[]) => {
      const scores = items.filter((i) => i.score !== undefined).map((i) => i.score!);
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
    };

    const overallScores = {
      valuation: avgScore(Object.values(valuationAnalysis)),
      profitability: avgScore(Object.values(profitabilityAnalysis)),
      financialHealth: avgScore(Object.values(healthAnalysis).filter((v) => "score" in v) as any[]),
      growth: avgScore(Object.values(growthAnalysis)),
    };

    return {
      tool: "ratioCalculator",
      data: {
        valuationAnalysis,
        profitabilityAnalysis,
        healthAnalysis,
        growthAnalysis,
        overallScores,
      },
    };
  } catch (error: any) {
    return {
      tool: "ratioCalculator",
      data: null,
      error: `Ratio calculation error: ${error.message}`,
    };
  }
}
