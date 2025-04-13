// starknet-analyzer.test.ts
import { StarkNetAnalyzerTool } from './twitterScrapper';
import { Scraper } from "@the-convocation/twitter-scraper";

jest.mock('@the-convocation/twitter-scraper');

describe('StarkNetAnalyzerTool', () => {
  const mockTweets = [
    {
      text: "Excited about the new StarkNet cairo deployment! 🚀 #StarkNet #Cairo",
      likes: 100,
      retweets: 50,
      replies: 10,
      username: "user1",
      isReply: false
    },
    {
      text: "Found a bug in StarkWare implementation #StarkNet",
      likes: 20,
      retweets: 5,
      replies: 15,
      username: "user2",
      isReply: false
    }
  ];

  beforeEach(() => {
    (Scraper as jest.Mock).mockImplementation(() => ({
      getTweets: async function* () {
        for (const tweet of mockTweets) {
          yield tweet;
        }
      }
    }));
  });

  it('should analyze tweets correctly', async () => {
    const result = await StarkNetAnalyzerTool.invoke({
      query: "starknet",
      maxTweets: 10,
      includeReplies: false
    });

    expect(result).toMatchObject({
      query: "starknet",
      totalTweets: 2,
      analysis: expect.objectContaining({
        ecosystemAnalysis: expect.any(Object),
        sentimentAnalysis: expect.any(Object),
        developmentMetrics: expect.any(Object),
        communityMetrics: expect.any(Object),
        topHashtags: expect.any(Array)
      })
    });
  });

  it('should handle sentiment analysis correctly', async () => {
    const result = await StarkNetAnalyzerTool.invoke({
      query: "starknet",
      maxTweets: 10
    });

    expect(result.analysis.sentimentAnalysis).toEqual({
      positive: 1,
      negative: 1,
      neutral: 0
    });
  });

  it('should calculate community metrics correctly', async () => {
    const result = await StarkNetAnalyzerTool.invoke({
      query: "starknet",
      maxTweets: 10
    });

    expect(result.analysis.communityMetrics).toEqual({
      totalEngagement: 200,
      uniqueUsers: 2,
      avgEngagementPerTweet: 100
    });
  });

  it('should handle errors gracefully', async () => {
    (Scraper as jest.Mock).mockImplementation(() => ({
      getTweets: async function* () {
        throw new Error('API Error');
      }
    }));

    await expect(StarkNetAnalyzerTool.invoke({
      query: "starknet",
      maxTweets: 10
    })).rejects.toThrow('StarkNet analysis failed: API Error');
  });
});