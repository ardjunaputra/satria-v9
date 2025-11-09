import Snoowrap from 'snoowrap';
import { logger } from '../../utils/logger';
import { RawArticle, SourceFetchResult } from '../../types';

class RedditService {
  private client: Snoowrap | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.warn('Reddit API credentials not configured');
      return;
    }

    try {
      this.client = new Snoowrap({
        userAgent: 'SATRIA Intelligence Aggregator v1.0',
        clientId,
        clientSecret,
        refreshToken: '', // Not needed for public data
      });
    } catch (error) {
      logger.error('Failed to initialize Reddit client:', error);
    }
  }

  async fetchSubreddit(subreddit: string, timeWindow: number = 30): Promise<SourceFetchResult> {
    try {
      if (!this.client) {
        return {
          source_name: `Reddit r/${subreddit}`,
          articles: [],
          success: false,
          error: 'Reddit client not initialized',
        };
      }

      const cutoffTime = Date.now() - timeWindow * 60 * 1000;

      const submissions = await this.client
        .getSubreddit(subreddit)
        .getNew({ limit: 100 });

      const articles: RawArticle[] = submissions
        .filter((post: any) => post.created_utc * 1000 >= cutoffTime)
        .map((post: any) => ({
          title: post.title,
          content: post.selftext || post.url,
          url: `https://reddit.com${post.permalink}`,
          image_url: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : undefined,
          published_at: new Date(post.created_utc * 1000),
          source_name: `Reddit r/${subreddit}`,
          source_type: 'reddit',
        }));

      logger.info(`Reddit r/${subreddit}: Fetched ${articles.length} posts`);

      return {
        source_name: `Reddit r/${subreddit}`,
        articles,
        success: true,
      };
    } catch (error: any) {
      logger.error(`Reddit r/${subreddit} fetch error:`, error.message);
      return {
        source_name: `Reddit r/${subreddit}`,
        articles: [],
        success: false,
        error: error.message,
      };
    }
  }

  // Fetch from multiple OSINT-related subreddits
  async fetchOSINTSubreddits(): Promise<SourceFetchResult[]> {
    const subreddits = [
      'OSINT',
      'cybersecurity',
      'netsec',
      'IntelligenceNews',
      'geopolitics',
      'worldnews',
    ];

    const results: SourceFetchResult[] = [];

    for (const subreddit of subreddits) {
      const result = await this.fetchSubreddit(subreddit);
      results.push(result);
      // Rate limiting: wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }
}

export default new RedditService();
