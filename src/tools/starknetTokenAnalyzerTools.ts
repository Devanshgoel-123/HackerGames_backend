import { Tool } from "@langchain/core/tools";
import DeFiLlamaTools from "./tokenanalyzeralldata";

// Create an instance of the DeFiLlamaTools class
const defiLlamaToolsInstance = new DeFiLlamaTools();

// Export the tools array that matches the import in your agent service
export const starknetTokenAnalyzerTools: Tool[] = defiLlamaToolsInstance.createTools();