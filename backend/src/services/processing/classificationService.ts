import { Category, Keyword } from '../../models';
import { ClassificationResult, GeographicTag } from '../../types';
import { logger } from '../../utils/logger';
import { GEOGRAPHIC_REGIONS } from '../../config/constants';

class ClassificationService {
  // Classify article into categories based on keyword matching
  async classifyArticle(title: string, content?: string): Promise<ClassificationResult> {
    try {
      const text = `${title} ${content || ''}`.toLowerCase();

      // Get all active categories with their keywords
      const categories = await Category.findAll({
        where: { is_active: true },
        include: [
          {
            model: Keyword,
            as: 'keywords',
            where: { is_active: true },
            required: false,
          },
        ],
      });

      const categoryScores: { [category_id: string]: number } = {};
      const matchedCategories: string[] = [];

      // Calculate match score for each category
      for (const category of categories) {
        let matchCount = 0;
        const keywords = category.keywords || [];

        for (const keyword of keywords) {
          const keywordLower = keyword.keyword.toLowerCase();

          // Count occurrences of this keyword in the text
          const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
          const matches = text.match(regex);

          if (matches) {
            matchCount += matches.length;
          }
        }

        // Calculate score (0-100) based on keyword matches
        const score = Math.min(Math.round((matchCount / Math.max(keywords.length, 1)) * 100), 100);

        categoryScores[category.id] = score;

        // Include categories with score > 50
        if (score > 50) {
          matchedCategories.push(category.id);
        }
      }

      // Ensure at least one category (highest scoring)
      if (matchedCategories.length === 0 && Object.keys(categoryScores).length > 0) {
        const highestScore = Math.max(...Object.values(categoryScores));
        const highestCategory = Object.keys(categoryScores).find(
          (id) => categoryScores[id] === highestScore
        );
        if (highestCategory) {
          matchedCategories.push(highestCategory);
        }
      }

      return {
        category_ids: matchedCategories,
        match_scores: categoryScores,
      };
    } catch (error) {
      logger.error('Classification error:', error);
      return {
        category_ids: [],
        match_scores: {},
      };
    }
  }

  // Extract geographic tags from article content
  extractGeographicTags(title: string, content?: string): GeographicTag {
    const text = `${title} ${content || ''}`;
    const mentionedRegions: { region: string; count: number }[] = [];

    for (const region of GEOGRAPHIC_REGIONS) {
      const regex = new RegExp(`\\b${region}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        mentionedRegions.push({
          region,
          count: matches.length,
        });
      }
    }

    // Sort by mention count
    mentionedRegions.sort((a, b) => b.count - a.count);

    return {
      primary_region: mentionedRegions[0]?.region || undefined,
      secondary_regions: mentionedRegions.slice(1, 4).map((r) => r.region),
    };
  }

  // Calculate relevance score based on various factors
  calculateRelevanceScore(
    matchScores: { [key: string]: number },
    credibilityScore: number,
    keywordDensity: number
  ): number {
    // Average category match score
    const scores = Object.values(matchScores);
    const avgCategoryScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Weighted combination
    const relevance =
      avgCategoryScore * 0.5 + // 50% from category matching
      credibilityScore * 0.3 + // 30% from source credibility
      Math.min(keywordDensity * 10, 100) * 0.2; // 20% from keyword density

    return Math.round(Math.min(relevance, 100));
  }

  // Determine priority based on relevance score and categories
  determinePriority(
    relevanceScore: number,
    categoryIds: string[],
    categories: Category[]
  ): 'critical' | 'high' | 'medium' | 'low' {
    // Critical priority categories (terrorism, cyber security)
    const criticalCategorySlugs = ['terrorism', 'cyber-security', 'weapons-proliferation'];
    const hasCriticalCategory = categories.some(
      (cat) => categoryIds.includes(cat.id) && criticalCategorySlugs.includes(cat.slug)
    );

    if (hasCriticalCategory && relevanceScore >= 90) {
      return 'critical';
    } else if (relevanceScore >= 70) {
      return 'high';
    } else if (relevanceScore >= 50) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Calculate keyword density (keywords per 1000 words)
  calculateKeywordDensity(text: string, keywords: string[]): number {
    const words = text.toLowerCase().split(/\s+/).length;
    let keywordCount = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        keywordCount += matches.length;
      }
    }

    return words > 0 ? (keywordCount / words) * 1000 : 0;
  }
}

export default new ClassificationService();
