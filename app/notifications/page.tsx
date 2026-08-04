'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications';
import api from '@/lib/api';
import { Bell, CheckCircle2, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get<{ email: string; full_name: string | null }>('/user/me');
      return response.data;
    },
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(),
    refetchInterval: 30000,
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.patch('/user/me/email', { email });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      alert('Email updated! Revision reminders will be sent here.');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const typeStyles: Record<string, { bg: string; border: string }> = {
    revision_due:   { bg: '#eff6ff', border: '#bfdbfe' },
    revision_email: { bg: '#ecfeff', border: '#a5f3fc' },
    overdue:        { bg: '#fff7ed', border: '#fed7aa' },
    new_questions:  { bg: '#ecfdf5', border: '#a7f3d0' },
    study_reminder: { bg: '#faf5ff', border: '#e9d5ff' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', boxShadow: '0 4px 12px rgba(139,92,246,0.35)' }}
            >
              <Bell className="w-5 h-5 text-white" />
            </div>
            Notifications
          </h2>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Revision reminders, emails, new questions, and study alerts.</p>
        </div>
        {notifications?.some((n) => !n.is_read) && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all mt-2"
            style={{ background: 'var(--primary-lighter)', color: 'var(--primary)', border: '1px solid var(--border)' }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Email Settings */}
      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
      >
        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Mail className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          Email for Revision Reminders
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Current: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.email || 'Not set'}</span>
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="your-email@gmail.com"
            defaultValue={profile?.email}
            onChange={(e) => setEmailInput(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => updateEmailMutation.mutate(emailInput || profile?.email || '')}
            disabled={updateEmailMutation.isPending}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}
          >
            Save
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Configure SMTP in backend `.env` (`SMTP_ENABLED=true`) to receive revision emails with practice questions.
        </p>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {!notifications?.length ? (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            No notifications yet. Upload a note to get started.
          </div>
        ) : (
          notifications.map((n) => {
            const style = typeStyles[n.notification_type] || { bg: 'var(--surface)', border: 'var(--border)' };
            return (
              <div
                key={n.id}
                className="p-5 rounded-2xl border transition-all"
                style={{
                  background: style.bg,
                  borderColor: style.border,
                  opacity: n.is_read ? 0.7 : 1,
                  boxShadow: !n.is_read ? '0 0 0 2px rgba(99,102,241,0.12)' : 'none',
                }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{n.title}</h4>
                      {!n.is_read && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />}
                    </div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</p>
                    {n.related_note_id && (
                      <Link href={`/notes/${n.related_note_id}`} className="inline-block mt-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                        View note →
                      </Link>
                    )}
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      disabled={markReadMutation.isPending}
                      className="p-2 rounded-xl transition-all"
                      style={{ background: '#ecfdf5', color: '#059669' }}
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
