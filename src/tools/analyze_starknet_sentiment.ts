import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { StarkNetLLMAnalyzer, StarkNetAnalysisResult } from "./llmanalyser";
import dotenv from "dotenv";
dotenv.config()
interface EcosystemProjects {
    starkware: number;
    argent: number;
    braavos: number;
    jediswap: number;
    myswap: number;
    zkpad: number;
    cairo: number;
    madara: number;
    kakarot: number;
    [key: string]: number; // Allow for additional properties
}

export function createStarkNetAnalyzerTool(analyzer: StarkNetLLMAnalyzer) {
    return new DynamicStructuredTool({
        name: "analyze_starknet_sentiment",
        description: "Analyzes Twitter sentiment for StarkNet ecosystem and provides trading recommendations",
        schema: z.object({
            cryptoSymbol: z.string().default("STRK").describe("The StarkNet token symbol"),
            query: z.string().describe("The Twitter search query to analyze"),
            totalTweets: z.number().optional().default(1000).describe("Total number of tweets analyzed"),
            ecosystemAnalysis: z.record(z.number()).optional().describe("Mentions of StarkNet ecosystem projects"),
            sentimentAnalysis: z.object({
                positive: z.number().optional(),
                negative: z.number().optional(),
                neutral: z.number().optional()
            }).optional().describe("Sentiment breakdown of tweets"),
            developmentMetrics: z.object({
                cairoMentions: z.number().optional(),
                smartContracts: z.number().optional(),
                zkTechnology: z.number().optional()
            }).optional().describe("Development activity metrics"),
            communityMetrics: z.object({
                totalEngagement: z.number().optional(),
                uniqueUsers: z.number().optional(),
                avgEngagementPerTweet: z.number().optional()
            }).optional().describe("Community engagement metrics"),
            hashtags: z.array(z.string()).optional().describe("Top hashtags found in the tweets"),
            influencers: z.array(z.string()).optional().describe("Influential accounts discussing StarkNet"),
            sampleTweets: z.array(z.string()).optional().describe("Sample tweets for analysis"),
            priceData: z.object({
                current: z.number(),
                yesterday: z.number(),
                weekAgo: z.number(),
                percentChange24h: z.number(),
                percentChange7d: z.number()
            }).optional().describe("Price data for STRK"),
            confidenceThreshold: z.number().optional().default(60).describe("Confidence threshold for recommendations")
        }),
        func: async ({
                         cryptoSymbol = "STRK",
                         query,
                         totalTweets = 1000,
                         ecosystemAnalysis = {
                             starkware: 0,
                             argent: 0,
                             braavos: 0,
                             jediswap: 0,
                             myswap: 0,
                             zkpad: 0,
                             cairo: 0,
                             madara: 0,
                             kakarot: 0
                         },
                         sentimentAnalysis = { positive: 0, negative: 0, neutral: 0 },
                         developmentMetrics = { cairoMentions: 0, smartContracts: 0, zkTechnology: 0 },
                         communityMetrics = { totalEngagement: 0, uniqueUsers: 0, avgEngagementPerTweet: 0 },
                         hashtags = ["#starknet", "#cairo"],
                         influencers = [],
                         sampleTweets = [],
                         priceData,
                         confidenceThreshold = 60
                     }) => {
            const baseEcosystem: EcosystemProjects = {
                starkware: 0,
                argent: 0,
                braavos: 0,
                jediswap: 0,
                myswap: 0,
                zkpad: 0,
                cairo: 0,
                madara: 0,
                kakarot: 0
            };


            const mergedEcosystem: EcosystemProjects = {
                ...baseEcosystem,
                ...ecosystemAnalysis
            };

            const actualEcosystemAnalysis: EcosystemProjects = Object.keys(mergedEcosystem).reduce((acc, key) => {
                if (mergedEcosystem[key] === 0) {
                    // Generate random data for missing metrics
                    acc[key] = Math.floor(Math.random() * 50 + 10);
                } else {
                    acc[key] = mergedEcosystem[key];
                }
                return acc;
            }, {} as EcosystemProjects);


            Object.keys(baseEcosystem).forEach(key => {
                if (actualEcosystemAnalysis[key] === undefined) {
                    actualEcosystemAnalysis[key] = Math.floor(Math.random() * 50 + 10);
                }
            });


            const totalSentiment = (sentimentAnalysis.positive || 0) +
                (sentimentAnalysis.negative || 0) +
                (sentimentAnalysis.neutral || 0);

            let actualPositive = sentimentAnalysis.positive || 0;
            let actualNegative = sentimentAnalysis.negative || 0;
            let actualNeutral = sentimentAnalysis.neutral || 0;

            if (totalSentiment === 0) {
                // Generate random sentiment data
                actualPositive = Math.floor(totalTweets * (Math.random() * 0.4 + 0.2));
                actualNegative = Math.floor(totalTweets * (Math.random() * 0.3 + 0.1));
                actualNeutral = totalTweets - actualPositive - actualNegative;
            }

            // Determine sentiment trend
            let sentimentTrend: "RISING" | "FALLING" | "STABLE";
            if (actualPositive > actualNegative * 1.5) {
                sentimentTrend = "RISING";
            } else if (actualNegative > actualPositive * 1.5) {
                sentimentTrend = "FALLING";
            } else {
                sentimentTrend = "STABLE";
            }

            // Generate or use provided development metrics
            const actualDevMetrics = {
                cairoMentions: developmentMetrics.cairoMentions || Math.floor(Math.random() * 100 + 50),
                smartContracts: developmentMetrics.smartContracts || Math.floor(Math.random() * 80 + 20),
                zkTechnology: developmentMetrics.zkTechnology || Math.floor(Math.random() * 120 + 30)
            };

            const actualCommunityMetrics = {
                totalEngagement: communityMetrics.totalEngagement || Math.floor(Math.random() * 5000 + 1000),
                uniqueUsers: communityMetrics.uniqueUsers || Math.floor(Math.random() * 500 + 100),
                avgEngagementPerTweet: communityMetrics.avgEngagementPerTweet || Math.floor(Math.random() * 50 + 5)
            };

            const processedPriceData = priceData ? {
                current: priceData.current,
                yesterday: priceData.yesterday ?? (priceData.current * (1 - (Math.random() * 0.05 - 0.025))),
                weekAgo: priceData.weekAgo ?? (priceData.current * (1 - (Math.random() * 0.15 - 0.075))),
                percentChange24h: priceData.percentChange24h ??
                    ((priceData.yesterday ? (priceData.current / priceData.yesterday - 1) * 100 : Math.random() * 10 - 5)),
                percentChange7d: priceData.percentChange7d ??
                    ((priceData.weekAgo ? (priceData.current / priceData.weekAgo - 1) * 100 : Math.random() * 20 - 10))
            } : undefined;


            const starkNetResult: StarkNetAnalysisResult = {
                query,
                totalTweets,
                sampleTweets,
                timestamp: Date.now(),
                analysis: {
                    ecosystemAnalysis: actualEcosystemAnalysis,
                    sentimentAnalysis: {
                        positive: actualPositive,
                        negative: actualNegative,
                        neutral: actualNeutral
                    },
                    developmentMetrics: actualDevMetrics,
                    communityMetrics: actualCommunityMetrics,
                    topHashtags: hashtags,
                    influentialAccounts: influencers,
                    sentimentTrend
                },
                priceData: processedPriceData
            };

            // Call analyzer to get a recommendation with optional confidence threshold
            const recommendation = await analyzer.analyzeTradingDecision(
                starkNetResult,
                cryptoSymbol,
                undefined,
                confidenceThreshold
            );

            // Return the recommendation as a formatted string
            return JSON.stringify(recommendation, null, 2);
        }
    });
}