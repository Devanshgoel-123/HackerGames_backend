import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import { Token } from "../types/defi";
import { FetchSupportedTokens } from "../utils/defiUtils";
// Add these exports at the top of your SwapTokenTool.ts file

export { convertToHex, getChainIdForNetwork, buildSwapWithApi };

const AVNU_API_BASE_URL = "https://starknet.api.avnu.fi";
const API_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

/**
 * Utility function to convert any numeric value to a hex string
 */
function convertToHex(value: number | string, decimals: number = 18): string {
    try {
        // Handle string or number input
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) {
            throw new Error(`Invalid numeric value: ${value}`);
        }

        const decimalFactor = BigInt(10 ** decimals);
        const integerPart = BigInt(Math.floor(numValue));

        // Handle the fractional part more safely
        const fractionalStr = (numValue - Math.floor(numValue)).toFixed(decimals);
        const fractionalPart = BigInt(
            Math.floor(parseFloat(fractionalStr) * Number(decimalFactor))
        );

        const decimalValue = integerPart * decimalFactor + fractionalPart;
        const hexString = "0x" + decimalValue.toString(16);

        console.log(`[SWAP API] Converted ${value} to hex: ${hexString} (${decimals} decimals)`);
        return hexString;
    } catch (error) {
        console.error(`[SWAP API] Error converting to hex: ${error}`);
        throw new Error(`Failed to convert value to hex: ${value}`);
    }
}

/**
 * Get chain ID for the specified network
 */
function getChainIdForNetwork(network: string): string {
    switch (network) {
        case "starknet-mainnet":
            return "0x534e5f4d41494e"; // Hex format for SN_MAIN
        case "starknet-sepolia":
            return "0x534e5f5345504f4c4941"; // Hex format for SN_SEPOLIA
        default:
            return "0x534e5f4d41494e";
    }
}

/**
 * Fetch swap quote from Avnu API with retry logic
 */
async function getSwapQuoteFromApi(
    fromToken: string,
    toToken: string,
    amount: string,
    slippage: number,
    userAddress: string,
    network: string
): Promise<any> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= MAX_RETRIES) {
        try {
            console.log(`[SWAP API] Getting quote${retryCount > 0 ? ` (attempt ${retryCount + 1}/${MAX_RETRIES + 1})` : ''}`);

            const supportedTokens = await FetchSupportedTokens();

            // Find token by address, symbol, or name (case-insensitive)
            const fromTokenInfo = supportedTokens.find((item: Token) =>
                item.name.toLowerCase() === fromToken.toLowerCase() ||
                (item as any).symbol?.toLowerCase() === fromToken.toLowerCase() ||
                item.token_address.toLowerCase() === fromToken.toLowerCase()
            );

            // Find token by address, symbol, or name (case-insensitive)
            const toTokenInfo = supportedTokens.find((item: Token) =>
                item.name.toLowerCase() === toToken.toLowerCase() ||
                (item as any).symbol?.toLowerCase() === toToken.toLowerCase() ||
                item.token_address.toLowerCase() === toToken.toLowerCase()
            );

            if (!fromTokenInfo) {
                throw new Error(`Token "${fromToken}" not found in supported tokens`);
            }

            if (!toTokenInfo) {
                throw new Error(`Token "${toToken}" not found in supported tokens`);
            }

            const fromTokenAdapter = {
                address: fromTokenInfo.token_address,
                symbol: (fromTokenInfo as any).symbol || fromTokenInfo.name.slice(0, 5),
                decimals: fromTokenInfo.decimals
            };

            const toTokenAdapter = {
                address: toTokenInfo.token_address,
                symbol: (toTokenInfo as any).symbol || toTokenInfo.name.slice(0, 5),
                decimals: toTokenInfo.decimals
            };

            // Use the utility function to convert amount to hex
            const sellAmountWei = convertToHex(amount, fromTokenAdapter.decimals);

            // Get chain ID for the request
            const chainId = getChainIdForNetwork(network);

            console.log(`[SWAP API] Calling Avnu API for quote with chain ID ${chainId}`);

            const response = await axios.get(`${AVNU_API_BASE_URL}/swap/v2/quotes`, {
                params: {
                    sellTokenAddress: fromTokenAdapter.address,
                    buyTokenAddress: toTokenAdapter.address,
                    sellAmount: sellAmountWei,
                    takerAddress: userAddress,
                    size: 1,
                    chainId
                },
                headers: {
                    "Accept": "application/json"
                },
                timeout: API_TIMEOUT
            });

            // Get the first (best) quote if response is an array
            const quoteData = Array.isArray(response.data)
                ? (response.data.length > 0 ? response.data[0] : null)
                : response.data;

            if (!quoteData || !quoteData.quoteId) {
                throw new Error("No valid quotes returned from API");
            }

            console.log(`[SWAP API] Successfully got quote with ID: ${quoteData.quoteId}`);

            return {
                quoteId: quoteData.quoteId,
                sellToken: {
                    symbol: fromTokenAdapter.symbol,
                    address: fromTokenAdapter.address
                },
                buyToken: {
                    symbol: toTokenAdapter.symbol,
                    address: toTokenAdapter.address
                },
                sellAmount: quoteData.sellAmount,
                buyAmount: quoteData.buyAmount,
                minimumReceived: quoteData.buyAmountWithoutFees || quoteData.guaranteedBuyAmount || "0",
                timestamp: quoteData.expiry || Date.now(),
                slippage,
                rawQuote: quoteData
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    console.error(`[SWAP API] Request timed out after ${API_TIMEOUT/1000} seconds`);
                } else if (error.response) {
                    console.error(`[SWAP API] Error response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
                } else {
                    console.error(`[SWAP API] Network error: ${error.message}`);
                }
            } else {
                console.error("[SWAP API] Error getting swap quote:", error);
            }

            retryCount++;

            if (retryCount > MAX_RETRIES) {
                console.error(`[SWAP API] All ${MAX_RETRIES + 1} attempts failed, giving up`);
                throw lastError;
            }

            console.log(`[SWAP API] Retrying in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error("Unknown error in getSwapQuoteFromApi");
}

/**
 * Build a swap transaction using a quote ID with retry logic
 */
async function buildSwapWithApi(
    quoteId: string,
    userAddress: string,
    slippage: number,
    network: string
): Promise<any> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= MAX_RETRIES) {
        try {
            console.log(`[SWAP API] Building swap${retryCount > 0 ? ` (attempt ${retryCount + 1}/${MAX_RETRIES + 1})` : ''}`);

            // Get chain ID for the request
            const chainId = getChainIdForNetwork(network);

            // Convert slippage to hex format (typically 18 decimals for percentage values)
            const slippageHex = convertToHex(slippage, 18);

            const response = await axios.post(`${AVNU_API_BASE_URL}/swap/v2/build`, {
                quoteId,
                takerAddress: userAddress,
                slippage: slippageHex, // Use hex formatted slippage
                includeApprove: true,
                chainId
            }, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                timeout: API_TIMEOUT
            });

            console.log(`[SWAP API] Successfully built swap for quote ID: ${quoteId}`);
            console.log(`[SWAP API] Build response data: ${JSON.stringify(response.data).slice(0, 200)}...`);

            return {
                ...response.data,
                timestamp: Date.now()
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    console.error(`[SWAP API] Request timed out after ${API_TIMEOUT/1000} seconds`);
                } else if (error.response) {
                    console.error(`[SWAP API] Error response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
                } else {
                    console.error(`[SWAP API] Network error: ${error.message}`);
                }
            } else {
                console.error("[SWAP API] Error building swap transaction:", error);
            }

            retryCount++;

            if (retryCount > MAX_RETRIES) {
                console.error(`[SWAP API] All ${MAX_RETRIES + 1} attempts failed, giving up`);
                throw lastError;
            }

            console.log(`[SWAP API] Retrying in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error("Unknown error in buildSwapWithApi");
}

/**
 * Execute a swap transaction with signature with retry logic
 */
async function executeSwapTransactionWithApi(
    quoteId: string,
    signature: string[],
    requestSignature: boolean = false
): Promise<any> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= MAX_RETRIES) {
        try {
            console.log(`[SWAP API] Executing swap${retryCount > 0 ? ` (attempt ${retryCount + 1}/${MAX_RETRIES + 1})` : ''}`);

            // Log the input parameters
            console.log(`[SWAP API] Execute params: quoteId=${quoteId}, signature=${JSON.stringify(signature)}`);

            const headers: Record<string, string> = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            };

            // Add optional header for requesting signature in response
            if (requestSignature) {
                headers["ask-signature"] = "true";
            }

            // Make sure each signature element is properly formatted as hex
            const formattedSignature = signature.map(sig =>
                sig.startsWith("0x") ? sig : `0x${sig}`
            );

            console.log(`[SWAP API] Formatted signature: ${JSON.stringify(formattedSignature)}`);

            const response = await axios.post(`${AVNU_API_BASE_URL}/swap/v2/execute`, {
                quoteId,
                signature: formattedSignature
            }, {
                headers,
                timeout: API_TIMEOUT
            });

            // If ask-signature was set to true, check for signature in response headers
            const responseSignature = requestSignature ? response.headers['signature'] : null;

            console.log(`[SWAP API] Successfully executed swap for quote ID: ${quoteId}`);

            return {
                ...response.data,
                responseSignature,
                timestamp: Date.now()
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Specifically handle the "Build quote first" error
            if (axios.isAxiosError(error) &&
                error.response?.data?.messages?.includes("Build quote first")) {
                console.error(`[SWAP API] Quote ${quoteId} needs to be built before execution`);

                // Add additional debugging
                console.log(`[SWAP API] Attempting to rebuild the quote ${quoteId} before execution`);
                throw new Error("Quote needs to be built before execution. Please call build_swap first.");
            }

            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    console.error(`[SWAP API] Request timed out after ${API_TIMEOUT/1000} seconds`);
                } else if (error.response) {
                    console.error(`[SWAP API] Error response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
                } else {
                    console.error(`[SWAP API] Network error: ${error.message}`);
                }
            } else {
                console.error("[SWAP API] Error executing swap transaction:", error);
            }

            retryCount++;

            if (retryCount > MAX_RETRIES) {
                console.error(`[SWAP API] All ${MAX_RETRIES + 1} attempts failed, giving up`);
                throw lastError;
            }

            console.log(`[SWAP API] Retrying in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error("Unknown error in executeSwapTransactionWithApi");
}

export const getSwapQuoteTool = tool(
    async ({ fromToken, toToken, amount, slippage = 0.005, userAddress, network = "starknet-mainnet" }) => {
        try {
            console.log(`[TOOL] get_swap_quote called for ${fromToken} to ${toToken}`);

            const quote = await getSwapQuoteFromApi(
                fromToken,
                toToken,
                amount,
                slippage,
                userAddress,
                network
            );

            return JSON.stringify({
                type: "swap_quote",
                quoteId: quote.quoteId,
                fromToken: quote.sellToken.symbol,
                toToken: quote.buyToken.symbol,
                amountIn: quote.sellAmount,
                amountOut: quote.buyAmount,
                minimumReceived: quote.minimumReceived,
                userAddress,
                network,
                chainId: getChainIdForNetwork(network),
                slippage: slippage,
                timestamp: new Date(quote.timestamp).toISOString(),
                details: {
                    action: "get_swap_quote",
                    message: `Retrieved swap quote for ${quote.sellToken.symbol} to ${quote.buyToken.symbol}`,
                    slippage: `${slippage * 100}%`
                }
            }, null, 2);
        } catch (error) {
            console.error(`[TOOL ERROR] get_swap_quote failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            throw new Error(
                `Failed to get swap quote: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    },
    {
        name: "get_swap_quote",
        description: "Gets a quote for swapping one token to another on Starknet using Avnu",
        schema: z.object({
            fromToken: z.string().describe("The token to swap from (name, symbol, or address)"),
            toToken: z.string().describe("The token to swap to (name, symbol, or address)"),
            amount: z.string().describe("The amount to swap (in token units, not wei)"),
            slippage: z.number().optional().describe("Slippage tolerance as a decimal (e.g., 0.005 for 0.5%)"),
            userAddress: z.string().describe("The address of the user making the swap"),
            network: z.enum(["starknet-mainnet", "starknet-sepolia"]).optional()
                .describe("The network where the swap will occur (default: starknet-mainnet)")
        })
    }
);

export const buildSwapTool = tool(
    async ({ quoteId, userAddress, slippage = 0.005, network = "starknet-mainnet" }) => {
        try {
            console.log(`[TOOL] build_swap called for quote ${quoteId}`);

            const swapResult = await buildSwapWithApi(quoteId, userAddress, slippage, network);

            return JSON.stringify({
                type: "swap_build",
                contractAddress: swapResult.contractAddress || null,
                calldata: swapResult.calldata || null,
                entrypoint: swapResult.entrypoint || null,
                status: "READY_TO_EXECUTE",
                userAddress,
                network,
                chainId: getChainIdForNetwork(network),
                slippage: `${slippage * 100}%`,
                timestamp: new Date(swapResult.timestamp).toISOString(),
                details: {
                    action: "build_swap",
                    message: "Swap transaction ready for execution"
                }
            }, null, 2);
        } catch (error) {
            console.error(`[TOOL ERROR] build_swap failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            throw new Error(
                `Failed to build swap: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    },
    {
        name: "build_swap",
        description: "Builds a token swap transaction based on a previously obtained quote using Avnu",
        schema: z.object({
            quoteId: z.string().describe("The ID of the swap quote to build"),
            userAddress: z.string().describe("The address of the user making the swap"),
            slippage: z.number().optional().describe("Slippage tolerance as a decimal (e.g., 0.005 for 0.5%)"),
            network: z.enum(["starknet-mainnet", "starknet-sepolia"]).optional()
                .describe("The network where the swap will occur (default: starknet-mainnet)")
        })
    }
);

export const executeSwapTool = tool(
    async ({ quoteId, signature, requestSignature = false }) => {
        try {
            console.log(`[TOOL] execute_swap called for quote ${quoteId}`);

            // Add validation for signature
            if (!signature || !Array.isArray(signature) || signature.length === 0) {
                throw new Error("Signature array is required and cannot be empty");
            }

            const swapExecutionResult = await executeSwapTransactionWithApi(
                quoteId,
                signature,
                requestSignature
            );

            return JSON.stringify({
                type: "swap_execution",
                transactionHash: swapExecutionResult.transactionHash || null,
                status: "EXECUTED",
                timestamp: new Date(swapExecutionResult.timestamp).toISOString(),
                responseSignature: swapExecutionResult.responseSignature,
                details: {
                    action: "execute_swap",
                    message: "Swap transaction executed successfully"
                },
                rawResult: swapExecutionResult
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
            quoteId: z.string().describe("The ID of the swap quote to execute"),
            signature: z.array(z.string()).describe("The signature array required for execution"),
            requestSignature: z.boolean().optional().describe("Whether to request a signature in the response (default: false)")
        })
    }
);

export const getSupportedTokensTool = tool(
    async ({ network = "starknet-mainnet" }) => {
        try {
            console.log(`[TOOL] get_supported_tokens called for network ${network}`);

            const fetchStartTime = Date.now();
            const tokens = await FetchSupportedTokens();
            const chainId = getChainIdForNetwork(network);

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
    getSwapQuoteTool,
    buildSwapTool,
    executeSwapTool,
    getSupportedTokensTool
];