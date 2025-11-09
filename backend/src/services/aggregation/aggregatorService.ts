import { Article, Source, Category, Keyword, SystemStatus, ArticleCategory } from '../../models';
import newsApiService from './newsApiService';
import rssService from './rssService';
import redditService from './redditService';
import telegramService from './telegramService';
import osintService from './osintService';
import classificationService from '../processing/classificationService';
import deduplicationService from '../processing/deduplicationService';
import { logger } from '../../utils/logger';
import { RawArticle, SourceFetchResult, AggregationResult } from '../../types';
import { AGGREGATION_CONFIG, DEFAULT_KEYWORDS } from '../../config/constants';
import { Op } from 'sequelize';
import { io } from '../../server';
import { emitNewArticle } from '../../websocket/socketHandler';

class AggregatorService {
  private isRunning: boolean = false;

  // Main aggregation orchestrator
  async runAggregationCycle(): Promise<AggregationResult> {
    if (this.isRunning) {
      logger.warn('Aggregation cycle already running, skipping');
      return {
        articles_collected: 0,
        duplicates_removed: 0,
        processing_time: 0,
        errors: ['Aggregation already running'],
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    let articlesCollected = 0;
    let duplicatesRemoved = 0;
    const errors: string[] = [];

    try {
      // Update system status
      await SystemStatus.update(
        { aggregation_running: true },
        { where: { id: 1 } }
      );

      logger.info('🚀 Starting aggregation cycle');

      // PHASE 1: Fetch from all sources in parallel
      const allKeywords = this.getAllKeywords();

      const fetchResults = await Promise.allSettled([
        newsApiService.fetchArticles(allKeywords, AGGREGATION_CONFIG.BASE_INTERVAL),
        newsApiService.fetchTopHeadlines('my'),
        rssService.fetchAllRSSFeeds(),
        redditService.fetchOSINTSubreddits(),
        osintService.fetchAll(),
      ]);

      // Flatten all results
      const allResults: SourceFetchResult[] = [];
      fetchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const value = result.value;
          if (Array.isArray(value)) {
            allResults.push(...value);
          } else {
            allResults.push(value);
          }
        } else {
          errors.push(result.reason?.message || 'Unknown fetch error');
        }
      });

      // Collect all articles
      const rawArticles: RawArticle[] = [];
      for (const result of allResults) {
        if (result.success) {
          rawArticles.push(...result.articles);

          // Update source status
          await this.updateSourceStatus(result.source_name, true);
        } else {
          errors.push(`${result.source_name}: ${result.error}`);
          await this.updateSourceStatus(result.source_name, false, result.error);
        }
      }

      logger.info(`📥 Collected ${rawArticles.length} raw articles from ${allResults.length} sources`);

      // PHASE 2: Process articles in batches
      const batchSize = AGGREGATION_CONFIG.BATCH_SIZE;
      for (let i = 0; i < rawArticles.length; i += batchSize) {
        const batch = rawArticles.slice(i, i + batchSize);
        const processed = await this.processBatch(batch);

        articlesCollected += processed.success;
        duplicatesRemoved += processed.duplicates;
        if (processed.errors.length > 0) {
          errors.push(...processed.errors);
        }
      }

      // PHASE 3: Cleanup and reporting
      const processingTime = Date.now() - startTime;

      logger.info(`✅ Aggregation cycle complete:
        - Articles collected: ${articlesCollected}
        - Duplicates removed: ${duplicatesRemoved}
        - Processing time: ${processingTime}ms
        - Errors: ${errors.length}`);

      // Update system status
      const systemStatus = await SystemStatus.findByPk(1);
      if (systemStatus) {
        systemStatus.last_refresh_time = new Date();
        systemStatus.articles_collected_today += articlesCollected;
        systemStatus.aggregation_running = false;
        await systemStatus.save();
      }

      return {
        articles_collected: articlesCollected,
        duplicates_removed: duplicatesRemoved,
        processing_time: processingTime,
        errors,
      };
    } catch (error: any) {
      logger.error('Aggregation cycle error:', error);
      errors.push(error.message);

      return {
        articles_collected: articlesCollected,
        duplicates_removed: duplicatesRemoved,
        processing_time: Date.now() - startTime,
        errors,
      };
    } finally {
      this.isRunning = false;

      // Update system status
      await SystemStatus.update(
        { aggregation_running: false },
        { where: { id: 1 } }
      );
    }
  }

  // Process a batch of articles
  private async processBatch(
    articles: RawArticle[]
  ): Promise<{ success: number; duplicates: number; errors: string[] }> {
    let successCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    for (const rawArticle of articles) {
      try {
        // Check for duplicates
        const duplicateCheck = await deduplicationService.isDuplicate(
          rawArticle.title,
          rawArticle.content
        );

        if (duplicateCheck.isDuplicate) {
          duplicateCount++;
          continue;
        }

        // Get or create source
        const source = await this.getOrCreateSource(rawArticle.source_name, rawArticle.source_type);

        // Classify article
        const classification = await classificationService.classifyArticle(
          rawArticle.title,
          rawArticle.content
        );

        // Extract geographic tags
        const geoTags = classificationService.extractGeographicTags(
          rawArticle.title,
          rawArticle.content
        );

        // Calculate relevance score
        const allKeywords = this.getAllKeywords();
        const keywordDensity = classificationService.calculateKeywordDensity(
          `${rawArticle.title} ${rawArticle.content || ''}`,
          allKeywords
        );

        const relevanceScore = classificationService.calculateRelevanceScore(
          classification.match_scores,
          source.credibility_score,
          keywordDensity
        );

        // Determine priority
        const categories = await Category.findAll({
          where: { id: { [Op.in]: classification.category_ids } },
        });

        const priority = classificationService.determinePriority(
          relevanceScore,
          classification.category_ids,
          categories
        );

        // Create article
        const article = await Article.create({
          source_id: source.id,
          title: rawArticle.title,
          content: rawArticle.content,
          summary: rawArticle.content?.substring(0, 500),
          url: rawArticle.url,
          image_url: rawArticle.image_url,
          published_at: rawArticle.published_at,
          content_hash: duplicateCheck.contentHash,
          relevance_score: relevanceScore,
          priority,
          primary_region: geoTags.primary_region,
          secondary_regions: geoTags.secondary_regions,
        });

        // Associate with categories
        for (const categoryId of classification.category_ids) {
          await ArticleCategory.create({
            article_id: article.id,
            category_id: categoryId,
            match_score: classification.match_scores[categoryId] || 0,
          });
        }

        successCount++;
      } catch (error: any) {
        errors.push(`Failed to process article "${rawArticle.title}": ${error.message}`);
        logger.error('Article processing error:', error);
      }
    }

    return { success: successCount, duplicates: duplicateCount, errors };
  }

  // Get or create source
  private async getOrCreateSource(name: string, type: string): Promise<Source> {
    let source = await Source.findOne({ where: { name } });

    if (!source) {
      source = await Source.create({
        name,
        source_type: type as any,
        is_active: true,
        credibility_score: 70,
        status: 'online',
      });
    }

    return source;
  }

  // Update source status
  private async updateSourceStatus(
    sourceName: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const source = await Source.findOne({ where: { name: sourceName } });

      if (source) {
        source.last_fetch_at = new Date();

        if (success) {
          source.last_success_at = new Date();
          source.status = 'online';
          source.error_count = 0;
        } else {
          source.status = 'error';
          source.error_count += 1;

          if (source.error_count > 10) {
            source.status = 'offline';
            logger.warn(`Source ${sourceName} marked as offline after ${source.error_count} errors`);
          }
        }

        await source.save();
      }
    } catch (error) {
      logger.error('Failed to update source status:', error);
    }
  }

  // Get all keywords for fetching
  private getAllKeywords(): string[] {
    const keywords: string[] = [];

    Object.values(DEFAULT_KEYWORDS).forEach((keywordArray) => {
      keywords.push(...keywordArray);
    });

    return keywords;
  }

  // Determine next cycle time based on adaptive logic
  async determineNextCycleTime(articlesCollected: number, processingTime: number): Promise<number> {
    const baseInterval = AGGREGATION_CONFIG.BASE_INTERVAL;

    // Light load: faster refresh
    if (articlesCollected < AGGREGATION_CONFIG.LIGHT_LOAD_THRESHOLD) {
      return AGGREGATION_CONFIG.MIN_INTERVAL;
    }

    // Heavy load: slower refresh
    if (articlesCollected > AGGREGATION_CONFIG.HEAVY_LOAD_THRESHOLD) {
      return AGGREGATION_CONFIG.MAX_INTERVAL;
    }

    // Processing took too long: add buffer
    if (processingTime > AGGREGATION_CONFIG.PROCESSING_TIMEOUT_THRESHOLD) {
      return baseInterval + 15;
    }

    // Normal load: base interval
    return baseInterval;
  }
}

export default new AggregatorService();
