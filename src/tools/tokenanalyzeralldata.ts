import { Tool, DynamicTool } from "@langchain/core/tools";
import axios, { AxiosResponse, AxiosError } from "axios";

/**
 * LangChain tool for fetching DeFi data from DeFiLlama API
 * Implements interfaces for StarkNet tokens and DeFi metrics
 */
export class DeFiLlamaTools {
  // Base URLs for different DeFiLlama API endpoints
  private readonly TVL_API_BASE_URL = "https://api.llama.fi";
  private readonly COINS_API_BASE_URL = "https://coins.llama.fi";
  private readonly STABLECOINS_API_BASE_URL = "https://stablecoins.llama.fi";
  private readonly API_TIMEOUT = 60000; // 60 seconds timeout

  // Rate limiting variables
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  // Logger function - can be replaced with a proper logging system
  private logger = {
    error: (message: string, error?: unknown) => {
      // Silent in production, replace with proper logging if needed
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ERROR] ${message}`, error);
      }
    },
    info: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[INFO] ${message}`, data || '');
      }
    }
  };

  // StarkNet tokens data
  private readonly STARKNET_TOKENS: StarkNetToken[] = [
    {
      id: 1,
      name: "USDC",
      token_id: 1,
      token_address: "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
      chain_id: 1,
      decimals: 6,
      type: "stable",
      symbol: "USDC",
      additional_info: "USD Coin, a popular stablecoin pegged to the US Dollar"
    },
    {
      id: 2,
      name: "USDT",
      token_id: 2,
      token_address: "0x68f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
      chain_id: 1,
      decimals: 6,
      type: "stable",
      symbol: "USDT",
      additional_info: "Tether, the largest stablecoin by market cap, pegged to the US Dollar"
    },
    {
      id: 3,
      name: "STRK",
      token_id: 3,
      token_address: "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      chain_id: 1,
      decimals: 18,
      type: "native",
      symbol: "STRK",
      additional_info: "StarkNet's native token used for network fees and governance"
    },
    {
      id: 4,
      name: "ETHEREUM",
      token_id: 4,
      token_address: "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      chain_id: 1,
      decimals: 18,
      type: "native",
      symbol: "ETH",
      additional_info: "Wrapped Ethereum on StarkNet"
    },
    {
      id: 5,
      name: "EKUBO",
      token_id: 5,
      token_address: "0x75afe6402ad5a5c20dd25e10ec3b3986acaa647b77e4ae24b0cbc9a54a27a87",
      chain_id: 1,
      decimals: 18,
      type: "other",
      symbol: "EKUBO",
      additional_info: "Ekubo is a concentrated liquidity DEX protocol on StarkNet"
    },
    {
      id: 6,
      name: "UNI",
      token_id: 6,
      token_address: "0x49210ffc442172463f3177147c1aeaa36c51d152c1b0630f2364c300d4f48ee",
      chain_id: 1,
      decimals: 18,
      type: "other",
      symbol: "UNI",
      additional_info: "Uniswap governance token on StarkNet"
    }
  ];

  // Create LangChain Tools
  public createTools(): Tool[] {
    return [
      new DynamicTool({
        name: "getTokenPrices",
        description: "Get current prices for specified tokens by their contract addresses",
        func: async (input: string) => {
          try {
            const tokens = input.split(',').map(t => t.trim()).filter(t => t.length > 0);
            if (tokens.length === 0) {
              return "Error: At least one token address is required";
            }
            return JSON.stringify(await this.getTokenPrices(tokens));
          } catch (error: unknown) {
            return `Error fetching token prices: ${this.formatErrorMessage(error)}`;
          }
        },
      }),

      new DynamicTool({
        name: "getHistoricalTokenPrices",
        description: "Get historical prices for tokens at a specified timestamp",
        func: async (input: string) => {
          try {
            const parts = input.split(',').map(t => t.trim());
            if (parts.length < 2) {
              return "Error: Input must include timestamp and at least one token address";
            }

            const timestamp = parseInt(parts[0]);
            if (isNaN(timestamp) || timestamp <= 0) {
              return "Error: Invalid timestamp provided";
            }

            const tokens = parts.slice(1).filter(t => t.length > 0);
            if (tokens.length === 0) {
              return "Error: At least one token address is required";
            }

            return JSON.stringify(await this.getHistoricalTokenPrices(timestamp, tokens));
          } catch (error: unknown) {
            return `Error fetching historical token prices: ${this.formatErrorMessage(error)}`;
          }
        },
      }),

      new DynamicTool({
        name: "getProtocolList",
        description: "Get a list of all protocols on DeFiLlama with their TVL data",
        func: async () => {
          try {
            return JSON.stringify(await this.getProtocolList());
          } catch (error: unknown) {
            return `Error fetching protocol list: ${this.formatErrorMessage(error)}`;
          }
        },
      }),

      new DynamicTool({
        name: "getProtocolData",
        description: "Get detailed TVL data for a specific protocol",
        func: async (protocol: string) => {
          try {
            if (!protocol || protocol.trim().length === 0) {
              return "Error: Protocol name is required";
            }
            return JSON.stringify(await this.getProtocolData(protocol.trim()));
          } catch (error: unknown) {
            return `Error fetching protocol data: ${this.formatErrorMessage(error)}`;
          }
        },
      }),

      new DynamicTool({
        name: "getChainTVL",
        description: "Get historical TVL data for a specific chain",
        func: async (chain: string) => {
          try {
            if (!chain || chain.trim().length === 0) {
              return "Error: Chain name is required";
            }
            return JSON.stringify(await this.getChainTVL(chain.trim()));
          } catch (error: unknown) {
            return `Error fetching chain TVL: ${this.formatErrorMessage(error)}`;
          }
        },
      }),

      new DynamicTool({
        name: "getStarkNetTokens",
        description: "Get information about StarkNet tokens",
        func: async () => {
          try {
            return JSON.stringify(this.STARKNET_TOKENS);
          } catch (error: unknown) {
            return `Error fetching StarkNet tokens: ${this.formatErrorMessage(error)}`;
          }
        },
      }),

      new DynamicTool({
        name: "getStarkNetMetrics",
        description: "Get StarkNet network metrics (mocked data as example)",
        func: async () => {
          try {
            return JSON.stringify(this.getMockStarkNetMetrics());
          } catch (error: unknown) {
            return `Error fetching StarkNet metrics: ${this.formatErrorMessage(error)}`;
          }
        },
      }),

      new DynamicTool({
        name: "getTokenRecommendations",
        description: "Get token recommendations based on analyzed data",
        func: async () => {
          try {
            return JSON.stringify(await this.getTokenRecommendations());
          } catch (error: unknown) {
            return `Error generating token recommendations: ${this.formatErrorMessage(error)}`;
          }
        },
      }),

      new DynamicTool({
        name: "getStablecoins",
        description: "Get list of all stablecoins with their circulating amounts",
        func: async (includePrices: string = 'true') => {
          try {
            const includePricesBool = includePrices.toLowerCase() === 'true';
            return JSON.stringify(await this.getStablecoins(includePricesBool));
          } catch (error: unknown) {
            return `Error fetching stablecoins: ${this.formatErrorMessage(error)}`;
          }
        },
      }),
    ];
  }

  // Helper method to format user-friendly error messages
  private formatErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        return `API error: ${axiosError.response.status} ${
            typeof axiosError.response.data === 'string'
                ? axiosError.response.data
                : JSON.stringify(axiosError.response.data)
        }`;
      } else if (axiosError.request) {
        return "No response received from API server";
      } else {
        return `Request error: ${axiosError.message}`;
      }
    }
    return error instanceof Error ? error.message : String(error);
  }

  // Helper method to enforce rate limiting
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  // Helper method to handle API responses safely with timeout and retries
  private async safeApiCall<T>(apiCall: () => Promise<AxiosResponse<T>>, retries = 0): Promise<T> {
    await this.enforceRateLimit();

    try {
      const response = await Promise.race([
        apiCall(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("API request timed out")), this.API_TIMEOUT);
        })
      ]) as AxiosResponse<T>;

      if (response.status !== 200) {
        throw new Error(`API returned error status: ${response.status}`);
      }

      if (!response.data) {
        throw new Error("API returned empty response");
      }

      return response.data;
    } catch (error) {
      // Implement retry logic for specific errors
      if (retries < this.MAX_RETRIES) {
        const shouldRetry = axios.isAxiosError(error) &&
            (error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' ||
                (error.response && (error.response.status >= 500 || error.response.status === 429)));

        if (shouldRetry) {
          this.logger.error(`Retrying API call (${retries + 1}/${this.MAX_RETRIES})`, error);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          return this.safeApiCall(apiCall, retries + 1);
        }
      }

      // If we can't/shouldn't retry, format and re-throw the error
      this.logger.error("API call failed", error);
      throw error;
    }
  }

  // Implementation of API methods
  private async getTokenPrices(tokens: string[]): Promise<Record<string, TokenPriceData>> {
    if (tokens.length === 0) {
      throw new Error("At least one token address is required");
    }

    const data = await this.safeApiCall(() =>
        axios.get(`${this.COINS_API_BASE_URL}/prices/current/${tokens.join(',')}`)
    );

    if (!data.coins) {
      throw new Error("Invalid response format: missing coins property");
    }

    return data.coins;
  }

  private async getHistoricalTokenPrices(timestamp: number, tokens: string[]): Promise<Record<string, TokenPriceData>> {
    if (isNaN(timestamp) || timestamp <= 0) {
      throw new Error("Invalid timestamp provided");
    }

    if (tokens.length === 0) {
      throw new Error("At least one token address is required");
    }

    const data = await this.safeApiCall(() =>
        axios.get(`${this.COINS_API_BASE_URL}/prices/historical/${timestamp}/${tokens.join(',')}`)
    );

    if (!data.coins) {
      throw new Error("Invalid response format: missing coins property");
    }

    return data.coins;
  }

  private async getProtocolList(): Promise<TokenProtocolData[]> {
    const data = await this.safeApiCall(() =>
        axios.get(`${this.TVL_API_BASE_URL}/protocols`)
    );

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: expected array of protocols");
    }

    return data.map((protocol: unknown) => {
      // Type guard to ensure protocol is an object
      if (typeof protocol !== 'object' || protocol === null) {
        return {
          name: "Unknown Protocol",
          chains: []
        };
      }

      const p = protocol as Record<string, unknown>;

      return {
        name: typeof p.name === 'string' ? p.name : "Unknown Protocol",
        description: typeof p.description === 'string' ? p.description : undefined,
        category: typeof p.category === 'string' ? p.category : undefined,
        chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
        gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : undefined,
        cmcId: typeof p.cmcId === 'string' || typeof p.cmcId === 'number' ? String(p.cmcId) : undefined,
        audits: typeof p.audits === 'string' || typeof p.audits === 'number' ? String(p.audits) : undefined,
        audit_links: Array.isArray(p.audit_links) ?
            p.audit_links.filter((link): link is string => typeof link === 'string') :
            undefined,
        listedAt: typeof p.listedAt === 'number' ? p.listedAt : undefined,
        isStarkNetNative: Array.isArray(p.chains) &&
            p.chains.some((chain): boolean => typeof chain === 'string' && chain.toLowerCase() === 'starknet')
      };
    });
  }

  private async getProtocolData(protocol: string): Promise<TokenTVLData> {
    if (!protocol || protocol.trim().length === 0) {
      throw new Error("Protocol name is required");
    }

    const data = await this.safeApiCall(() =>
        axios.get(`${this.TVL_API_BASE_URL}/protocol/${encodeURIComponent(protocol)}`)
    );

    // Transform the data to match the TokenTVLData interface
    return {
      tvl: typeof data.tvl === 'number' ? data.tvl : 0,
      tokenPrice: typeof data.tokenPrice === 'number' ? data.tokenPrice : 0,
      tokensInUsd: typeof data.tokensInUsd === 'number' ? data.tokensInUsd : 0,
      tokens: typeof data.tokens === 'object' && data.tokens !== null ? data.tokens : {},
      chainTvls: typeof data.chainTvls === 'object' && data.chainTvls !== null ? data.chainTvls : {},
      change_1d: typeof data.change_1d === 'number' ? data.change_1d : 0,
      starkNetTVL: typeof data.chainTvls === 'object' && data.chainTvls !== null && 'starknet' in data.chainTvls ? data.chainTvls.starknet : null
    };
  }

  private async getChainTVL(chain: string): Promise<ChainTVLData> {
    if (!chain || chain.trim().length === 0) {
      throw new Error("Chain name is required");
    }

    return await this.safeApiCall(() =>
        axios.get(`${this.TVL_API_BASE_URL}/v2/historicalChainTvl/${encodeURIComponent(chain)}`)
    );
  }

  private getMockStarkNetMetrics(): StarkNetMetrics {
    // Mocked data since this is not directly available from the API
    return {
      dailyTransactions: 152473,
      totalAccounts: 893214,
      activeDevelopment: "HIGH",
      networkStatus: "HEALTHY",
      avgGasPrice: 0.000187
    };
  }

  private async getTokenRecommendations(): Promise<Recommendation[]> {
    try {
      // Get protocols and filter for StarkNet
      const protocols = await this.getProtocolList();
      const starknetProtocols = protocols.filter(p => p.isStarkNetNative);

      // Generate recommendations based on TVL and activity
      const recommendations: Recommendation[] = [
        {
          type: "STABLE",
          assessment: {
            tokens: this.STARKNET_TOKENS.filter(t => t.type === "stable"),
            reasoning: "Stablecoins provide liquidity and reduce volatility risk",
            riskLevel: "LOW"
          }
        },
        {
          type: "GOVERNANCE",
          assessment: {
            tokens: this.STARKNET_TOKENS.filter(t => t.symbol === "STRK"),
            reasoning: "Governance tokens provide network participation",
            riskLevel: "MEDIUM"
          }
        },
        {
          type: "DEFI",
          assessment: {
            protocols: starknetProtocols,
            reasoning: "DeFi protocols with high TVL and active development",
            riskLevel: "MEDIUM"
          }
        }
      ];

      return recommendations;
    } catch (error) {
      this.logger.error("Error generating recommendations:", error);
      throw new Error(`Failed to generate token recommendations: ${this.formatErrorMessage(error)}`);
    }
  }

  private async getStablecoins(includePrices: boolean = true): Promise<StablecoinData> {
    return await this.safeApiCall(() =>
        axios.get(`${this.STABLECOINS_API_BASE_URL}/stablecoins`, {
          params: { includePrices }
        })
    );
  }
}

// Improved interfaces with better typing
interface TokenPriceData {
  price: number;
  symbol: string;
  timestamp: number;
  confidence: number;
  marketCap?: number;
  totalSupply?: number;
  decimals?: number;
}

interface TokenTVLData {
  tvl: number;
  tokenPrice: number;
  tokensInUsd: number;
  tokens: Record<string, unknown>;
  chainTvls: Record<string, unknown>;
  change_1d?: number;
  starkNetTVL?: unknown | null;
}

interface TokenProtocolData {
  name: string;
  description?: string;
  category?: string;
  chains: string[];
  gecko_id?: string;
  cmcId?: string;
  audits?: string;
  audit_links?: string[];
  listedAt?: number;
  isStarkNetNative?: boolean;
}

interface StarkNetToken {
  id: number;
  name: string;
  token_id: number;
  token_address: string;
  chain_id: number;
  decimals: number;
  type: string;
  symbol: string;
  additional_info: string;
}

interface StarkNetMetrics {
  dailyTransactions: number;
  totalAccounts: number;
  activeDevelopment: "HIGH" | "MEDIUM" | "LOW";
  networkStatus: "HEALTHY" | "CONGESTED" | "ISSUES";
  avgGasPrice: number;
}

interface ChainTVLData {
  tvl: number[];
  timestamp: number[];
  [key: string]: unknown;
}

interface StablecoinData {
  peggedAssets: unknown[];
  peggedGlobalData?: unknown;
  [key: string]: unknown;
}

interface Recommendation {
  type: string;
  assessment: {
    tokens?: StarkNetToken[];
    protocols?: TokenProtocolData[];
    reasoning: string;
    riskLevel: "HIGH" | "MEDIUM" | "LOW";
  };
}

// Export the entire class for use in other modules
export default DeFiLlamaTools;