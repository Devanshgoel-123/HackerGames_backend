import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SwapAction, Token } from "../types/defi";
import { FetchSupportedTokens } from "../utils/defiUtils";
import { SingularSwapExecution } from "../Functions/SwapFunction";
import { prisma } from "../db";


export const executeSwapTool = tool(
    async ({fromToken, toToken, amount, userAddress}) => {
        try {
            console.log(`[TOOL] execute_swap called for tokens ${fromToken} ${toToken} ${amount}`);
            const fromTokenAddress=await prisma.token.findFirst({
                where: {
                    name:fromToken.toUpperCase()
                }
            })
            const toTokenAddress=await prisma.token.findFirst({
                where: {
                    name:toToken.toUpperCase()
                }
            })
            if(fromTokenAddress===null || toTokenAddress===null){
                return ;
            }
            const swap:SwapAction={
                from_token_address : fromTokenAddress?.token_address as string,
                to_token_address : toTokenAddress?.token_address as string,
                amount:Number(amount),
                chainId:1,
                fromTokenDecimals:fromTokenAddress?.decimals || 18
            }
            console.log("the swap object is",swap)
            const swapExecutionResultHash = await SingularSwapExecution(
                swap,
                userAddress
            )
            console.log(` swap ${fromToken} to ${toToken} for amount ${amount}`)
            return JSON.stringify({
                type: "swap_execution",
                transactionHash: swapExecutionResultHash || null,
                status: "EXECUTED",
                timestamp: new Date().toISOString(),
                details: {
                    action: "execute_swap",
                    message: "Swap transaction executed successfully"
                }
            }, null, 2);
        } catch (error) {
            console.error(`[TOOL ERROR] execute_swap failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            throw new Error(
                `Failed to execute swap: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    },
    {
        name: "execute_swap",
        description: "Executes a token swap transaction with the provided signature",
        schema: z.object({
            fromToken: z.string().describe("The name of the from token we need to send"),
            toToken: z.string().describe("The name of the to token we need to receive"),
            amount: z.string().describe("The amount of the token we want to receive"),
            userAddress: z.string().describe("The Address of the user wallet")
        })
    }
);

export const getSupportedTokensTool = tool(
    async ({ network = "starknet-mainnet" }) => {
        try {
            console.log(`[TOOL] get_supported_tokens called for network ${network}`);

            const fetchStartTime = Date.now();
            const tokens = await FetchSupportedTokens();
            const chainId = "0x534e5f4d41494e";

            return JSON.stringify({
                type: "supported_tokens",
                network,
                chainId,
                tokens: tokens.map((token: Token) => ({
                    address: token.token_address,
                    symbol: (token as any).symbol || token.name.slice(0, 5),
                    name: token.name,
                    decimals: token.decimals,
                    logoURI: token.image || null
                })),
                count: tokens.length,
                timestamp: new Date(fetchStartTime).toISOString()
            }, null, 2);
        } catch (error) {
            console.error(`[TOOL ERROR] get_supported_tokens failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            throw new Error(
                `Failed to get supported tokens: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    },
    {
        name: "get_supported_tokens",
        description: "Gets a list of tokens supported for swapping on Starknet via Avnu",
        schema: z.object({
            network: z.enum(["starknet-mainnet", "starknet-sepolia"]).optional()
                .describe("The network to get supported tokens for (default: starknet-mainnet)")
        })
    }
);

export const swapTokenTools = [
    executeSwapTool,
    getSupportedTokensTool
];