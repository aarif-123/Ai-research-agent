import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { buildGraph } from "./agent/graph";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// SSE endpoint for investment analysis
app.get("/api/analyze", async (req: Request, res: Response) => {
  const company = req.query.company as string;

  if (!company) {
    res.status(400).json({ error: "Missing 'company' query parameter" });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Helper to send named SSE events
  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Handle client disconnect
  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    const graph = buildGraph();

    const stream = await graph.stream(
      { company, ticker: "", researchQuestions: [], toolResults: [], evidence: null, verdict: null },
      { streamMode: "updates" }
    );

    for await (const update of stream) {
      if (aborted) break;

      // Each update is { nodeName: nodeOutput }
      for (const [nodeName, nodeOutput] of Object.entries(update)) {
        const output = nodeOutput as any;

        switch (nodeName) {
          case "planner":
            sendEvent("plan_ready", {
              ticker: output.ticker,
              company: company,
              plan: output.researchQuestions,
            });
            break;

          case "research":
            if (Array.isArray(output.toolResults)) {
              for (const result of output.toolResults) {
                sendEvent("tool_result", {
                  tool: result.tool,
                  status: result.error ? "error" : "success",
                  data: result.data,
                });
              }
            }
            break;

          case "synthesis":
            const rawEvidence = output.evidence;
            const mappedRisks = rawEvidence?.risks?.map((r: any) => ({
              title: r.label,
              severity: r.severity,
              description: r.desc,
            })) ?? [];

            const mappedNews = rawEvidence?.news?.map((n: any) => {
              let toneStr = "neutral";
              if (n.tone > 0.1) toneStr = "positive";
              else if (n.tone < -0.1) toneStr = "negative";
              return {
                headline: n.headline,
                source: n.source,
                date: "Recent",
                tone: toneStr,
                url: n.url,
              };
            }) ?? [];

            sendEvent("synthesis_done", {
              evidence: {
                scores: rawEvidence?.scores,
                risks: mappedRisks,
                news: mappedNews,
                newsSynthesis: rawEvidence?.newsSynthesis,
                keyMetrics: rawEvidence?.keyMetrics,
              },
            });
            break;

          case "generateVerdict":
            sendEvent("verdict_final", {
              verdict: output.verdict,
            });
            break;

          default:
            break;
        }
      }
    }

    // Signal completion
    sendEvent("done", { message: "Analysis complete" });
  } catch (error: any) {
    console.error("Analysis error:", error);
    sendEvent("error", {
      message: error.message ?? "An unexpected error occurred.",
    });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Investment Agent server running on http://localhost:${PORT}`);
  console.log(`📊 SSE endpoint: GET http://localhost:${PORT}/api/analyze?company=<name>`);
});
