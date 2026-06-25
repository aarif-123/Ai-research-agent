import axios from "axios";
import { ToolResult } from "../agent/state";

const SEC_BASE_URL = "https://efts.sec.gov/LATEST/search-index";
const EDGAR_COMPANY_URL = "https://data.sec.gov/submissions";
const USER_AGENT = "InvestmentAgent contact@example.com";

interface Filing {
  form: string;
  filingDate: string;
  description: string;
  accessionNumber: string;
  primaryDocument: string;
  url: string;
}

async function getCIK(ticker: string): Promise<string | null> {
  try {
    const response = await axios.get(
      "https://www.sec.gov/files/company_tickers.json",
      {
        headers: { "User-Agent": USER_AGENT },
        timeout: 10000,
      }
    );

    const entries = Object.values(response.data) as any[];
    const match = entries.find(
      (e: any) => e.ticker?.toUpperCase() === ticker.toUpperCase()
    );

    if (!match) return null;

    // CIK needs to be zero-padded to 10 digits
    return String(match.cik_str).padStart(10, "0");
  } catch {
    return null;
  }
}

export async function fetchSECFilings(ticker: string): Promise<ToolResult> {
  try {
    const cik = await getCIK(ticker);
    if (!cik) {
      return {
        tool: "secEdgar",
        data: { filings: [], message: `Could not resolve CIK for ${ticker}` },
      };
    }

    const response = await axios.get(
      `${EDGAR_COMPANY_URL}/CIK${cik}.json`,
      {
        headers: { "User-Agent": USER_AGENT },
        timeout: 15000,
      }
    );

    const recent = response.data.filings?.recent;
    if (!recent) {
      return {
        tool: "secEdgar",
        data: { filings: [], message: "No recent filings found" },
      };
    }

    const filings: Filing[] = [];
    const targetForms = ["10-K", "10-Q", "8-K", "DEF 14A"];
    const maxFilings = 10;

    for (let i = 0; i < recent.form.length && filings.length < maxFilings; i++) {
      const form = recent.form[i];
      if (targetForms.includes(form)) {
        const accession = recent.accessionNumber[i].replace(/-/g, "");
        filings.push({
          form,
          filingDate: recent.filingDate[i],
          description: recent.primaryDocDescription?.[i] ?? form,
          accessionNumber: recent.accessionNumber[i],
          primaryDocument: recent.primaryDocument[i],
          url: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accession}/${recent.primaryDocument[i]}`,
        });
      }
    }

    return {
      tool: "secEdgar",
      data: {
        cik,
        companyName: response.data.name ?? ticker,
        filings,
        totalFilings: filings.length,
      },
    };
  } catch (error: any) {
    return {
      tool: "secEdgar",
      data: null,
      error: `SEC EDGAR error: ${error.message}`,
    };
  }
}
