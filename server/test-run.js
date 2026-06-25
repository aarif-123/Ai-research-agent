const dotenv = require("dotenv");
dotenv.config();

const { buildGraph } = require("./dist/agent/graph");

async function runAnalysis(companyName) {
  console.log(`\n==================================================`);
  console.log(`🏃 Running analysis for: ${companyName}...`);
  console.log(`==================================================`);

  try {
    const graph = buildGraph();
    const result = await graph.invoke({
      company: companyName,
      ticker: "",
      researchQuestions: [],
      toolResults: [],
      evidence: null,
      verdict: null,
    });

    console.log(`\n✅ Finished analysis for ${companyName}!`);
    console.log(`Ticker: ${result.ticker}`);
    console.log(`Verdict: ${result.verdict?.decision}`);
    console.log(`Score: ${result.verdict?.score}/100`);
    console.log(`Rationale: ${result.verdict?.rationale}`);
    console.log(`Position Sizing: ${result.verdict?.positionSizing}`);
    console.log(`Committee Votes: ${JSON.stringify(result.verdict?.committeeVotes, null, 2)}`);
    console.log(`Key Reasons: ${JSON.stringify(result.verdict?.keyWhy, null, 2)}`);
    console.log(`Key Risks: ${JSON.stringify(result.verdict?.keyRisks, null, 2)}`);

    // Print score details
    console.log("\nFactor Scores:");
    if (result.evidence && result.evidence.scores) {
      for (const [factor, scoreObj] of Object.entries(result.evidence.scores)) {
        console.log(`- ${factor}: ${scoreObj.value}/100 -> ${scoreObj.reason}`);
      }
    }
  } catch (err) {
    console.error(`❌ Error analyzing ${companyName}:`, err);
  }
}

async function main() {
  await runAnalysis("Apple");
  await runAnalysis("NVIDIA");
  await runAnalysis("Intel");
}

main().catch(console.error);
