import { ToolResult } from "../agent/state";

export async function fetchMacroEnvironment(): Promise<ToolResult> {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return {
      tool: "macroEnvironment",
      data: null,
      error: "FRED_API_KEY environment variable is not set.",
    };
  }

  try {
    console.log("[FRED] Fetching macroeconomic indicators...");
    
    // Concurrently fetch FRED series observations
    const [gdpRes, cpiRes, ratesRes, spreadRes] = await Promise.all([
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`),
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${apiKey}&file_type=json&sort_order=desc&limit=13`),
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`),
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=T10Y2Y&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`)
    ]);

    if (!gdpRes.ok || !cpiRes.ok || !ratesRes.ok || !spreadRes.ok) {
      throw new Error(`FRED fetch failed: GDP status ${gdpRes.status}, CPI status ${cpiRes.status}, rates status ${ratesRes.status}, spread status ${spreadRes.status}`);
    }

    const [gdpData, cpiData, ratesData, spreadData] = (await Promise.all([
      gdpRes.json(),
      cpiRes.json(),
      ratesRes.json(),
      spreadRes.json()
    ])) as any[];

    const gdpObs = gdpData.observations || [];
    const cpiObs = cpiData.observations || [];
    const ratesObs = ratesData.observations || [];
    const spreadObs = spreadData.observations || [];

    // 1. GDP Growth calculation (QoQ)
    const latestGdp = parseFloat(gdpObs[0]?.value);
    const priorGdp = parseFloat(gdpObs[1]?.value);
    let gdpGrowthQoQ = 0;
    if (latestGdp && priorGdp) {
      gdpGrowthQoQ = ((latestGdp - priorGdp) / priorGdp) * 100;
    }

    // 2. Inflation Rate (YoY CPI)
    const latestCpi = parseFloat(cpiObs[0]?.value);
    // Index 12 is 12 months ago in a list of 13 sorted descending
    const priorYearCpi = parseFloat(cpiObs[12]?.value);
    let inflationYoY = 0;
    if (latestCpi && priorYearCpi) {
      inflationYoY = ((latestCpi - priorYearCpi) / priorYearCpi) * 100;
    }

    // 3. Federal Funds Rate
    const fedFundsRate = parseFloat(ratesObs[0]?.value) ?? 0;

    // 4. Yield Curve Spread (T10Y2Y)
    let yieldCurveSpread = 0;
    for (const obs of spreadObs) {
      const parsed = parseFloat(obs.value);
      if (!isNaN(parsed)) {
        yieldCurveSpread = parsed;
        break;
      }
    }

    const rateCondition = fedFundsRate > 4.5 ? "High / Restrictive" : fedFundsRate > 2.5 ? "Moderate" : "Low / Accommodative";
    const inflationCondition = inflationYoY > 4.0 ? "High" : inflationYoY > 2.0 ? "Moderate" : "Low / Target";
    const spreadCondition = yieldCurveSpread < 0 ? "Inverted Yield Curve (Recession Warning)" : "Normal Spread";

    const data = {
      gdp: {
        valueBillion: latestGdp,
        date: gdpObs[0]?.date,
        qoqGrowthPercent: gdpGrowthQoQ.toFixed(2) + "%",
      },
      inflation: {
        cpiIndex: latestCpi,
        yoyPercent: inflationYoY.toFixed(2) + "%",
        condition: inflationCondition,
        date: cpiObs[0]?.date,
      },
      interestRates: {
        fedFundsPercent: fedFundsRate.toFixed(2) + "%",
        condition: rateCondition,
        date: ratesObs[0]?.date,
      },
      yieldCurve: {
        spreadPercent: yieldCurveSpread.toFixed(2) + "%",
        condition: spreadCondition,
        date: spreadObs[0]?.date,
      },
      summary: `Macroeconomic context: Central bank interest rates are in the ${rateCondition.toLowerCase()} range (${fedFundsRate.toFixed(2)}%), inflation is ${inflationCondition.toLowerCase()} (${inflationYoY.toFixed(2)}%), and the yield curve spread is ${spreadCondition.toLowerCase()} (${yieldCurveSpread.toFixed(2)}%).`
    };

    return { tool: "macroEnvironment", data };
  } catch (error: any) {
    return {
      tool: "macroEnvironment",
      data: null,
      error: `FRED macro error: ${error.message}`,
    };
  }
}
