// Mock class that matches OpenAI's structure
class MockOpenAI {
    chat = {
        completions: {
            create: jest.fn()
        }
    };

    constructor() {
        return this;
    }
}

// Mock the OpenAI module
jest.mock('openai', () => ({
    default: MockOpenAI
}));

import { StarkNetLLMAnalyzer, StarkNetAnalysisResult } from '../llmanalyser';

describe('StarkNetLLMAnalyzer', () => {
    let analyzer: StarkNetLLMAnalyzer;
    let mockCreateMethod: jest.Mock;

    // Valid analysis result that passes validation
    const validAnalysisResult: StarkNetAnalysisResult = {
        query: 'starknet',
        totalTweets: 100,
        timestamp: Date.now(),
        analysis: {
            ecosystemAnalysis: {
                starkware: 20,
                argent: 15,
                braavos: 10,
                jediswap: 8,
                myswap: 5,
                zkpad: 3,
                cairo: 30,
                madara: 7,
                kakarot: 4
            },
            sentimentAnalysis: {
                positive: 60,
                negative: 10,
                neutral: 30
            },
            developmentMetrics: {
                cairoMentions: 30,
                smartContracts: 15,
                zkTechnology: 25
            },
            communityMetrics: {
                totalEngagement: 5000,
                uniqueUsers: 80,
                avgEngagementPerTweet: 50
            },
            topHashtags: ['#StarkNet', '#Cairo']
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Access the mocked create method through prototype
        mockCreateMethod = MockOpenAI.prototype.chat.completions.create;

        // Initialize analyzer
        analyzer = new StarkNetLLMAnalyzer('test-api-key', 'https://test.com', 'Test Site');

        // Silence console
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should return a valid trading recommendation from successful API response', async () => {
        // Mock a successful response
        mockCreateMethod.mockResolvedValueOnce({
            choices: [{
                message: {
                    content: JSON.stringify({
                        recommendation: "BUY",
                        confidence: 85,
                        reasoning: "Strong positive sentiment",
                        marketSentiment: "BULLISH",
                        keyInsights: ["High Cairo mentions"],
                        riskLevel: "MEDIUM",
                        ecosystemInsights: {
                            strongProjects: ["Cairo"],
                            concerningProjects: [],
                            developmentActivity: "HIGH"
                        }
                    })
                }
            }]
        });

        const result = await analyzer.analyzeTradingDecision(validAnalysisResult, 'STRK');

        expect(result.recommendation).toBe('BUY');
        expect(result.confidence).toBe(85);
        expect(result.marketSentiment).toBe('BULLISH');
    });

    // Additional tests following the same pattern
});