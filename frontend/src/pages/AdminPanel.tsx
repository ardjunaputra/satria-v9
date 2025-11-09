import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Layout from '@/components/Layout';
import {
  Users,
  Server,
  Activity,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Database,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { IUser, UserRole } from '@shared';
import { getRoleDisplayName, formatDate } from '@/lib/utils';

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'sources'>('system');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'viewer' as UserRole,
    password: '',
  });

  // Fetch system status
  const { data: systemStatus, isLoading: systemLoading, refetch: refetchSystem } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => adminApi.getSystemStatus(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => adminApi.getUsers(),
    enabled: activeTab === 'users',
  });

  // Fetch sources
  const { data: sourcesResponse, isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: () => adminApi.getSources(),
    enabled: activeTab === 'sources',
  });

  // Trigger aggregation mutation
  const triggerAggregationMutation = useMutation({
    mutationFn: () => adminApi.triggerAggregation(),
    onSuccess: () => {
      toast.success('Aggregation triggered successfully');
      refetchSystem();
    },
    onError: () => {
      toast.error('Failed to trigger aggregation');
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (user: Partial<IUser>) => adminApi.createUser(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setShowUserModal(false);
      setNewUser({ email: '', full_name: '', role: 'viewer', password: '' });
    },
    onError: () => {
      toast.error('Failed to create user');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.full_name || !newUser.password) {
      toast.error('Please fill all required fields');
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const users = usersResponse?.data || [];
  const sources = sourcesResponse?.data || [];
  const system = systemStatus?.data;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">System management and configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'system'
              ? 'text-army-600 border-b-2 border-army-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Server className="w-4 h-4 inline mr-2" />
          System Status
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-army-600 border-b-2 border-army-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Users
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'sources'
              ? 'text-army-600 border-b-2 border-army-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Database className="w-4 h-4 inline mr-2" />
          Sources
        </button>
      </div>

      {/* System Status Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {systemLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-600 mx-auto" />
            </div>
          ) : (
            <>
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700">Aggregation Status</h3>
                    <Activity className="w-5 h-5 text-army-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {system?.aggregation_running ? 'Running' : 'Idle'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {system?.last_refresh_time
                      ? `Last: ${formatDate(system.last_refresh_time)}`
                      : 'Never run'}
                  </p>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700">Articles Today</h3>
                    <Database className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {system?.articles_collected_today || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Collected in last 24 hours</p>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700">Next Refresh</h3>
                    <RefreshCw className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {system?.next_refresh_time
                      ? formatDate(system.next_refresh_time)
                      : 'Not scheduled'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Adaptive timing</p>
                </div>
              </div>

              {/* Actions */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">System Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => triggerAggregationMutation.mutate()}
                    disabled={system?.aggregation_running}
                    className="btn-primary flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Trigger Manual Aggregation
                  </button>

                  <button
                    onClick={() => refetchSystem()}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Refresh Status
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">User Management</h2>
            <button
              onClick={() => setShowUserModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {usersLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-600 mx-auto" />
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">MFA</th>
                    <th className="text-left py-3 px-4">Last Login</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{user.full_name}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="badge">{getRoleDisplayName(user.role)}</span>
                      </td>
                      <td className="py-3 px-4">
                        {user.mfa_enabled ? (
                          <span className="text-green-600">✓ Enabled</span>
                        ) : (
                          <span className="text-gray-400">Disabled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-gray-100 rounded-md"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-gray-100 rounded-md text-danger-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === 'sources' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Data Sources</h2>

          {sourcesLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-600 mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sources.map((source: any) => (
                <div key={source.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{source.name}</h3>
                      <p className="text-sm text-gray-600">{source.source_type}</p>
                    </div>
                    <span
                      className={`badge ${
                        source.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credibility:</span>
                      <span className="font-medium">{source.credibility_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Fetch:</span>
                      <span className="font-medium">
                        {source.last_fetch_at ? formatDate(source.last_fetch_at) : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Errors:</span>
                      <span className="font-medium">{source.error_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">Add New User</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="input"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  className="input"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="senior_analyst">Senior Analyst</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  className="input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleCreateUser} className="btn-primary flex-1">
                Create User
              </button>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setNewUser({ email: '', full_name: '', role: 'viewer', password: '' });
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
