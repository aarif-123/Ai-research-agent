import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state";
import { plannerNode } from "./nodes/planner";
import { researchNode } from "./nodes/research";
import { synthesisNode } from "./nodes/synthesis";
import { verdictNode } from "./nodes/verdict";

export function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("planner", plannerNode)
    .addNode("research", researchNode)
    .addNode("synthesis", synthesisNode)
    .addNode("generateVerdict", verdictNode)
    .addEdge("__start__", "planner")
    .addEdge("planner", "research")
    .addEdge("research", "synthesis")
    .addEdge("synthesis", "generateVerdict")
    .addEdge("generateVerdict", "__end__");

  return graph.compile();
}
