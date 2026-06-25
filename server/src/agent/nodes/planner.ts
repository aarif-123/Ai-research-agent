import { ChatGroq } from "@langchain/groq";
import { AgentStateType } from "../state";

export async function plannerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const llm = new ChatGroq({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
  });

  const prompt = `You are a financial research planner. Given a company name or ticker, resolve it to a ticker symbol and generate exactly 6 research questions that cover: fundamentals, growth prospects, valuation, sentiment/news, competitive moat, and risks.

Company: ${state.company}

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "ticker": "<RESOLVED_TICKER_SYMBOL>",
  "questions": [
    "<question about fundamentals and financial health>",
    "<question about growth prospects and revenue trajectory>",
    "<question about valuation relative to peers and intrinsic value>",
    "<question about market sentiment and recent news>",
    "<question about competitive moat and market position>",
    "<question about key risks and red flags>"
  ]
}`;

  const response = await llm.invoke(prompt);
  const content = typeof response.content === "string" ? response.content : "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Planner failed to produce valid JSON output.");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    ticker: parsed.ticker,
    researchQuestions: parsed.questions,
  };
}
