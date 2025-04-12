import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Response } from 'express';
import { memoryTool } from "../tools/memoryTool";
import { starknetTools } from "../tools/starknetTools";
import { defiTransactionsTools } from "../tools/defiTransactionsTools";
import { memeTools } from "../tools/unruggable";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
import { SYSTEM_PROMPT } from "./systemPrompt";

dotenv.config();

interface ChatResponse {
	agentMessages: string[];
	toolOutputs: any[];
	finalResponse: string;
}

const tools = [
	// ...defiLlamaTools,
	...defiTransactionsTools,
	...starknetTools,
	...memeTools,
	memoryTool,
];

const llm = new ChatAnthropic({
	clientOptions: {
		defaultHeaders: {
			"X-Api-Key": process.env.ANTHROPIC_API_KEY,
		},
	},
	modelName: "claude-3-5-sonnet-latest",
	temperature: 0.5,
	streaming: false,
});

// const llm = new ChatOpenAI({
// 	modelName: "gpt-4o-2024-11-20",
// 	temperature: 0,
// 	streaming: false,
// 	apiKey: process.env.OPEN_AI_API_KEY,
// });


export async function chatFunction(
	messages: { role: string; content: string }[], // { role :"assistant" , content:"waht is the price of agent"}
	address: string,
	existingMemory?: {
		preferences: {
			risk_tolerance: string
		},
		importantInfo: Record<string, any>,
		lastUpdated: string
	}
): Promise<ChatResponse>{
	console.log("Processing chat messages...");
	const systemMessage = SYSTEM_PROMPT;
	const memory = new MemorySaver();

	// Convert the message history to LangChain format
	const formattedMessages = messages.map(msg => {
		if (msg.role === 'user') {
			return new HumanMessage(msg.content);
		} else if (msg.role === 'assistant') {
			return new AIMessage(msg.content);
		}
		return new HumanMessage(msg.content);
	});

	// Add memory context to the last message if it exists
	if (existingMemory && formattedMessages.length > 0) {
		const lastMessage = formattedMessages[formattedMessages.length - 1];
		lastMessage.content = `${lastMessage.content}\n<previous_context>${JSON.stringify(existingMemory)}</previous_context>`;
	}

	const app = createReactAgent({
		llm,
		tools,
		messageModifier: systemMessage,
		checkpointSaver: memory,
	});

	const config = {
		configurable: {
			thread_id: "chat-thread",
		},
		recursionLimit: 10,
	};
	
	const response: ChatResponse = {
		agentMessages: [],
		toolOutputs: [],
		finalResponse: ""
	};

	try {
		for await (const events of await app.stream({
			messages: formattedMessages
		}, { ...config, streamMode: "updates" })) {
			try {
				if (events.agent && events.agent.messages && events.agent.messages.length > 0) {
					const messages = events.agent.messages;
					for (const message of messages) {
						if (message.content) {
							if (typeof message.content === "string") {
								response.agentMessages.push(message.content);
							} else if (Array.isArray(message.content)) {
								const textMessages = message.content.filter((msg: any) => msg.type === "text");
								const textContent = textMessages.map((msg: any) => msg.text).join("\n");
								response.agentMessages.push(textContent);
							}
						}
					}
					
					if (response.agentMessages.length > 0) {
						response.finalResponse = response.agentMessages[response.agentMessages.length - 1];
					}
				}
				if (events.tools && events.tools.messages) {
					for (const toolMessage of events.tools.messages) {
						if (typeof toolMessage.content === "string") {
							try {
								response.toolOutputs.push(JSON.parse(toolMessage.content));
							} catch {
								response.toolOutputs.push(toolMessage.content);
							}
						} else {
							response.toolOutputs.push(toolMessage.content);
						}
					}
				}
			} catch (error) {
				console.error("Error processing chat message:", error);
			}
		}

		console.log("The response received from agent is",response)
		return response;
	} catch (error) {
		console.error("Error in chat execution:", error);
		throw new Error("An error occurred during chat execution");
	}
}