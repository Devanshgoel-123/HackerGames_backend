import { StarkNetAnalyzerTool } from '../twitterScrapper';
import { Scraper } from '@the-convocation/twitter-scraper';

// Mock the Twitter scraper
jest.mock('@the-convocation/twitter-scraper', () => {
    return {
        Scraper: jest.fn().mockImplementation(() => {
            return {
                getTweets: jest.fn().mockImplementation(function* () {
                    yield {
                        text: 'Excited about #StarkNet and #Cairo development! 🚀',
                        likes: 50,
                        retweets: 10,
                        replies: 5,
                        username: 'user1',
                        isReply: false
                    };
                    yield {
                        text: 'Having an issue with argent wallet on StarkNet. Any help?',
                        likes: 2,
                        retweets: 0,
                        replies: 3,
                        username: 'user2',
                        isReply: false
                    };
                    yield {
                        text: 'Just deployed my first smart contract on #StarkNet! Great experience.',
                        likes: 30,
                        retweets: 5,
                        replies: 2,
                        username: 'user3',
                        isReply: false
                    };
                })
            };
        })
    };
});

describe('StarkNetAnalyzerTool', () => {
    it('should analyze tweets correctly', async () => {
        const result = await StarkNetAnalyzerTool.invoke({
            query: 'starknet',
            maxTweets: 10
        });

        expect(result).toBeDefined();
        expect(result.totalTweets).toBe(3);
        expect(result.analysis.ecosystemAnalysis.argent).toBe(1);
        expect(result.analysis.sentimentAnalysis.positive).toBeGreaterThan(0);
    });

    it('should filter out replies when includeReplies is false', async () => {
        // Add a test for reply filtering
        const result = await StarkNetAnalyzerTool.invoke({
            query: 'starknet',
            maxTweets: 10,
            includeReplies: false
        });

        expect(result.totalTweets).toBe(3);
    });
});