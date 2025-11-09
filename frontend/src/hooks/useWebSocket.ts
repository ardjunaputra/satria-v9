import { useEffect } from 'react';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { IArticle } from '@shared';
import { playNotificationSound } from '@/lib/utils';
import toast from 'react-hot-toast';

export const useWebSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const { addNotification, soundEnabled } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketService.disconnect();
      return;
    }

    // Connect to WebSocket
    socketService.connect(token);

    // Handle new articles
    const handleNewArticle = (article: IArticle) => {
      addNotification({
        type: 'new_article',
        title: 'New Article',
        message: article.title,
        article,
        priority: article.priority,
      });

      // Play sound for critical/high priority articles
      if (soundEnabled && (article.priority === 'critical' || article.priority === 'high')) {
        playNotificationSound();
      }

      // Show toast for critical articles
      if (article.priority === 'critical') {
        toast.error(`CRITICAL: ${article.title}`, {
          duration: 10000,
          position: 'top-right',
        });
      }
    };

    // Handle alerts
    const handleAlertTriggered = (data: any) => {
      addNotification({
        type: 'alert',
        title: 'Alert Triggered',
        message: data.alert_name || 'An alert condition was met',
        priority: 'high',
      });

      if (soundEnabled) {
        playNotificationSound();
      }

      toast.success(`Alert: ${data.alert_name}`, {
        duration: 5000,
        position: 'top-right',
      });
    };

    // Handle aggregation status
    const handleAggregationStatus = (data: any) => {
      if (data.status === 'completed') {
        addNotification({
          type: 'aggregation',
          title: 'Aggregation Complete',
          message: `Collected ${data.articles_collected} new articles`,
          priority: 'low',
        });
      }
    };

    // Handle system notifications
    const handleSystemNotification = (data: any) => {
      addNotification({
        type: 'system',
        title: data.title || 'System Notification',
        message: data.message,
        priority: data.priority || 'medium',
      });

      if (data.priority === 'critical' && soundEnabled) {
        playNotificationSound();
      }
    };

    // Register event handlers
    socketService.on('new-article', handleNewArticle);
    socketService.on('alert-triggered', handleAlertTriggered);
    socketService.on('aggregation-status', handleAggregationStatus);
    socketService.on('system-notification', handleSystemNotification);

    // Cleanup
    return () => {
      socketService.off('new-article', handleNewArticle);
      socketService.off('alert-triggered', handleAlertTriggered);
      socketService.off('aggregation-status', handleAggregationStatus);
      socketService.off('system-notification', handleSystemNotification);
    };
  }, [isAuthenticated, token, addNotification, soundEnabled]);

  return {
    isConnected: socketService.isConnected(),
  };
};
