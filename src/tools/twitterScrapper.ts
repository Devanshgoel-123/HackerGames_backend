import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Scraper, Tweet } from "@the-convocation/twitter-scraper";
import dotenv from "dotenv";
dotenv.config()
// Define interfaces
interface SafeTweet extends Tweet {
  text: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  username?: string;
  isReply?: boolean;
}

// Define the schema
const StarkNetAnalyzerSchema = z.object({
  query: z.string().describe("The search query for StarkNet-related tweets"),
  maxTweets: z.number().optional().default(100).describe("Maximum number of tweets to analyze"),
  includeReplies: z.boolean().optional().default(false).describe("Whether to include reply tweets"),
}).describe("Analyzes StarkNet-related trends, sentiment, and ecosystem activity on Twitter");

class TweetAnalyzer {
  private scraper: Scraper;

  constructor() {
    this.scraper = new Scraper();
  }

  async analyze(input: z.infer<typeof StarkNetAnalyzerSchema>) {
    try {
      const tweets: SafeTweet[] = [];
      
      for await (const tweet of this.scraper.getTweets(input.query, input.maxTweets)) {
        if (tweet && typeof tweet.text === 'string') {
          if (!input.includeReplies && tweet.isReply) continue;
          tweets.push(tweet as SafeTweet);
        }
      }

      return {
        query: input.query,
        totalTweets: tweets.length,
        analysis: {
          ecosystemAnalysis: this.analyzeEcosystem(tweets),
          sentimentAnalysis: this.analyzeSentiment(tweets),
          developmentMetrics: this.analyzeDevelopment(tweets),
          communityMetrics: this.analyzeCommunity(tweets),
          topHashtags: this.getTopHashtags(tweets),
        }
      };
    } catch (error) {
      throw new Error(`StarkNet analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private analyzeEcosystem(tweets: SafeTweet[]) {
    const ecosystemProjects = {
      'starkware': 0,
      'argent': 0,
      'braavos': 0,
      'jediswap': 0,
      'myswap': 0,
      'zkpad': 0,
      'cairo': 0,
      'madara': 0,
      'kakarot': 0,
    };

    tweets.forEach(tweet => {
      Object.keys(ecosystemProjects).forEach(project => {
        if (tweet.text.toLowerCase().includes(project.toLowerCase())) {
          ecosystemProjects[project as keyof typeof ecosystemProjects]++;
        }
      });
    });

    return ecosystemProjects;
  }

  private analyzeSentiment(tweets: SafeTweet[]) {
    const sentimentIndicators = {
      positive: ['bullish', '🚀', 'excited', 'great', 'amazing', 'excellent'],
      negative: ['bearish', 'concerned', 'issue', 'problem', 'bug', 'error'],
    };

    return {
      positive: tweets.filter(tweet =>
        sentimentIndicators.positive.some(indicator =>
          tweet.text.toLowerCase().includes(indicator.toLowerCase())
        )
      ).length,
      negative: tweets.filter(tweet =>
        sentimentIndicators.negative.some(indicator =>
          tweet.text.toLowerCase().includes(indicator.toLowerCase())
        )
      ).length,
      neutral: tweets.length - tweets.filter(tweet =>
        [...sentimentIndicators.positive, ...sentimentIndicators.negative].some(indicator =>
          tweet.text.toLowerCase().includes(indicator.toLowerCase())
        )
      ).length,
    };
  }

  private analyzeDevelopment(tweets: SafeTweet[]) {
    return {
      cairoMentions: tweets.filter(tweet =>
        tweet.text.toLowerCase().includes('cairo')
      ).length,
      smartContracts: tweets.filter(tweet =>
        tweet.text.toLowerCase().includes('smart contract') ||
        tweet.text.toLowerCase().includes('deploy')
      ).length,
      zkTechnology: tweets.filter(tweet =>
        tweet.text.toLowerCase().includes('zk') ||
        tweet.text.toLowerCase().includes('zero knowledge')
      ).length,
    };
  }

  private analyzeCommunity(tweets: SafeTweet[]) {
    return {
      totalEngagement: tweets.reduce((acc, tweet) => {
        return acc + (tweet.likes || 0) + (tweet.retweets || 0) + (tweet.replies || 0);
      }, 0),
      uniqueUsers: new Set(tweets.map(tweet => tweet.username)).size,
      avgEngagementPerTweet: tweets.length > 0 
        ? Math.round(tweets.reduce((acc, tweet) => {
            return acc + (tweet.likes || 0) + (tweet.retweets || 0) + (tweet.replies || 0);
          }, 0) / tweets.length)
        : 0,
    };
  }

  private getTopHashtags(tweets: SafeTweet[]) {
    const hashtags: Record<string, number> = {};
    
    tweets.forEach(tweet => {
      const matches = tweet.text.match(/#\w+/g) || [];
      matches.forEach(tag => {
        hashtags[tag] = (hashtags[tag] || 0) + 1;
      });
    });

    return Object.entries(hashtags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }
}

export const StarkNetAnalyzerTool = tool(
  async (input: z.infer<typeof StarkNetAnalyzerSchema>) => {
    const analyzer = new TweetAnalyzer();
    return analyzer.analyze(input);
  },
  {
    name: "starknet_analyzer",
    description: "Analyzes StarkNet-related trends, sentiment, and ecosystem activity on Twitter",
    schema: StarkNetAnalyzerSchema,
  }
);