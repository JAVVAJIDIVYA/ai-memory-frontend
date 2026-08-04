import api from '@/lib/api';
import { Notification } from '@/types/note';

export const notificationsService = {
  getNotifications: async (unreadOnly = false): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications', {
      params: unreadOnly ? { unread_only: true } : {},
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
};
