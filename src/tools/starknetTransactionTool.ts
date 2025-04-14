import { Tool } from "@langchain/core/tools";
import { z } from "zod";
import { RpcChannel, BlockTag } from "../utils/rpc";

// Improved input schema for validation
const transactionInputSchema = z.union([
    z.string().regex(/^(0x)?[0-9a-fA-F]+$/, {
        message: "Transaction hash must be a valid hex string, with or without 0x prefix"
    }),
    z.object({
        transactionHash: z.string().regex(/^(0x)?[0-9a-fA-F]+$/, {
            message: "Transaction hash must be a valid hex string, with or without 0x prefix"
        })
    })
]);

// Output type definition
interface TransactionResult {
    transaction: any;
    receipt: any;
    status: any;
}

/**
 * Tool for fetching Starknet transaction data using a transaction hash
 */
export class StarknetTransactionTool extends Tool {
    name = "starknet_transaction_info";
    description = "Useful for fetching information about a Starknet transaction using its hash. Input can be a transaction hash string or an object with a transactionHash field.";

    private rpcClient: RpcChannel;

    /**
     * Creates a new StarknetTransactionTool
     * @param options Configuration options for the RPC client
     */
    constructor(options?: { nodeUrl?: string; headers?: object }) {
        super();
        this.rpcClient = new RpcChannel({
            nodeUrl: options?.nodeUrl || process.env.STARKNET_RPC_URL,
            headers: options?.headers,
            blockIdentifier: BlockTag.LATEST
        });
    }

    static lc_name() {
        return "StarknetTransactionTool";
    }

    /**
     * Normalizes a transaction hash by ensuring it has a 0x prefix
     * @param hash The transaction hash to normalize
     * @returns Normalized transaction hash with 0x prefix
     */
    private normalizeTransactionHash(hash: string): string {
        return hash.startsWith("0x") ? hash : `0x${hash}`;
    }

    /**
     * Fetches transaction data from the Starknet network
     * @param transactionHash The hash of the transaction to fetch
     * @returns Combined transaction data including basic info, receipt, and status
     */
    private async fetchTransactionData(transactionHash: string): Promise<TransactionResult> {
        const [transactionData, transactionReceipt, transactionStatus] = await Promise.all([
            this.rpcClient.getTransactionByHash(transactionHash),
            this.rpcClient.getTransactionReceipt(transactionHash),
            this.rpcClient.getTransactionStatus(transactionHash)
        ]);

        return {
            transaction: transactionData,
            receipt: transactionReceipt,
            status: transactionStatus
        };
    }

    /**
     * Parses and extracts the transaction hash from the input
     * @param input User input (string or JSON object)
     * @returns Extracted and validated transaction hash
     */
    private parseInput(input: string): string {
        try {
            // Try to parse as JSON first
            let parsed;
            try {
                parsed = JSON.parse(input);
            } catch {
                // Not valid JSON, treat as plain string
                parsed = input.trim();
            }

            // Validate with schema
            const result = transactionInputSchema.safeParse(parsed);

            if (result.success) {
                if (typeof result.data === 'string') {
                    return this.normalizeTransactionHash(result.data);
                } else {
                    return this.normalizeTransactionHash(result.data.transactionHash);
                }
            }

            throw new Error("Invalid transaction hash format. Please provide a valid hex string.");
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Invalid transaction hash format. Please provide a valid hex string.");
        }
    }

    /**
     * Main execution method for the tool
     * @param input Transaction hash or object containing a transaction hash
     * @returns JSON string with transaction data or error message
     */
    async _call(input: string): Promise<string> {
        try {
            const transactionHash = this.parseInput(input);
            const result = await this.fetchTransactionData(transactionHash);

            return JSON.stringify(result, null, 2);
        } catch (error) {
            if (error instanceof Error) {
                return `Error fetching transaction data: ${error.message}`;
            }
            return "An unknown error occurred while fetching transaction data";
        }
    }
}

/**
 * Creates a configured StarknetTransactionTool instance
 * @param options Configuration options for the RPC client
 * @returns Configured StarknetTransactionTool
 */
export function createStarknetTransactionTool(options?: {
    nodeUrl?: string;
    headers?: object;
}): Tool {
    return new StarknetTransactionTool(options);
}