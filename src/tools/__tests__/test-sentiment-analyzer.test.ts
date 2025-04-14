// src/tools/__tests__/test-sentiment-analyzer.test.ts
import { StarkNetLLMAnalyzer } from '../llmanalyser';
import { createStarkNetAnalyzerTool } from '../analyze_starknet_sentiment';
import { StarkNetAnalyzerTool } from '../twitterScrapper';

// Mock the LLM analyzer to avoid real API calls
jest.mock('../llmanalyser', () => {
    return {
        StarkNetLLMAnalyzer: jest.fn().mockImplementation(() => {
            return {
                analyzeTradingDecision: jest.fn().mockResolvedValue({
                    recommendation: "HOLD",
                    confidence: 75,
                    marketSentiment: "NEUTRAL",
                    keyInsights: [
                        "Strong developer activity on Cairo",
                        "Positive community engagement metrics",
                        "Price has stabilized after recent growth"
                    ]
                })
            };
        })
    };
});

// Mock the twitter scraper
jest.mock('../twitterScrapper', () => {
    return {
        StarkNetAnalyzerTool: {
            invoke: jest.fn().mockResolvedValue({
                query: 'starknet',
                totalTweets: 100,
                sampleTweets: ["StarkNet is amazing", "Love developing on Cairo"],
                timestamp: Date.now(),
                analysis: {
                    ecosystemAnalysis: {
                        starkware: 50,
                        argent: 40,
                        braavos: 30,
                        jediswap: 25,
                        myswap: 15,
                        zkpad: 10,
                        cairo: 60,
                        madara: 20,
                        kakarot: 15
                    },
                    sentimentAnalysis: {
                        positive: 60,
                        negative: 20,
                        neutral: 20
                    },
                    developmentMetrics: {
                        cairoMentions: 80,
                        smartContracts: 40,
                        zkTechnology: 50
                    },
                    communityMetrics: {
                        totalEngagement: 5000,
                        uniqueUsers: 200,
                        avgEngagementPerTweet: 25
                    },
                    topHashtags: ['#StarkNet', '#Cairo', '#zk'],
                    influentialAccounts: ['StarkWareLtd', 'StarkNet'],
                    sentimentTrend: "RISING"
                },
                priceData: {
                    current: 0.95,
                    yesterday: 0.92,
                    weekAgo: 0.85,
                    percentChange24h: 3.26,
                    percentChange7d: 11.76
                }
            })
        }
    };
});

describe('StarkNet Sentiment Analyzer', () => {
    it('should analyze sentiment using Twitter data', async () => {
        // Get Twitter data using the scraper (mocked)
        const twitterData = await StarkNetAnalyzerTool.invoke({
            query: 'starknet',
            maxTweets: 100
        });

        // Create the analyzer and sentiment tool
        const analyzer = new StarkNetLLMAnalyzer('mock-api-key');
        const sentimentTool = createStarkNetAnalyzerTool(analyzer);

        // Call the sentiment analysis tool with the Twitter data
        const result = await sentimentTool.invoke({
            cryptoSymbol: "STRK",
            query: twitterData.query,
            totalTweets: twitterData.totalTweets,
            ecosystemAnalysis: twitterData.analysis.ecosystemAnalysis,
            sentimentAnalysis: twitterData.analysis.sentimentAnalysis,
            developmentMetrics: twitterData.analysis.developmentMetrics,
            communityMetrics: twitterData.analysis.communityMetrics,
            hashtags: twitterData.analysis.topHashtags,
            influencers: twitterData.analysis.influentialAccounts || [],
            sampleTweets: twitterData.sampleTweets || [],
            priceData: twitterData.priceData
        });

        // Parse the result
        const parsedResult = JSON.parse(result);

        // Assertions
        expect(parsedResult).toBeDefined();
        expect(parsedResult.recommendation).toBe("HOLD");
        expect(parsedResult.confidence).toBe(75);
        expect(parsedResult.marketSentiment).toBe("NEUTRAL");
    });

    it('should analyze sentiment with mock data', async () => {
        // Create the analyzer and sentiment tool
        const analyzer = new StarkNetLLMAnalyzer('mock-api-key');
        const sentimentTool = createStarkNetAnalyzerTool(analyzer);

        // Test with mock data directly
        const result = await sentimentTool.invoke({
            cryptoSymbol: "STRK",
            query: "starknet ecosystem growth",
            totalTweets: 500,
            ecosystemAnalysis: {
                starkware: 120,
                argent: 85,
                braavos: 65,
                jediswap: 40,
                myswap: 25,
                zkpad: 15,
                cairo: 150,
                madara: 30,
                kakarot: 20
            },
            sentimentAnalysis: {
                positive: 300,
                negative: 50,
                neutral: 150
            },
            developmentMetrics: {
                cairoMentions: 150,
                smartContracts: 75,
                zkTechnology: 95
            },
            communityMetrics: {
                totalEngagement: 8500,
                uniqueUsers: 320,
                avgEngagementPerTweet: 17
            },
            hashtags: ['#StarkNet', '#Cairo', '#zk', '#Ethereum', '#L2'],
            influencers: ['StarkWareLtd', 'StarkNet', 'ArgentHQ'],
            sampleTweets: [
                "StarkNet is really gaining momentum in the zk rollup space",
                "Just deployed my first Cairo contract on StarkNet, the experience is smooth!"
            ],
            priceData: {
                current: 0.95,
                yesterday: 0.92,
                weekAgo: 0.83,
                percentChange24h: 3.26,
                percentChange7d: 14.46
            }
        });

        // Parse the result
        const parsedResult = JSON.parse(result);

        // Assertions
        expect(parsedResult).toBeDefined();
        expect(parsedResult.recommendation).toBe("HOLD");
        expect(parsedResult.confidence).toBe(75);
        expect(parsedResult.marketSentiment).toBe("NEUTRAL");
    });
});