import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedSearchesApi, categoriesApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Search, Plus, Trash2, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '@/stores/filterStore';
import { ISavedSearch } from '@shared';

export default function SavedSearches() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setCategoryId, setKeyword, setPriority, setRegion } = useFilterStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSearch, setNewSearch] = useState({
    name: '',
    description: '',
    filters: {},
  });

  // Fetch saved searches
  const { data: searchesResponse, isLoading } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => savedSearchesApi.getSavedSearches(),
  });

  // Fetch categories for filter options
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => savedSearchesApi.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Saved search deleted');
    },
    onError: () => {
      toast.error('Failed to delete saved search');
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (search: Partial<ISavedSearch>) => savedSearchesApi.createSavedSearch(search),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Saved search created');
      setShowCreateModal(false);
      setNewSearch({ name: '', description: '', filters: {} });
    },
    onError: () => {
      toast.error('Failed to create saved search');
    },
  });

  const handleRunSearch = (search: ISavedSearch) => {
    const filters = search.filters as any;

    // Apply filters to the store
    if (filters.category_id) setCategoryId(filters.category_id);
    if (filters.keyword) setKeyword(filters.keyword);
    if (filters.priority) setPriority(filters.priority);
    if (filters.region) setRegion(filters.region);

    // Navigate to dashboard
    navigate('/dashboard');
    toast.success(`Running search: ${search.name}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this saved search?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    if (!newSearch.name) {
      toast.error('Please enter a name for the saved search');
      return;
    }
    createMutation.mutate(newSearch);
  };

  const searches = searchesResponse?.data || [];

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Searches</h1>
            <p className="text-gray-600 mt-1">
              Quickly access your frequently used search filters
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Search
          </button>
        </div>
      </div>

      {/* Saved Searches List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-600 mx-auto" />
        </div>
      ) : searches.length === 0 ? (
        <div className="card text-center py-20">
          <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first saved search to quickly access common filter combinations
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Saved Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searches.map((search) => (
            <div key={search.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{search.name}</h3>
                  {search.description && (
                    <p className="text-sm text-gray-600 mt-1">{search.description}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Filters:</h4>
                <div className="text-sm text-gray-600">
                  {Object.entries(search.filters as any).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-medium">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <button
                  onClick={() => handleRunSearch(search)}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-1"
                >
                  <Play className="w-4 h-4" />
                  Run Search
                </button>

                <button
                  onClick={() => handleDelete(search.id)}
                  className="btn-danger text-sm p-2"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">Create Saved Search</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Critical Cyber Threats"
                  value={newSearch.name}
                  onChange={(e) => setNewSearch({ ...newSearch, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Brief description of this search"
                  value={newSearch.description}
                  onChange={(e) => setNewSearch({ ...newSearch, description: e.target.value })}
                />
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  Tip: Apply filters on the Dashboard first, then create a saved search to save
                  those filters.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleCreate} className="btn-primary flex-1">
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewSearch({ name: '', description: '', filters: {} });
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
