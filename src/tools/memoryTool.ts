import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Simple in-memory chat history store
interface ChatEntry {
  userId: string;
  query: string;
  response: string;
  timestamp: number;
}

const chatHistory: ChatEntry[] = [];

// Simple string similarity (keyword overlap)
function calculateSimilarity(query1: string, query2: string): number {
  const words1 = query1.toLowerCase().split(/\s+/).filter(Boolean);
  const words2 = query2.toLowerCase().split(/\s+/).filter(Boolean);
  const intersection = words1.filter((word) => words2.includes(word));
  const union = new Set([...words1, ...words2]).size;
  return intersection.length / union;
}

// LangChain chat tool
export const cacheChatTool = tool(
  async ({ userId, query }) => {
    try {
      console.log(`[TOOL] cache_chat called for user ${userId}: "${query}"`);

      // Check chat history for similar queries
      const similarEntry = chatHistory.find(
        (entry) =>
          entry.userId === userId && calculateSimilarity(entry.query, query) >= 0.8
      );

      if (similarEntry) {
        console.log(`Cache hit for user ${userId}: "${query}"`);
        return JSON.stringify(
          {
            type: "chat_response",
            status: "EXECUTED",
            source: "cache",
            response: similarEntry.response,
            timestamp: new Date().toISOString(),
            details: {
              action: "cache_chat",
              message: "Response retrieved from cache",
            },
          },
          null,
          2
        );
      }

      // No cache hit, call Anthropic API
      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicApiKey) {
        throw new Error("ANTHROPIC_API_KEY not set in .env");
      }

      const llm = new ChatAnthropic({
        model: "claude-3-opus-20240229",
        apiKey: anthropicApiKey,
      });

      const response = await llm.invoke([
        {
          role: "user",
          content: query,
        },
      ]);

      const responseText = response.content as string;

      // Save to chat history
      chatHistory.push({
        userId,
        query,
        response: responseText,
        timestamp: Date.now(),
      });

      // Keep history manageable (last 100 entries)
      if (chatHistory.length > 100) {
        chatHistory.shift();
      }

      console.log(`API call for user ${userId}: "${query}"`);
      return JSON.stringify(
        {
          type: "chat_response",
          status: "EXECUTED",
          source: "api",
          response: responseText,
          timestamp: new Date().toISOString(),
          details: {
            action: "cache_chat",
            message: "Response fetched from Anthropic API",
          },
        },
        null,
        2
      );
    } catch (error) {
      console.error(
        `[TOOL ERROR] cache_chat failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw new Error(
        `Failed to process chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
  {
    name: "cache_chat",
    description:
      "Checks user chat history for similar queries and returns cached response if found, otherwise calls Anthropic API.",
    schema: z.object({
      userId: z.string().describe("Unique identifier for the user"),
      query: z.string().describe("The user's query"),
    }),
  }
);

// Export tools as array (like swapTokenTools)
export const chatTools = [cacheChatTool];