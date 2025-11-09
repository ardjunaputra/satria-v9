import { useFilterStore } from '@/stores/filterStore';
import { ICategory, ArticlePriority } from '@shared';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface FilterBarProps {
  categories: ICategory[];
  sources?: any[];
}

export default function FilterBar({ categories, sources = [] }: FilterBarProps) {
  const {
    categoryId,
    sourceId,
    priority,
    keyword,
    region,
    timeRange,
    sortBy,
    sortOrder,
    setCategoryId,
    setSourceId,
    setPriority,
    setKeyword,
    setRegion,
    setTimeRange,
    setSortBy,
    setSortOrder,
    resetFilters,
  } = useFilterStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const priorities: ArticlePriority[] = ['critical', 'high', 'medium', 'low'];

  const regions = [
    'Malaysia',
    'Southeast Asia',
    'East Asia',
    'Middle East',
    'South Asia',
    'Europe',
    'Americas',
    'Africa',
    'Oceania',
  ];

  const hasActiveFilters =
    categoryId || sourceId || priority || keyword || region || timeRange !== 24;

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-secondary text-sm"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles by keyword..."
            className="input pl-10 pr-10"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="input"
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            className="input"
            value={priority || ''}
            onChange={(e) => setPriority((e.target.value as ArticlePriority) || null)}
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Range (Max 24h)
          </label>
          <select
            className="input"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={12}>Last 12 hours</option>
            <option value={24}>Last 24 hours</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Source */}
            {sources.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  className="input"
                  value={sourceId || ''}
                  onChange={(e) => setSourceId(e.target.value || null)}
                >
                  <option value="">All Sources</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select
                className="input"
                value={region || ''}
                onChange={(e) => setRegion(e.target.value || null)}
              >
                <option value="">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                className="input"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
