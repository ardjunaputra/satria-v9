import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi, categoriesApi, ArticleFilters } from '@/lib/api';
import { useFilterStore } from '@/stores/filterStore';
import { IArticle } from '@shared';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import ArticleGrid from '@/components/ArticleGrid';
import ArticleDetail from '@/components/ArticleDetail';
import toast from 'react-hot-toast';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const filters = useFilterStore();
  const [selectedArticle, setSelectedArticle] = useState<IArticle | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Build filter params
  const filterParams: ArticleFilters = {
    category_id: filters.categoryId || undefined,
    source_id: filters.sourceId || undefined,
    priority: filters.priority || undefined,
    keyword: filters.keyword || undefined,
    region: filters.region || undefined,
    time_range: filters.timeRange,
    sort_by: filters.sortBy,
    sort_order: filters.sortOrder,
    page: currentPage,
    limit: 12,
  };

  // Fetch articles
  const {
    data: articlesResponse,
    isLoading: articlesLoading,
    refetch: refetchArticles,
  } = useQuery({
    queryKey: ['articles', filterParams],
    queryFn: () => articlesApi.getArticles(filterParams),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
  });

  // Fetch related articles when article is selected
  const { data: relatedArticles } = useQuery({
    queryKey: ['related', selectedArticle?.id],
    queryFn: () => articlesApi.getRelatedArticles(selectedArticle!.id),
    enabled: !!selectedArticle,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (articleId: string) => articlesApi.markAsRead(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article marked as read');
    },
    onError: () => {
      toast.error('Failed to mark article as read');
    },
  });

  // Flag article mutation
  const flagArticleMutation = useMutation({
    mutationFn: ({ articleId, reason }: { articleId: string; reason: string }) =>
      articlesApi.flagArticle(articleId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article flagged for review');
    },
    onError: () => {
      toast.error('Failed to flag article');
    },
  });

  const handleArticleClick = (article: IArticle) => {
    setSelectedArticle(article);
    setDetailOpen(true);

    // Auto-mark as read
    if (!article.is_read_by?.length) {
      markAsReadMutation.mutate(article.id);
    }
  };

  const handleFlag = (article: IArticle) => {
    const reason = prompt('Enter reason for flagging this article:');
    if (reason) {
      flagArticleMutation.mutate({ articleId: article.id, reason });
    }
  };

  const handleMarkRead = (article: IArticle) => {
    markAsReadMutation.mutate(article.id);
  };

  const handleRelatedClick = (article: IArticle) => {
    setSelectedArticle(article);
    if (!article.is_read_by?.length) {
      markAsReadMutation.mutate(article.id);
    }
  };

  const articles = articlesResponse?.data || [];
  const pagination = articlesResponse?.pagination;
  const categories = categoriesResponse?.data || [];

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Intelligence Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Real-time situational awareness and threat intelligence (24-hour window)
            </p>
          </div>

          <button
            onClick={() => refetchArticles()}
            className="btn-primary flex items-center gap-2"
            disabled={articlesLoading}
          >
            <RefreshCw className={`w-4 h-4 ${articlesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* 24-hour notice */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900">24-Hour Time Window</h3>
            <p className="text-sm text-yellow-800">
              All displayed articles are from the last 24 hours only. Articles older than 24 hours
              are automatically filtered out to ensure you're viewing the most current intelligence.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar categories={categories} />

      {/* Articles Grid */}
      <ArticleGrid
        articles={articles}
        loading={articlesLoading}
        onArticleClick={handleArticleClick}
        onFlag={handleFlag}
        onMarkRead={handleMarkRead}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
          >
            Previous
          </button>

          <span className="text-gray-700">
            Page {currentPage} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage === pagination.totalPages}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* Article Detail Modal */}
      <ArticleDetail
        article={selectedArticle}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onFlag={() => selectedArticle && handleFlag(selectedArticle)}
        onMarkRead={() => selectedArticle && handleMarkRead(selectedArticle)}
        relatedArticles={relatedArticles?.data}
        onRelatedClick={handleRelatedClick}
      />
    </Layout>
  );
}
