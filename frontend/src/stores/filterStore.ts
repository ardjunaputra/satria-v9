import { create } from 'zustand';
import { ArticlePriority } from '@shared';

export interface FilterState {
  categoryId: string | null;
  sourceId: string | null;
  priority: ArticlePriority | null;
  keyword: string;
  region: string | null;
  timeRange: number;
  sortBy: 'relevance' | 'date' | 'priority';
  sortOrder: 'asc' | 'desc';
  setCategoryId: (id: string | null) => void;
  setSourceId: (id: string | null) => void;
  setPriority: (priority: ArticlePriority | null) => void;
  setKeyword: (keyword: string) => void;
  setRegion: (region: string | null) => void;
  setTimeRange: (range: number) => void;
  setSortBy: (sortBy: 'relevance' | 'date' | 'priority') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

const initialState = {
  categoryId: null,
  sourceId: null,
  priority: null,
  keyword: '',
  region: null,
  timeRange: 24, // 24 hours (maximum allowed)
  sortBy: 'relevance' as const,
  sortOrder: 'desc' as const,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setCategoryId: (id) => set({ categoryId: id }),
  setSourceId: (id) => set({ sourceId: id }),
  setPriority: (priority) => set({ priority }),
  setKeyword: (keyword) => set({ keyword }),
  setRegion: (region) => set({ region }),
  setTimeRange: (range) => {
    // Enforce 24-hour maximum constraint
    const validRange = Math.min(range, 24);
    set({ timeRange: validRange });
  },
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (order) => set({ sortOrder: order }),
  resetFilters: () => set(initialState),
}));
