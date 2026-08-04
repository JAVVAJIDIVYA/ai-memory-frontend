'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export function NotificationBell() {
  const { data: count = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsService.getUnreadCount,
    refetchInterval: 30000,
  });

  return (
    <Link
      href="/notifications"
      className="relative p-2.5 rounded-xl transition-all duration-200"
      title="Notifications"
      style={{
        background: 'var(--surface-secondary)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'var(--primary-lighter)';
        el.style.borderColor = 'var(--primary-light)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'var(--surface-secondary)';
        el.style.borderColor = 'var(--border)';
      }}
    >
      <Bell className="w-5 h-5" style={{ color: 'var(--primary)' }} />
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] flex items-center justify-center text-white text-[10px] font-bold rounded-full px-1"
          style={{
            background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
            boxShadow: '0 2px 8px rgba(244, 63, 94, 0.4)',
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
