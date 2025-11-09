import axios from 'axios';
import { logger } from '../../utils/logger';
import { RawArticle, SourceFetchResult } from '../../types';

class NewsApiService {
  private apiKey: string;
  private baseUrl: string = 'https://newsapi.org/v2';

  constructor() {
    this.apiKey = process.env.NEWSAPI_KEY || '';
  }

  async fetchArticles(keywords: string[], timeWindow: number = 30): Promise<SourceFetchResult> {
    try {
      if (!this.apiKey) {
        logger.warn('NewsAPI key not configured');
        return {
          source_name: 'NewsAPI',
          articles: [],
          success: false,
          error: 'API key not configured',
        };
      }

      const fromDate = new Date(Date.now() - timeWindow * 60 * 1000).toISOString();

      // Build query string with keywords
      const query = keywords.join(' OR ');

      const response = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          q: query,
          from: fromDate,
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: 100,
          apiKey: this.apiKey,
        },
        timeout: 60000, // 60 seconds
      });

      if (response.data.status !== 'ok') {
        throw new Error(`NewsAPI error: ${response.data.message}`);
      }

      const articles: RawArticle[] = response.data.articles.map((article: any) => ({
        title: article.title,
        content: article.content || article.description,
        url: article.url,
        image_url: article.urlToImage,
        published_at: new Date(article.publishedAt),
        source_name: article.source.name,
        source_type: 'news_api',
      }));

      logger.info(`NewsAPI: Fetched ${articles.length} articles`);

      return {
        source_name: 'NewsAPI',
        articles,
        success: true,
      };
    } catch (error: any) {
      logger.error('NewsAPI fetch error:', error.message);
      return {
        source_name: 'NewsAPI',
        articles: [],
        success: false,
        error: error.message,
      };
    }
  }

  // Fetch top headlines for specific country (Malaysia focus)
  async fetchTopHeadlines(country: string = 'my'): Promise<SourceFetchResult> {
    try {
      if (!this.apiKey) {
        return {
          source_name: 'NewsAPI Headlines',
          articles: [],
          success: false,
          error: 'API key not configured',
        };
      }

      const response = await axios.get(`${this.baseUrl}/top-headlines`, {
        params: {
          country,
          pageSize: 100,
          apiKey: this.apiKey,
        },
        timeout: 60000,
      });

      const articles: RawArticle[] = response.data.articles.map((article: any) => ({
        title: article.title,
        content: article.content || article.description,
        url: article.url,
        image_url: article.urlToImage,
        published_at: new Date(article.publishedAt),
        source_name: article.source.name,
        source_type: 'news_api',
      }));

      logger.info(`NewsAPI Headlines: Fetched ${articles.length} articles`);

      return {
        source_name: 'NewsAPI Headlines',
        articles,
        success: true,
      };
    } catch (error: any) {
      logger.error('NewsAPI headlines fetch error:', error.message);
      return {
        source_name: 'NewsAPI Headlines',
        articles: [],
        success: false,
        error: error.message,
      };
    }
  }
}

export default new NewsApiService();
