import stringSimilarity from 'string-similarity';
import { Article } from '../../models';
import { hashSHA256 } from '../../utils/encryption';
import { RELEVANCE_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';

class DeduplicationService {
  // Generate content hash for deduplication
  generateContentHash(title: string, content?: string): string {
    const textToHash = `${title} ${(content || '').substring(0, 200)}`;
    return hashSHA256(textToHash);
  }

  // Check if article is duplicate by exact hash match
  async checkExactDuplicate(contentHash: string): Promise<string | null> {
    try {
      const existing = await Article.findOne({
        where: { content_hash: contentHash },
        attributes: ['id'],
      });

      return existing ? existing.id : null;
    } catch (error) {
      logger.error('Exact duplicate check error:', error);
      return null;
    }
  }

  // Check if article is similar to existing articles (fuzzy matching)
  async checkSimilarArticles(title: string, content?: string): Promise<string | null> {
    try {
      // Get recent articles from last 24 hours for comparison
      const recentArticles = await Article.findAll({
        where: {
          published_at: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        attributes: ['id', 'title', 'content'],
        limit: 100,
        order: [['published_at', 'DESC']],
      });

      const newText = `${title} ${(content || '').substring(0, 500)}`;

      for (const existing of recentArticles) {
        const existingText = `${existing.title} ${(existing.content || '').substring(0, 500)}`;

        // Calculate similarity
        const similarity = stringSimilarity.compareTwoStrings(
          newText.toLowerCase(),
          existingText.toLowerCase()
        );

        // If similarity exceeds threshold, mark as duplicate
        if (similarity >= RELEVANCE_CONFIG.DUPLICATE_SIMILARITY_THRESHOLD) {
          logger.info(`Similar article found: ${similarity.toFixed(2)} similarity with ${existing.id}`);
          return existing.id;
        }
      }

      return null;
    } catch (error) {
      logger.error('Similar article check error:', error);
      return null;
    }
  }

  // Check if article is duplicate (both exact and fuzzy)
  async isDuplicate(
    title: string,
    content?: string
  ): Promise<{ isDuplicate: boolean; originalId?: string; contentHash: string }> {
    const contentHash = this.generateContentHash(title, content);

    // First check exact duplicate
    const exactMatch = await this.checkExactDuplicate(contentHash);
    if (exactMatch) {
      return {
        isDuplicate: true,
        originalId: exactMatch,
        contentHash,
      };
    }

    // Then check similar articles
    const similarMatch = await this.checkSimilarArticles(title, content);
    if (similarMatch) {
      return {
        isDuplicate: true,
        originalId: similarMatch,
        contentHash,
      };
    }

    return {
      isDuplicate: false,
      contentHash,
    };
  }

  // Remove duplicates from a batch of articles
  async filterDuplicates(
    articles: Array<{ title: string; content?: string }>
  ): Promise<Array<{ title: string; content?: string; isDuplicate: boolean; originalId?: string }>> {
    const results = [];

    for (const article of articles) {
      const duplicateCheck = await this.isDuplicate(article.title, article.content);

      results.push({
        ...article,
        isDuplicate: duplicateCheck.isDuplicate,
        originalId: duplicateCheck.originalId,
      });
    }

    return results;
  }
}

export default new DeduplicationService();
