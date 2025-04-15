import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
import { EnduFiDepositTool,EnduFiWithdrawTool,StrkFarmDepositTool,StrkFarmWithdrawTool } from "../tools/DepositWithdrawtool";
import { DEPOSIT_WITHDRAW_SYSTEM_PROMPT } from "./depositAgentPrompt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
dotenv.config();

interface ChatResponse {
    agentMessages: string[];
    toolOutputs: any[];
    finalResponse: string;
}

const tools = [
    EnduFiDepositTool,
    EnduFiWithdrawTool,
    StrkFarmDepositTool,
    StrkFarmWithdrawTool
];

export const llm=new ChatGoogleGenerativeAI({
    model:"gemini-2.0-flash",
    apiKey:`${process.env.GEMINI_API_KEY}`,
    maxRetries:2
  })

export async function DepositWithdrawAgentFunction(
    messages: { role: string; content: string }[],
    address: string,
    existingMemory?: {
        preferences: {
            risk_tolerance: string
        },
        importantInfo: Record<string, any>,
        lastUpdated: string
    }
): Promise<ChatResponse> {
    const memory = new MemorySaver();
    const systemMessage = DEPOSIT_WITHDRAW_SYSTEM_PROMPT.replace("{{address}}", address);
    const formattedMessages = messages.map(msg =>
        msg.role === "assistant"
            ? new AIMessage(msg.content)
            : new HumanMessage(msg.content)
    );

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
        recursionLimit: 5,
    };

    const response: ChatResponse = {
        agentMessages: [],
        toolOutputs: [],
        finalResponse: "",
    };

    try {
        for await (const events of await app.stream(
            { messages: formattedMessages },
            { ...config, streamMode: "updates" }
        )) {
            if (events.agent?.messages?.length) {
                for (const message of events.agent.messages) {
                    if (typeof message.content === "string") {
                        response.agentMessages.push(message.content);
                    } else if (Array.isArray(message.content)) {
                        const texts = message.content
                            .filter((msg: any) => msg.type === "text")
                            .map((msg: any) => msg.text)
                            .join("\n");
                        response.agentMessages.push(texts);
                    }
                }
                response.finalResponse = response.agentMessages.at(-1) || "";
            }

            if (events.tools?.messages?.length) {
                for (const toolMessage of events.tools.messages) {
                    try {
                        const parsed = typeof toolMessage.content === "string"
                            ? JSON.parse(toolMessage.content)
                            : toolMessage.content;
                        response.toolOutputs.push(parsed);
                    } catch {
                        response.toolOutputs.push(toolMessage.content);
                    }
                }
            }
        }

        return response;
    } catch (error) {
        console.error("Error in chat execution:", error);
        throw new Error("An error occurred during chat execution");
    }
}