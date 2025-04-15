// Types
export interface TokenData {
    symbol: string;
    price: number;
    priceHistory: number[];  // Array of hourly prices (most recent first), 24 items
    tvl: number;
    tvlHistory: number[];    // Array of hourly TVL values (most recent first), 24 items
}

export interface Position {
    symbol: string;
    entryPrice: number;
    quantity: number;
    entryTime: Date;
    profitTarget: number;
    stopLoss: number;
}

export interface PortfolioState {
    positions: Position[];
    availableCapital: number;
    totalValue: number;
    lastUpdated: Date;
}

export interface StarknetConfig {
    rpcUrl: string;
    accountAddress: string;
    privateKey: string;
    tokenContracts: Record<string, string>; // Map of token symbols to contract addresses
    dexRouterAddress: string;
}

export interface TradingAgentConfig {
    initialCapital: number;
    maxPositionSize?: number;  // Default: 0.2 (20% of portfolio)
    stableCoinReserve?: number;  // Default: 0.3 (30% in stablecoins)
    profitTargetPercent?: number;  // Default: 0.04 (4%)
    stopLossPercent?: number;  // Default: 0.02 (2%)
    momentumThreshold?: number;  // Default: 0.01 (1%)
    maxHoldingPeriodHours?: number;  // Default: 18 hours
}

export interface TradingAgentCallbacks {
    onTradeExecuted?: (action: "BUY" | "SELL", symbol: string, quantity: number, price: number) => void;
    onCycleCompleted?: (portfolioState: PortfolioState) => void;
    onError?: (error: Error) => void;
}

/**
 * Create and start a trading agent on Starknet with the specified configuration
 *
 * @param starknetConfig - Configuration for Starknet connection
 * @param tradingConfig - Configuration for the trading strategy
 * @param callbacks - Optional callbacks for trade events
 * @returns Object with methods to control the trading agent
 */
export function createStarknetTradingAgent(
    starknetConfig: StarknetConfig,
    tradingConfig: TradingAgentConfig,
    callbacks: TradingAgentCallbacks = {}
) {
    // Create internal trading agent
    const agent = new CryptoTradingAgent(
        tradingConfig.initialCapital,
        {
            maxPositionSize: tradingConfig.maxPositionSize ?? 0.2,
            stableCoinReserve: tradingConfig.stableCoinReserve ?? 0.3,
            profitTargetPercent: tradingConfig.profitTargetPercent ?? 0.04,
            stopLossPercent: tradingConfig.stopLossPercent ?? 0.02,
            momentumThreshold: tradingConfig.momentumThreshold ?? 0.01,
            maxHoldingPeriodHours: tradingConfig.maxHoldingPeriodHours ?? 18
        }
    );

    // Create data provider and trade executor
    const dataProvider = new StarknetMarketDataProvider(starknetConfig);
    const tradeExecutor = new StarknetTradeExecutor(starknetConfig, callbacks.onTradeExecuted);

    // Override agent's executeOrder method to use our trade executor
    const originalExecuteOrder = (agent as any).executeOrder;
    (agent as any).executeOrder = async (
        action: "BUY" | "SELL",
        symbol: string,
        quantity: number,
        price: number
    ): Promise<boolean> => {
        console.log(`Executing order: ${action} ${quantity} ${symbol} at ${price}`);

        try {
            if (action === "BUY") {
                return await tradeExecutor.executeBuyOrder(symbol, quantity, price);
            } else {
                return await tradeExecutor.executeSellOrder(symbol, quantity, price);
            }
        } catch (error) {
            if (callbacks.onError) {
                callbacks.onError(error instanceof Error ? error : new Error(String(error)));
            }
            console.error(`Error executing ${action} order:`, error);
            return false;
        }
    };

    // Initialize timer reference
    let executionTimer: NodeJS.Timer | null = null;

    /**
     * Run a single execution cycle of the trading strategy
     */
    async function executeTradingCycle(): Promise<void> {
        try {
            console.log("Starting trading cycle execution");

            // 1. Fetch market data from Starknet
            const marketData = await dataProvider.fetchMarketData();

            // 2. Execute the trading strategy
            await agent.executeStrategy(marketData);

            // 3. Call completion callback if provided
            if (callbacks.onCycleCompleted) {
                callbacks.onCycleCompleted(agent.getPortfolioState());
            }

            console.log("Trading cycle completed successfully");
        } catch (error) {
            if (callbacks.onError) {
                callbacks.onError(error instanceof Error ? error : new Error(String(error)));
            }
            console.error("Error executing trading cycle:", error);
        }
    }

    // Return public interface
    return {
        /**
         * Start the trading agent with scheduled executions every 6 hours
         * @param executeImmediately - Whether to execute a cycle immediately
         */
        start: (executeImmediately = true) => {
            console.log("Starting Starknet trading agent");

            // Run immediately if requested
            if (executeImmediately) {
                executeTradingCycle();
            }

            // Schedule for every 6 hours (6 * 60 * 60 * 1000 ms)
            executionTimer = setInterval(executeTradingCycle, 6 * 60 * 60 * 1000);

            return true;
        },

        /**
         * Stop the scheduled executions of the trading agent
         */
        stop: () => {
            if (executionTimer) {
                clearInterval(executionTimer);
                executionTimer = null;
                console.log("Stopped Starknet trading agent");
                return true;
            }
            return false;
        },

        /**
         * Execute a single trading cycle immediately
         */
        executeNow: async () => {
            return executeTradingCycle();
        },

        /**
         * Get the current state of the portfolio
         */
        getPortfolioState: () => {
            return agent.getPortfolioState();
        }
    };
}

// Implementation classes (internal)

/**
 * Core trading agent implementation
 */
class CryptoTradingAgent {
    private portfolio: PortfolioState;
    private maxPositionSize: number;
    private stableCoinReserve: number;
    private profitTargetPercent: number;
    private stopLossPercent: number;
    private momentumThreshold: number;
    private maxHoldingPeriodHours: number;

    constructor(
        initialCapital: number,
        config: {
            maxPositionSize: number;
            stableCoinReserve: number;
            profitTargetPercent: number;
            stopLossPercent: number;
            momentumThreshold: number;
            maxHoldingPeriodHours: number;
        }
    ) {
        this.maxPositionSize = config.maxPositionSize;
        this.stableCoinReserve = config.stableCoinReserve;
        this.profitTargetPercent = config.profitTargetPercent;
        this.stopLossPercent = config.stopLossPercent;
        this.momentumThreshold = config.momentumThreshold;
        this.maxHoldingPeriodHours = config.maxHoldingPeriodHours;

        this.portfolio = {
            positions: [],
            availableCapital: initialCapital * (1 - this.stableCoinReserve),
            totalValue: initialCapital,
            lastUpdated: new Date()
        };
    }

    /**
     * Main execution method - runs every 6 hours
     * @param marketData Current market data for all available tokens
     */
    public async executeStrategy(marketData: Map<string, TokenData>): Promise<void> {
        console.log(`Executing trading strategy at ${new Date().toISOString()}`);

        // 1. Check existing positions and exit if necessary
        await this.evaluateExistingPositions(marketData);

        // 2. Find new trading opportunities
        const opportunities = this.findTradingOpportunities(marketData);

        // 3. Enter new positions based on opportunities
        await this.enterNewPositions(opportunities, marketData);

        // 4. Update portfolio state
        this.updatePortfolioValue(marketData);

        console.log(`Strategy execution complete. Portfolio value: ${this.portfolio.totalValue}`);
    }

    /**
     * Evaluate existing positions against exit criteria
     */
    private async evaluateExistingPositions(marketData: Map<string, TokenData>): Promise<void> {
        const positionsToRemove: number[] = [];

        for (let i = 0; i < this.portfolio.positions.length; i++) {
            const position = this.portfolio.positions[i];
            const currentData = marketData.get(position.symbol);

            if (!currentData) {
                console.warn(`No data found for ${position.symbol}, skipping evaluation`);
                continue;
            }

            const currentPrice = currentData.price;
            const holdingTimeHours = this.getHoursBetween(position.entryTime, new Date());

            // Check profit target
            if (currentPrice >= position.profitTarget) {
                await this.exitPosition(position, currentPrice, "PROFIT_TARGET");
                positionsToRemove.push(i);
                continue;
            }

            // Check stop loss
            if (currentPrice <= position.stopLoss) {
                await this.exitPosition(position, currentPrice, "STOP_LOSS");
                positionsToRemove.push(i);
                continue;
            }

            // Check holding time limit
            if (holdingTimeHours >= this.maxHoldingPeriodHours) {
                await this.exitPosition(position, currentPrice, "TIME_LIMIT");
                positionsToRemove.push(i);
                continue;
            }
        }

        // Remove closed positions (in reverse order to avoid index issues)
        for (let i = positionsToRemove.length - 1; i >= 0; i--) {
            this.portfolio.positions.splice(positionsToRemove[i], 1);
        }
    }

    /**
     * Find trading opportunities based on momentum and TVL criteria
     */
    private findTradingOpportunities(marketData: Map<string, TokenData>): Array<{symbol: string, score: number}> {
        const opportunities: Array<{symbol: string, score: number}> = [];

        for (const [symbol, data] of marketData.entries()) {
            // Skip if we already have a position in this token
            if (this.portfolio.positions.some(p => p.symbol === symbol)) {
                continue;
            }

            // Calculate TVL ratio (current TVL / 24hr average TVL)
            const avgTvl = this.calculateAverage(data.tvlHistory);
            const tvlRatio = data.tvl / avgTvl;

            // Skip tokens with declining TVL
            if (tvlRatio < 1.0) {
                continue;
            }

            // Calculate 6-hour Rate of Change (ROC)
            const currentPrice = data.price;
            const sixHoursAgoPrice = data.priceHistory[5]; // Index 5 for 6 hours ago
            const roc = (currentPrice - sixHoursAgoPrice) / sixHoursAgoPrice;

            // Check momentum threshold
            if (roc > this.momentumThreshold) {
                // Calculate score based on momentum and TVL ratio
                const score = roc * tvlRatio;
                opportunities.push({ symbol, score });
            }
        }

        // Sort opportunities by score (highest first)
        return opportunities.sort((a, b) => b.score - a.score);
    }

    /**
     * Enter new positions based on identified opportunities
     */
    private async enterNewPositions(
        opportunities: Array<{symbol: string, score: number}>,
        marketData: Map<string, TokenData>
    ): Promise<void> {
        // Calculate how much capital we can deploy
        const totalAvailableForNewPositions = this.portfolio.availableCapital;
        let remainingCapital = totalAvailableForNewPositions;

        for (const opportunity of opportunities) {
            if (remainingCapital <= 0) break;

            const tokenData = marketData.get(opportunity.symbol);
            if (!tokenData) continue;

            // Calculate position size based on portfolio max and opportunity score
            // Higher score = larger position, up to the maximum
            const scoreMultiplier = Math.min(1, opportunity.score * 10); // Scale score to max of 1
            const maxPositionCapital = this.portfolio.totalValue * this.maxPositionSize;
            let positionCapital = Math.min(
                maxPositionCapital * scoreMultiplier,
                remainingCapital
            );

            // Minimum position size check (1% of portfolio)
            const minPositionSize = this.portfolio.totalValue * 0.01;
            if (positionCapital < minPositionSize) {
                continue; // Skip if position would be too small
            }

            // Calculate quantity based on current price
            const quantity = positionCapital / tokenData.price;

            // Create new position
            const newPosition: Position = {
                symbol: opportunity.symbol,
                entryPrice: tokenData.price,
                quantity: quantity,
                entryTime: new Date(),
                profitTarget: tokenData.price * (1 + this.profitTargetPercent),
                stopLoss: tokenData.price * (1 - this.stopLossPercent)
            };

            // Execute buy order
            await this.executeOrder("BUY", newPosition.symbol, quantity, tokenData.price);

            // Update portfolio
            this.portfolio.positions.push(newPosition);
            remainingCapital -= positionCapital;
            this.portfolio.availableCapital = remainingCapital;

            console.log(`Entered new position: ${JSON.stringify(newPosition)}`);
        }
    }

    /**
     * Exit a position and update portfolio
     */
    private async exitPosition(position: Position, currentPrice: number, reason: string): Promise<void> {
        // Execute sell order
        await this.executeOrder("SELL", position.symbol, position.quantity, currentPrice);

        // Calculate profit/loss
        const invested = position.entryPrice * position.quantity;
        const received = currentPrice * position.quantity;
        const profitLoss = received - invested;
        const profitLossPercent = (profitLoss / invested) * 100;

        // Update available capital
        this.portfolio.availableCapital += received;

        console.log(`Exited position ${position.symbol} due to ${reason}. P/L: ${profitLossPercent.toFixed(2)}%`);
    }

    /**
     * Update the total portfolio value based on current market prices
     */
    private updatePortfolioValue(marketData: Map<string, TokenData>): void {
        let totalValue = this.portfolio.availableCapital;

        // Add value of all open positions
        for (const position of this.portfolio.positions) {
            const currentData = marketData.get(position.symbol);
            if (currentData) {
                totalValue += position.quantity * currentData.price;
            } else {
                // If no current data, use entry price as fallback
                totalValue += position.quantity * position.entryPrice;
            }
        }

        this.portfolio.totalValue = totalValue;
        this.portfolio.lastUpdated = new Date();
    }

    /**
     * Execute a buy or sell order (placeholder for actual exchange API calls)
     * This will be overridden with actual implementation
     */
    private async executeOrder(
        action: "BUY" | "SELL",
        symbol: string,
        quantity: number,
        price: number
    ): Promise<boolean> {
        // This would be replaced with actual API calls to your exchange
        console.log(`${action} ORDER: ${quantity} ${symbol} @ ${price}`);

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 100));

        return true; // Return success/failure based on API response
    }

    /**
     * Calculate average of an array of numbers
     */
    private calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Calculate hours between two dates
     */
    private getHoursBetween(start: Date, end: Date): number {
        const diffMs = end.getTime() - start.getTime();
        return diffMs / (1000 * 60 * 60);
    }

    /**
     * Get current portfolio state
     */
    public getPortfolioState(): PortfolioState {
        return { ...this.portfolio };
    }
}

/**
 * Starknet market data provider
 */
class StarknetMarketDataProvider {
    private config: StarknetConfig;

    constructor(config: StarknetConfig) {
        this.config = config;
    }

    /**
     * Fetch market data for all configured tokens
     */
    public async fetchMarketData(): Promise<Map<string, TokenData>> {
        try {
            console.log("Fetching market data from Starknet...");
            const marketData = new Map<string, TokenData>();

            // Process each configured token
            for (const [symbol, contractAddress] of Object.entries(this.config.tokenContracts)) {
                try {
                    const tokenData = await this.fetchTokenData(symbol, contractAddress);
                    marketData.set(symbol, tokenData);
                } catch (error) {
                    console.error(`Error fetching data for ${symbol}:`, error);
                }
            }

            return marketData;
        } catch (error) {
            console.error("Error fetching market data:", error);
            throw error;
        }
    }

    /**
     * Fetch token data including price and TVL history
     * This implementation should be replaced with actual API calls to your data source
     */
    private async fetchTokenData(symbol: string, contractAddress: string): Promise<TokenData> {
        // In a real implementation, replace with actual API calls to fetch data
        // This is a placeholder implementation

        // Simulate API call latency
        await new Promise(resolve => setTimeout(resolve, 100));

        // Placeholder data
        const basePrice = this.getMockBasePrice(symbol);
        const baseTvl = this.getMockBaseTvl(symbol);

        // Create price history with some random variation
        const priceHistory: number[] = [];
        for (let i = 0; i < 24; i++) {
            const randomVariation = 0.05; // 5% variation
            const variationFactor = 1 + (Math.random() * randomVariation * 2 - randomVariation);
            priceHistory.push(basePrice * variationFactor);
        }

        // Create TVL history with some random variation
        const tvlHistory: number[] = [];
        for (let i = 0; i < 24; i++) {
            const randomVariation = 0.02; // 2% variation
            const variationFactor = 1 + (Math.random() * randomVariation * 2 - randomVariation);
            tvlHistory.push(baseTvl * variationFactor);
        }

        return {
            symbol,
            price: basePrice,
            priceHistory,
            tvl: baseTvl,
            tvlHistory
        };
    }

    /**
     * Helper for mock data
     */
    private getMockBasePrice(symbol: string): number {
        const mockPrices: Record<string, number> = {
            'ETH': 3000,
            'BTC': 50000,
            'USDC': 1,
            'DAI': 1,
            'WBTC': 50000,
            'USDT': 1,
            'LINK': 20,
            'UNI': 10,
            'AAVE': 150,
            'SNX': 5
        };

        return mockPrices[symbol] || Math.random() * 100;
    }

    /**
     * Helper for mock data
     */
    private getMockBaseTvl(symbol: string): number {
        const mockTvls: Record<string, number> = {
            'ETH': 500000000,
            'BTC': 1000000000,
            'USDC': 800000000,
            'DAI': 400000000,
            'WBTC': 300000000,
            'USDT': 700000000,
            'LINK': 100000000,
            'UNI': 50000000,
            'AAVE': 75000000,
            'SNX': 25000000
        };

        return mockTvls[symbol] || Math.random() * 10000000;
    }
}

/**
 * Starknet trade executor
 */
class StarknetTradeExecutor {
    private config: StarknetConfig;
    private onTradeExecuted?: (action: "BUY" | "SELL", symbol: string, quantity: number, price: number) => void;

    constructor(
        config: StarknetConfig,
        onTradeExecuted?: (action: "BUY" | "SELL", symbol: string, quantity: number, price: number) => void
    ) {
        this.config = config;
        this.onTradeExecuted = onTradeExecuted;
    }

    /**
     * Execute a buy order on a DEX
     */
    public async executeBuyOrder(symbol: string, quantity: number, maxPrice: number): Promise<boolean> {
        try {
            console.log(`Executing buy order: ${quantity} ${symbol} @ max price ${maxPrice}`);

            const tokenAddress = this.config.tokenContracts[symbol];
            if (!tokenAddress) {
                throw new Error(`No contract address configured for token ${symbol}`);
            }

            // In a real implementation:
            // 1. Call your Starknet contract to execute the trade
            // 2. Wait for transaction confirmation
            // 3. Handle any errors

            // Simulate API call latency
            await new Promise(resolve => setTimeout(resolve, 500));

            // Trigger callback if provided
            if (this.onTradeExecuted) {
                this.onTradeExecuted("BUY", symbol, quantity, maxPrice);
            }

            console.log(`Buy order for ${symbol} completed successfully`);
            return true;

        } catch (error) {
            console.error(`Failed to execute buy order for ${symbol}:`, error);
            return false;
        }
    }

    /**
     * Execute a sell order on a DEX
     */
    public async executeSellOrder(symbol: string, quantity: number, minPrice: number): Promise<boolean> {
        try {
            console.log(`Executing sell order: ${quantity} ${symbol} @ min price ${minPrice}`);

            const tokenAddress = this.config.tokenContracts[symbol];
            if (!tokenAddress) {
                throw new Error(`No contract address configured for token ${symbol}`);
            }

            // In a real implementation:
            // 1. Call your Starknet contract to execute the trade
            // 2. Wait for transaction confirmation
            // 3. Handle any errors

            // Simulate API call latency
            await new Promise(resolve => setTimeout(resolve, 500));

            // Trigger callback if provided
            if (this.onTradeExecuted) {
                this.onTradeExecuted("SELL", symbol, quantity, minPrice);
            }

            console.log(`Sell order for ${symbol} completed successfully`);
            return true;

        } catch (error) {
            console.error(`Failed to execute sell order for ${symbol}:`, error);
            return false;
        }
    }
}

// Example usage:
/*
import { createStarknetTradingAgent, StarknetConfig } from './starknet-trading-agent';

// Configure the trading agent
const starknetConfig: StarknetConfig = {
  rpcUrl: "https://starknet-mainnet.example.com/v3/your-api-key",
  accountAddress: "0x123...789", // Your account address
  privateKey: "0xabcdef...", // Your private key
  tokenContracts: {
    "ETH": "0xETH_CONTRACT_ADDRESS",
    "USDC": "0xUSDC_CONTRACT_ADDRESS",
    // Add more tokens as needed
  },
  dexRouterAddress: "0xDEX_ROUTER_ADDRESS"
};

// Create and start the trading agent
const tradingAgent = createStarknetTradingAgent(
  starknetConfig,
  {
    initialCapital: 10000, // Starting capital
    profitTargetPercent: 0.05, // 5% profit target
    stopLossPercent: 0.02, // 2% stop loss
  },
  {
    onTradeExecuted: (action, symbol, quantity, price) => {
      console.log(`Trade executed: ${action} ${quantity} ${symbol} @ ${price}`);
    },
    onCycleCompleted: (portfolioState) => {
      console.log(`Cycle completed. Portfolio value: ${portfolioState.totalValue}`);
    },
    onError: (error) => {
      console.error("Trading agent error:", error);
    }
  }
);

// Start the agent (with immediate execution)
tradingAgent.start(true);

// Later, you can:
// tradingAgent.executeNow(); // Run a cycle immediately
// tradingAgent.stop(); // Stop the scheduled executions
// const portfolioState = tradingAgent.getPortfolioState(); // Get the current state
*/