import OpenAI from 'openai';
import { z } from "zod";
import dotenv from "dotenv";
import { FetchVolatileTokens } from '../Functions/FetchVolatileTokens';
dotenv.config();

interface VolatilityData {
    token_symbol: string;
    token_name: string;
    token_address: string;
    volatility: number | { percentChange24h: number };
}

interface TradingRecommendation {
    recommendation: "BUY" | "SELL" | "HOLD";
    confidence: number;
    reasoning: string;
    marketSentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
    keyInsights: string[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    ecosystemInsights: {
        strongProjects: string[];
        concerningProjects: string[];
        developmentActivity: "HIGH" | "MEDIUM" | "LOW";
    };
    volatilityInsights?: {
        marketVolatility: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
        volatileTokens: string[];
        stableTokens: string[];
    };
}

interface StarkNetAnalysisResult {
    query: string;
    totalTweets: number;
    sampleTweets?: string[];
    timestamp: number;
    analysis: {
        ecosystemAnalysis: {
            starkware: number;
            argent: number;
            braavos: number;
            jediswap: number;
            myswap: number;
            zkpad: number;
            cairo: number;
            madara: number;
            kakarot: number;
            [key: string]: number;
        };
        sentimentAnalysis: {
            positive: number;
            negative: number;
            neutral: number;
        };
        developmentMetrics: {
            cairoMentions: number;
            smartContracts: number;
            zkTechnology: number;
        };
        communityMetrics: {
            totalEngagement: number;
            uniqueUsers: number;
            avgEngagementPerTweet: number;
        };
        topHashtags: string[];
        influentialAccounts?: string[];
        sentimentTrend?: "RISING" | "FALLING" | "STABLE";
    };
    volatilityData?: {
        tokens: any[];
        averageVolatility: number;
        highVolatilityTokens: string[];
        lowVolatilityTokens: string[];
        marketVolatilityLevel: "HIGH" | "MEDIUM" | "LOW";
    };
    priceData?: {
        current: number;
        yesterday: number;
        weekAgo: number;
        percentChange24h: number;
        percentChange7d: number;
    };
}

// Interface for model response
interface ModelResponse {
    recommendation: TradingRecommendation;
    model: string;
}

// Define the schema for analyzer input
const StarkNetAnalyzerSchema = z.object({
    query: z.string().describe("The search query for StarkNet-related tweets"),
    maxTweets: z.number().optional().default(100).describe("Maximum number of tweets to analyze"),
    includeReplies: z.boolean().optional().default(false).describe("Whether to include reply tweets"),
    cryptoSymbol: z.string().default("STRK").describe("Symbol of the StarkNet token to analyze"),
    confidenceThreshold: z.number().optional().default(60).describe("Minimum confidence threshold for trading recommendations"),
    includeVolatility: z.boolean().optional().default(true).describe("Whether to include token volatility analysis"),
}).describe("Analyzes StarkNet-related trends, sentiment, and ecosystem activity on Twitter");

class StarkNetLLMAnalyzer {
    private openai: OpenAI;
    private siteInfo: {
        url: string;
        name: string;
    };
    private readonly DEFAULT_CONFIDENCE_THRESHOLD = 60;
    private readonly DATA_FRESHNESS_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds

    constructor(apiKey: string, siteUrl: string = '', siteName: string = '') {
        this.openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY || apiKey,
            baseURL: 'https://openrouter.ai/api/v1'
        });

        this.siteInfo = {
            url: siteUrl,
            name: siteName
        };
    }

    async analyzeTradingDecision(
        analysisResult: StarkNetAnalysisResult,
        cryptoSymbol: string = "STRK",
        primaryModel: string = 'google/gemini-2.0-flash-001',
        confidenceThreshold: number = this.DEFAULT_CONFIDENCE_THRESHOLD,
        includeVolatility: boolean = true
    ): Promise<TradingRecommendation> {
        try {
            if (!this.validateAnalysisResult(analysisResult)) {
                console.warn("Analysis data failed validation, returning default recommendation");
                return this.getDefaultRecommendation("Insufficient or low-quality data");
            }

            // Fetch volatility data if requested and not already included
            if (includeVolatility && !analysisResult.volatilityData) {
                try {
                    // Use the existing function directly
                    const result = await FetchVolatileTokens();
                    if (result && result.volatileTokensData) {
                        analysisResult.volatilityData = this.processVolatilityData(result.volatileTokensData);
                    }
                } catch (error) {
                    console.warn("Failed to fetch volatility data:", error);
                    // Continue without volatility data
                }
            }

            // Prepare data and get model recommendation
            const modelResponse: ModelResponse = {
                model: primaryModel,
                recommendation: await this.getModelRecommendation(analysisResult, cryptoSymbol, primaryModel)
            };

            return this.applyBusinessRules(
                modelResponse.recommendation,
                confidenceThreshold,
                analysisResult.volatilityData
            );
        } catch (error) {
            console.error("Error analyzing StarkNet trading decision:", error);
            return this.getDefaultRecommendation("Error in analysis process");
        }
    }

    private processVolatilityData(tokenData: any[]): {
        tokens: any[];
        averageVolatility: number;
        highVolatilityTokens: string[];
        lowVolatilityTokens: string[];
        marketVolatilityLevel: "HIGH" | "MEDIUM" | "LOW";
    } {
        // Process the volatility data
        const tokensWithVolatility = tokenData.map(token => {
            const volatilityValue = typeof token.volatility === 'object' ?
                token.volatility.percentChange24h :
                typeof token.volatility === 'number' ? token.volatility : 0;

            return {
                ...token,
                volatilityValue,
                riskCategory: Math.abs(volatilityValue) >= 10 ? "HIGH" :
                              Math.abs(volatilityValue) >= 5 ? "MEDIUM" : "LOW"
            };
        });

        // Calculate average volatility
        const totalVolatility = tokensWithVolatility.reduce((sum, token) => {
            return sum + Math.abs(token.volatilityValue || 0);
        }, 0);

        const avgVolatility = tokensWithVolatility.length > 0 ?
            totalVolatility / tokensWithVolatility.length : 0;

        // Identify high/low volatility tokens
        const highVolatilityTokens: string[] = tokensWithVolatility
            .filter(t => t.riskCategory === "HIGH")
            .sort((a, b) => Math.abs(b.volatilityValue || 0) - Math.abs(a.volatilityValue || 0))
            .slice(0, 5)
            .map(t => t.token_symbol || 'Unknown')
            .filter(Boolean);

        const lowVolatilityTokens: string[] = tokensWithVolatility
            .filter(t => t.riskCategory === "LOW")
            .sort((a, b) => Math.abs(a.volatilityValue || 0) - Math.abs(b.volatilityValue || 0))
            .slice(0, 5)
            .map(t => t.token_symbol || 'Unknown')
            .filter(Boolean);

        // Determine market volatility level with proper type
        let marketVolatilityLevel: "HIGH" | "MEDIUM" | "LOW";
        if (avgVolatility >= 8) {
            marketVolatilityLevel = "HIGH";
        } else if (avgVolatility >= 4) {
            marketVolatilityLevel = "MEDIUM";
        } else {
            marketVolatilityLevel = "LOW";
        }

        return {
            tokens: tokensWithVolatility,
            averageVolatility: parseFloat(avgVolatility.toFixed(2)),
            highVolatilityTokens,
            lowVolatilityTokens,
            marketVolatilityLevel
        };
    }

    // Get a recommendation from a specific model
    private async getModelRecommendation(
        analysisResult: StarkNetAnalysisResult,
        cryptoSymbol: string,
        modelName: string
    ): Promise<TradingRecommendation> {
        try {
            // Create an enriched prompt with StarkNet-specific context
            const prompt = this.createEnhancedTradingPrompt(analysisResult, cryptoSymbol);

            // Call the OpenRouter API with improved system prompt
            const response = await this.openai.chat.completions.create({
                model: modelName,
                max_tokens: 1500,
                temperature: 0.1,
                messages: [
                    {
                        role: "system",
                        content: `You are a StarkNet ecosystem expert and cryptocurrency trading advisor analyzing Twitter sentiment, market data, and token volatility. 
            
            Your analysis must be:
            - Balanced and evidence-based with specific focus on StarkNet ecosystem projects
            - Skeptical of hype or excessive negativity
            - Conservative in confidence scores (only >80 for strong signals)
            - Focused on both token price, volatility metrics, and ecosystem health indicators
            
            Guidelines for recommendation:
            - BUY: Recommend only with strong positive signals AND healthy ecosystem development AND acceptable volatility
            - SELL: Recommend only with strong negative signals AND declining ecosystem activity OR excessive volatility
            - HOLD: Default position when signals are mixed or weak
            
            Confidence scoring:
            - 80-100: Very strong conviction with multiple confirming signals across ecosystem
            - 60-79: Moderate conviction with some confirming signals
            - 0-59: Low conviction or mixed signals
            
            Risk assessment:
            - HIGH: Volatile sentiment, contradictory signals, thin data, low development activity, high token volatility
            - MEDIUM: Some uncertainty but consistent trends, moderate volatility
            - LOW: Clear signals, strong consensus, abundant data, strong development activity, low volatility
            
            Ecosystem assessment:
            - Focus on development activity in Cairo, dApp activity, and project-specific metrics
            - Analyze user engagement trends and sentiment toward key projects
            - Evaluate if development activity aligns with market sentiment
            - Consider volatility metrics when assessing risk levels
            
            You MUST respond ONLY with the JSON object as specified in the prompt, no other text.`
                    },
                    { role: "user", content: prompt }
                ]
            }, {
                headers: {
                    'HTTP-Referer': this.siteInfo.url,
                    'X-Title': this.siteInfo.name
                }
            });

            // Get the response text
            const responseText = response.choices[0]?.message?.content || '';

            // Parse the JSON response
            try {
                // Extract JSON from the response (in case there's additional text)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error("No JSON found in response");
                }

                const recommendation = JSON.parse(jsonMatch[0]) as TradingRecommendation;
                return this.validateRecommendation(recommendation);
            } catch (parseError) {
                console.error("Failed to parse API response:", parseError);
                return this.getDefaultRecommendation("Error parsing model response");
            }
        } catch (error) {
            console.error("Error calling API:", error);
            return this.getDefaultRecommendation("API call failed");
        }
    }

    private createEnhancedTradingPrompt(analysisResult: StarkNetAnalysisResult, cryptoSymbol: string): string {
        const { query, totalTweets, sampleTweets, analysis, priceData, volatilityData } = analysisResult;
        const {
            ecosystemAnalysis,
            sentimentAnalysis,
            developmentMetrics,
            communityMetrics,
            topHashtags,
            influentialAccounts,
            sentimentTrend
        } = analysis;

        // Format ecosystem project mentions
        const projectMentions = Object.entries(ecosystemAnalysis)
            .sort(([, a], [, b]) => b - a)
            .map(([project, count]) => `${project}: ${count} mentions`)
            .join('\n    - ');

        // Calculate sentiment ratios
        const totalSentimentTweets = sentimentAnalysis.positive + sentimentAnalysis.negative + sentimentAnalysis.neutral;
        const positiveRatio = totalSentimentTweets > 0 ? (sentimentAnalysis.positive / totalSentimentTweets) * 100 : 0;
        const negativeRatio = totalSentimentTweets > 0 ? (sentimentAnalysis.negative / totalSentimentTweets) * 100 : 0;
        const neutralRatio = totalSentimentTweets > 0 ? (sentimentAnalysis.neutral / totalSentimentTweets) * 100 : 0;

        const sentimentBreakdown = `
    - Positive tweets: ${sentimentAnalysis.positive} (${Math.round(positiveRatio)}%)
    - Negative tweets: ${sentimentAnalysis.negative} (${Math.round(negativeRatio)}%)
    - Neutral tweets: ${sentimentAnalysis.neutral} (${Math.round(neutralRatio)}%)
    - Overall sentiment trend: ${sentimentTrend || "STABLE"}`;

        const developmentAnalysis = `
    DEVELOPMENT METRICS:
    - Cairo language mentions: ${developmentMetrics.cairoMentions}
    - Smart contract discussions: ${developmentMetrics.smartContracts}
    - ZK technology mentions: ${developmentMetrics.zkTechnology}`;

        const communityAnalysis = `
    COMMUNITY METRICS:
    - Total engagement: ${communityMetrics.totalEngagement}
    - Unique users: ${communityMetrics.uniqueUsers}
    - Average engagement per tweet: ${communityMetrics.avgEngagementPerTweet}`;

        const priceContext = priceData ? `
    PRICE DATA:
    - Current price: $${priceData.current}
    - 24h change: ${priceData.percentChange24h > 0 ? '+' : ''}${priceData.percentChange24h}%
    - 7d change: ${priceData.percentChange7d > 0 ? '+' : ''}${priceData.percentChange7d}%` : '';

        // Add volatility data if available
        const volatilityContext = volatilityData ? `
    VOLATILITY ANALYSIS:
    - Market volatility level: ${volatilityData.marketVolatilityLevel}
    - Average token volatility: ${volatilityData.averageVolatility}%
    - High volatility tokens: ${volatilityData.highVolatilityTokens.join(', ')}
    - Stable tokens: ${volatilityData.lowVolatilityTokens.join(', ')}` : '';

        const tweetSamples = sampleTweets && sampleTweets.length > 0
            ? `
    SAMPLE TWEETS:
    ${sampleTweets.slice(0, 5).map(tweet => `- "${tweet}"`).join('\n')}`
            : '';

        const influencers = influentialAccounts && influentialAccounts.length > 0
            ? `
    INFLUENTIAL ACCOUNTS DISCUSSING:
    ${influentialAccounts.join(', ')}`
            : '';

        return `
STARKNET ECOSYSTEM ANALYSIS FOR: ${cryptoSymbol}
TWITTER SENTIMENT ANALYSIS:
- Query: "${query}"
- Total tweets analyzed: ${totalTweets}

ECOSYSTEM PROJECT MENTIONS:
    - ${projectMentions}

SENTIMENT ANALYSIS:${sentimentBreakdown}

- Top hashtags: ${topHashtags.join(', ')}${influencers}${developmentAnalysis}${communityAnalysis}${tweetSamples}${priceContext}

Based on this StarkNet ecosystem data, volatility metrics, and market information, provide a trading recommendation in the following JSON format:
{
  "recommendation": "BUY" or "SELL" or "HOLD",
  "confidence": [number between 0-100],
  "reasoning": [concise explanation with specific evidence from data],
  "marketSentiment": "BULLISH" or "BEARISH" or "NEUTRAL",
  "keyInsights": [array of 3-5 key observations from the data],
  "riskLevel": "LOW" or "MEDIUM" or "HIGH",
  "ecosystemInsights": {
    "strongProjects": [array of 1-3 projects showing strength],
    "concerningProjects": [array of 0-3 projects showing weakness],
    "developmentActivity": "HIGH" or "MEDIUM" or "LOW"
  },
  "volatilityInsights": {
    "marketVolatility": "HIGH" or "MEDIUM" or "LOW",
    "volatileTokens": [array of tokens with high volatility],
    "stableTokens": [array of tokens with low volatility]
  }
}

Remember to balance social media sentiment with ecosystem development metrics and volatility data. Be conservative in your recommendation and confidence level when data is limited, contradictory, or shows high volatility.

Respond ONLY with the JSON object, no other text.
    `;
    }

    private validateAnalysisResult(result: StarkNetAnalysisResult): boolean {
        if (!result || !result.analysis) {
            return false;
        }

        // Check for minimum data requirements
        if (result.totalTweets < 30) {
            console.warn("Insufficient tweet volume for reliable analysis");
            return false;
        }

        // Check data freshness
        const currentTime = Date.now();
        if (currentTime - result.timestamp > this.DATA_FRESHNESS_THRESHOLD) {
            console.warn("Data is stale, over 1 hour old");
            return false;
        }

        return true;
    }

    // Validate and sanitize the recommendation
    private validateRecommendation(rec: TradingRecommendation): TradingRecommendation {
        // Check for consistency between recommendation and sentiment
        if (rec.recommendation === "BUY" && rec.marketSentiment === "BEARISH") {
            console.warn("Inconsistent recommendation: BUY with BEARISH sentiment");
            rec.confidence = Math.min(rec.confidence, 40);
        }

        if (rec.recommendation === "SELL" && rec.marketSentiment === "BULLISH") {
            console.warn("Inconsistent recommendation: SELL with BULLISH sentiment");
            rec.confidence = Math.min(rec.confidence, 40);
        }

        // Ensure confidence is within bounds
        rec.confidence = Math.max(0, Math.min(100, rec.confidence));

        // Default keyInsights if none provided
        if (!rec.keyInsights || rec.keyInsights.length === 0) {
            rec.keyInsights = ["Limited data available for analysis"];
        }

        // Ensure ecosystemInsights exists
        if (!rec.ecosystemInsights) {
            rec.ecosystemInsights = {
                strongProjects: [],
                concerningProjects: [],
                developmentActivity: "MEDIUM"
            };
        }

        // Ensure volatilityInsights exists if not already
        if (!rec.volatilityInsights) {
            rec.volatilityInsights = {
                marketVolatility: "UNKNOWN",
                volatileTokens: [],
                stableTokens: []
            };
        }

        return rec;
    }

    // Apply business rules to finalize recommendation
    private applyBusinessRules(
        recommendation: TradingRecommendation,
        confidenceThreshold: number,
        volatilityData?: {
            marketVolatilityLevel: "HIGH" | "MEDIUM" | "LOW";
            averageVolatility: number;
        }
    ): TradingRecommendation {
        // Rule 1: If confidence below threshold, downgrade to HOLD
        if (recommendation.confidence < confidenceThreshold &&
            recommendation.recommendation !== "HOLD") {
            return {
                ...recommendation,
                recommendation: "HOLD",
                reasoning: `Original ${recommendation.recommendation} recommendation had insufficient confidence (${recommendation.confidence}%). ${recommendation.reasoning}`,
                keyInsights: [...recommendation.keyInsights, `Confidence below threshold of ${confidenceThreshold}%`]
            };
        }

        // Rule 2: High risk situation with moderate confidence should be HOLD
        if (recommendation.riskLevel === "HIGH" &&
            recommendation.confidence < 80 &&
            recommendation.recommendation !== "HOLD") {
            return {
                ...recommendation,
                recommendation: "HOLD",
                reasoning: `High risk situation with moderate confidence. Original recommendation: ${recommendation.recommendation}. ${recommendation.reasoning}`,
                keyInsights: [...recommendation.keyInsights, "High risk situation suggests caution"]
            };
        }

        // Rule 3: Low development activity with BUY recommendation should be reconsidered
        if (recommendation.recommendation === "BUY" &&
            recommendation.ecosystemInsights.developmentActivity === "LOW" &&
            recommendation.confidence < 85) {
            return {
                ...recommendation,
                recommendation: "HOLD",
                reasoning: `Low development activity with moderate buy signal. ${recommendation.reasoning}`,
                keyInsights: [...recommendation.keyInsights, "Development activity doesn't support strong buy signal"]
            };
        }

        // Rule 4: High market volatility with BUY recommendation should be reconsidered
        if (volatilityData &&
            volatilityData.marketVolatilityLevel === "HIGH" &&
            recommendation.recommendation === "BUY" &&
            recommendation.confidence < 85) {

            // Ensure volatility insights exist and are properly initialized
            const currentVolatilityInsights = recommendation.volatilityInsights || {
                marketVolatility: "UNKNOWN",
                volatileTokens: [],
                stableTokens: []
            };

            return {
                ...recommendation,
                recommendation: "HOLD",
                reasoning: `High market volatility (${volatilityData.averageVolatility}%) with moderate buy signal. ${recommendation.reasoning}`,
                keyInsights: [...recommendation.keyInsights, "High market volatility suggests caution with new positions"],
                volatilityInsights: {
                    ...currentVolatilityInsights,
                    marketVolatility: "HIGH"
                }
            };
        }

        return recommendation;
    }

    private getDefaultRecommendation(reason: string = "Insufficient data"): TradingRecommendation {
        return {
            recommendation: "HOLD",
            confidence: 0,
            reasoning: `Default HOLD recommendation due to: ${reason}`,
            marketSentiment: "NEUTRAL",
            keyInsights: [reason, "System defaulted to conservative position"],
            riskLevel: "HIGH",
            ecosystemInsights: {
                strongProjects: [],
                concerningProjects: [],
                developmentActivity: "LOW"
            },
            volatilityInsights: {
                marketVolatility: "UNKNOWN",
                volatileTokens: [],
                stableTokens: []
            }
        };
    }

    async analyze(input: z.infer<typeof StarkNetAnalyzerSchema>): Promise<TradingRecommendation> {
        try {
            console.log(`Analyzing ${input.query} with max tweets: ${input.maxTweets}`);

            // If volatility analysis is requested, fetch the volatility data
            let volatilityData;
            if (input.includeVolatility) {
                try {
                    const result = await FetchVolatileTokens();
                    volatilityData = result?.volatileTokensData;
                } catch (error) {
                    console.warn("Failed to fetch volatility data:", error);
                }
            }

            // If we have volatility data but no other data, return a volatility-focused recommendation
            if (volatilityData) {
                const processedVolatility = this.processVolatilityData(volatilityData);

                // Create a minimal analysis result with the volatility data
                const analysisResult: StarkNetAnalysisResult = {
                    query: input.query,
                    totalTweets: 100, // Placeholder
                    timestamp: Date.now(),
                    analysis: {
                        ecosystemAnalysis: {
                            starkware: 10, argent: 10, braavos: 10, jediswap: 10,
                            myswap: 10, zkpad: 10, cairo: 10, madara: 10, kakarot: 10
                        },
                        sentimentAnalysis: { positive: 40, negative: 20, neutral: 40 },
                        developmentMetrics: { cairoMentions: 30, smartContracts: 20, zkTechnology: 50 },
                        communityMetrics: { totalEngagement: 1000, uniqueUsers: 200, avgEngagementPerTweet: 10 },
                        topHashtags: ["#starknet", "#cairo"]
                    },
                    volatilityData: processedVolatility
                };

                // Get trading recommendation using the available data
                return await this.analyzeTradingDecision(
                    analysisResult,
                    input.cryptoSymbol,
                    undefined,
                    input.confidenceThreshold,
                    true
                );
            }

            return this.getDefaultRecommendation("Scraper implementation required");
        } catch (error) {
            console.error("Error in analyze method:", error);
            return this.getDefaultRecommendation("Error during analysis");
        }
    }
}

export { StarkNetLLMAnalyzer, StarkNetAnalyzerSchema };
export type { StarkNetAnalysisResult, TradingRecommendation, VolatilityData };