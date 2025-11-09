import Parser from 'rss-parser';
import { logger } from '../../utils/logger';
import { RawArticle, SourceFetchResult } from '../../types';
import { Source } from '../../models';

class RSSService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 30000,
      headers: {
        'User-Agent': 'SATRIA Intelligence Aggregator/1.0',
      },
    });
  }

  async fetchFeed(feedUrl: string, sourceName: string): Promise<SourceFetchResult> {
    try {
      const feed = await this.parser.parseURL(feedUrl);

      const articles: RawArticle[] = feed.items
        .filter((item) => item.title && item.pubDate)
        .map((item) => ({
          title: item.title!,
          content: item.content || item.contentSnippet || item.summary || '',
          url: item.link || item.guid || '',
          image_url: item.enclosure?.url || undefined,
          published_at: new Date(item.pubDate!),
          source_name: sourceName || feed.title || 'RSS Feed',
          source_type: 'rss',
        }));

      logger.info(`RSS (${sourceName}): Fetched ${articles.length} articles`);

      return {
        source_name: sourceName,
        articles,
        success: true,
      };
    } catch (error: any) {
      logger.error(`RSS (${sourceName}) fetch error:`, error.message);
      return {
        source_name: sourceName,
        articles: [],
        success: false,
        error: error.message,
      };
    }
  }

  // Fetch all active RSS sources from database
  async fetchAllRSSFeeds(): Promise<SourceFetchResult[]> {
    try {
      const rssSources = await Source.findAll({
        where: {
          source_type: 'rss',
          is_active: true,
        },
      });

      const results: SourceFetchResult[] = [];

      for (const source of rssSources) {
        if (source.url) {
          const result = await this.fetchFeed(source.url, source.name);
          results.push(result);

          // Update source status
          source.last_fetch_at = new Date();
          if (result.success) {
            source.last_success_at = new Date();
            source.status = 'online';
            source.error_count = 0;
          } else {
            source.status = 'error';
            source.error_count += 1;
          }
          await source.save();
        }
      }

      return results;
    } catch (error: any) {
      logger.error('RSS fetch all error:', error.message);
      return [];
    }
  }
}

export default new RSSService();
