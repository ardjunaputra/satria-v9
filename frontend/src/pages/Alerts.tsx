import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi, categoriesApi } from '@/lib/api';
import { useNotificationStore } from '@/stores/notificationStore';
import Layout from '@/components/Layout';
import { Bell, Plus, Trash2, Edit, TestTube, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { IAlert, ArticlePriority } from '@shared';
import { formatRelativeTime } from '@/lib/utils';

export default function Alerts() {
  const queryClient = useQueryClient();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<IAlert | null>(null);
  const [newAlert, setNewAlert] = useState({
    name: '',
    criteria: {},
    enabled: true,
    notification_channels: ['web'],
  });

  // Fetch alerts
  const { data: alertsResponse, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.getAlerts(),
  });

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert deleted');
    },
    onError: () => {
      toast.error('Failed to delete alert');
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (alert: Partial<IAlert>) => alertsApi.createAlert(alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert created');
      setShowCreateModal(false);
      setNewAlert({ name: '', criteria: {}, enabled: true, notification_channels: ['web'] });
    },
    onError: () => {
      toast.error('Failed to create alert');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, alert }: { id: string; alert: Partial<IAlert> }) =>
      alertsApi.updateAlert(id, alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert updated');
      setEditingAlert(null);
    },
    onError: () => {
      toast.error('Failed to update alert');
    },
  });

  // Test alert mutation
  const testMutation = useMutation({
    mutationFn: (id: string) => alertsApi.testAlert(id),
    onSuccess: () => {
      toast.success('Test notification sent');
    },
    onError: () => {
      toast.error('Failed to test alert');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    if (!newAlert.name) {
      toast.error('Please enter a name for the alert');
      return;
    }
    createMutation.mutate(newAlert);
  };

  const handleToggleEnabled = (alert: IAlert) => {
    updateMutation.mutate({
      id: alert.id,
      alert: { enabled: !alert.enabled },
    });
  };

  const alerts = alertsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Configuration */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Alert Rules</h1>
                <p className="text-gray-600 mt-1">
                  Configure notifications for critical intelligence
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Alert
              </button>
            </div>
          </div>

          {/* Alerts List */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-600 mx-auto" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="card text-center py-20">
              <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alert rules yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first alert to get notified about critical intelligence
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Alert
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.name}</h3>
                        {alert.enabled ? (
                          <span className="badge bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Enabled
                          </span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-800">
                            <X className="w-3 h-3 mr-1" />
                            Disabled
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <strong>Criteria:</strong>{' '}
                        {JSON.stringify(alert.criteria, null, 2)
                          .replace(/[{}"]/g, '')
                          .replace(/,/g, ', ')}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Channels: {alert.notification_channels?.join(', ')}</span>
                        {alert.last_triggered_at && (
                          <span>
                            Last triggered: {formatRelativeTime(alert.last_triggered_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(alert)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title={alert.enabled ? 'Disable' : 'Enable'}
                      >
                        {alert.enabled ? (
                          <X className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </button>

                      <button
                        onClick={() => testMutation.mutate(alert.id)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title="Test alert"
                      >
                        <TestTube className="w-5 h-5 text-gray-600" />
                      </button>

                      <button
                        onClick={() => setEditingAlert(alert)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5 text-gray-600" />
                      </button>

                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-danger-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Panel */}
        <div>
          <div className="sticky top-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Notifications</h2>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {notifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-primary-200'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {notification.priority && (
                          <span
                            className={`badge badge-${notification.priority} text-xs`}
                          >
                            {notification.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="btn-secondary w-full mt-4 text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAlert) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">
              {editingAlert ? 'Edit Alert' : 'Create Alert'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Critical Cyber Threat Alert"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                />
              </div>

              <div className="text-sm text-gray-600">
                <p>Configure alert criteria and notification channels based on your needs.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleCreate} className="btn-primary flex-1">
                {editingAlert ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAlert(null);
                  setNewAlert({ name: '', criteria: {}, enabled: true, notification_channels: ['web'] });
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
