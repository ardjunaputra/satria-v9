import { IArticle } from '@shared';
import { formatRelativeTime, getPriorityBadgeClass, truncateText } from '@/lib/utils';
import { ExternalLink, Flag, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ArticleCardProps {
  article: IArticle;
  onClick: () => void;
  onFlag?: () => void;
  onMarkRead?: () => void;
}

export default function ArticleCard({ article, onClick, onFlag, onMarkRead }: ArticleCardProps) {
  const isRead = article.is_read_by?.length > 0;
  const isFlagged = article.flagged_by?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card relative cursor-pointer hover:shadow-lg transition-all ${
        isRead ? 'opacity-75' : ''
      }`}
      onClick={onClick}
    >
      {/* Priority indicator */}
      <div className={`priority-indicator priority-${article.priority}`} />

      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`text-lg font-semibold line-clamp-2 ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>
              {article.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>{article.source?.name}</span>
              <span>•</span>
              <span>{formatRelativeTime(article.published_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <span className={getPriorityBadgeClass(article.priority)}>
              {article.priority.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Summary */}
        {article.summary && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-3">
            {truncateText(article.summary, 200)}
          </p>
        )}

        {/* Categories */}
        {article.categories && article.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {article.categories.slice(0, 3).map((category: any) => (
              <span
                key={category.id}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800"
              >
                {category.name}
              </span>
            ))}
            {article.categories.length > 3 && (
              <span className="text-xs text-gray-500">+{article.categories.length - 3} more</span>
            )}
          </div>
        )}

        {/* Image */}
        {article.image_url && (
          <div className="mb-3">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-48 object-cover rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="font-medium">Relevance:</span>
              <span>{article.relevance_score}%</span>
            </div>
            {article.primary_region && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Region:</span>
                <span>{article.primary_region}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isRead && onMarkRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Mark as read"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {onFlag && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFlag();
                }}
                className={`p-2 hover:bg-gray-100 rounded-md transition-colors ${
                  isFlagged ? 'text-danger-600' : ''
                }`}
                title="Flag article"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Open source"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
