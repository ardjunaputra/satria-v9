import { create } from 'zustand';
import { IArticle } from '@shared';

export interface Notification {
  id: string;
  type: 'new_article' | 'alert' | 'system' | 'aggregation';
  title: string;
  message: string;
  article?: IArticle;
  timestamp: Date;
  read: boolean;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  soundEnabled: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  soundEnabled: true,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
  },
}));
