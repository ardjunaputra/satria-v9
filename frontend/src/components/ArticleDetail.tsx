import { IArticle } from '@shared';
import { formatDate, formatRelativeTime, getPriorityBadgeClass } from '@/lib/utils';
import { X, ExternalLink, Flag, Eye, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArticleDetailProps {
  article: IArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onFlag?: () => void;
  onMarkRead?: () => void;
  relatedArticles?: IArticle[];
  onRelatedClick?: (article: IArticle) => void;
}

export default function ArticleDetail({
  article,
  isOpen,
  onClose,
  onFlag,
  onMarkRead,
  relatedArticles,
  onRelatedClick,
}: ArticleDetailProps) {
  if (!article) return null;

  const isRead = article.is_read_by?.length > 0;
  const isFlagged = article.flagged_by?.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween' }}
            className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between p-6">
                <h2 className="text-xl font-semibold">Article Details</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Priority and Actions */}
              <div className="flex items-center justify-between mb-4">
                <span className={getPriorityBadgeClass(article.priority)}>
                  {article.priority.toUpperCase()} PRIORITY
                </span>

                <div className="flex items-center gap-2">
                  {!isRead && onMarkRead && (
                    <button
                      onClick={onMarkRead}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Mark as Read
                    </button>
                  )}

                  {onFlag && (
                    <button
                      onClick={onFlag}
                      className={`btn-secondary text-sm flex items-center gap-1 ${
                        isFlagged ? 'text-danger-600 border-danger-600' : ''
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      {isFlagged ? 'Flagged' : 'Flag'}
                    </button>
                  )}

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Source
                  </a>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(article.published_at)}</span>
                  <span className="text-gray-400">({formatRelativeTime(article.published_at)})</span>
                </div>

                {article.primary_region && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{article.primary_region}</span>
                  </div>
                )}

                <div>
                  <span className="font-medium">Source:</span> {article.source?.name}
                </div>

                <div>
                  <span className="font-medium">Relevance:</span> {article.relevance_score}%
                </div>
              </div>

              {/* Image */}
              {article.image_url && (
                <div className="mb-6">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-auto rounded-lg shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Categories */}
              {article.categories && article.categories.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.categories.map((category: any) => (
                      <span
                        key={category.id}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="prose max-w-none mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Content</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {article.content || article.summary || 'No content available.'}
                </div>
              </div>

              {/* Regions */}
              {article.secondary_regions && article.secondary_regions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Related Regions</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.secondary_regions.map((region, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Articles */}
              {relatedArticles && relatedArticles.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
                  <div className="space-y-3">
                    {relatedArticles.map((related) => (
                      <div
                        key={related.id}
                        onClick={() => onRelatedClick?.(related)}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <h4 className="font-medium text-gray-900 mb-1">{related.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{related.source?.name}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(related.published_at)}</span>
                          <span>•</span>
                          <span className={getPriorityBadgeClass(related.priority)}>
                            {related.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
