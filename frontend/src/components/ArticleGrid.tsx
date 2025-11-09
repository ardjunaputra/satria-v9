import { IArticle } from '@shared';
import ArticleCard from './ArticleCard';
import { Loader2 } from 'lucide-react';

interface ArticleGridProps {
  articles: IArticle[];
  loading: boolean;
  onArticleClick: (article: IArticle) => void;
  onFlag: (article: IArticle) => void;
  onMarkRead: (article: IArticle) => void;
}

export default function ArticleGrid({
  articles,
  loading,
  onArticleClick,
  onFlag,
  onMarkRead,
}: ArticleGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-army-600" />
        <span className="ml-3 text-gray-600">Loading articles...</span>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
        <p className="text-gray-600">
          Try adjusting your filters or wait for new articles to be collected.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onClick={() => onArticleClick(article)}
          onFlag={() => onFlag(article)}
          onMarkRead={() => onMarkRead(article)}
        />
      ))}
    </div>
  );
}
