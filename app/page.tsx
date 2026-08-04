'use client';

import { useQuery } from '@tanstack/react-query';
import { notesService } from '@/services/notes';
import { notificationsService } from '@/services/notifications';
import { FileText, Clock, Bell, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { REVISION_DAYS } from '@/lib/constants';
import { Note, Reminder } from '@/types/note';
import UploadStatsChart from '@/components/UploadStatsChart';

export default function DashboardPage() {
  const { data: notes = [], isLoading: notesLoading, isError } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => notesService.getNotes(),
    retry: false,
  });

  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => {
      const response = await api.get<Reminder[]>('/reminders');
      return response.data;
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsService.getUnreadCount,
    refetchInterval: 30000,
  });

  const dueReminders = reminders.filter(
    (r) => new Date(r.next_review_at) <= new Date() && r.status !== 'completed'
  );

  const filteredNotes = notes.filter(note => note.content_type !== 'text');
  const statCards = [
    {
      label: 'Total Notes',
      value: filteredNotes?.length ?? 0,
      icon: FileText,
      gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      shadow: 'rgba(99,102,241,0.25)',
      bg: '#eef1ff',
      iconColor: '#6366f1',
    },
    {
      label: 'Due for Review',
      value: dueReminders.length,
      icon: Clock,
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      shadow: 'rgba(245,158,11,0.25)',
      bg: '#fffbeb',
      iconColor: '#d97706',
    },
    {
      label: 'Unread Notifications',
      value: unreadCount,
      icon: Bell,
      gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      shadow: 'rgba(139,92,246,0.25)',
      bg: '#f3f0ff',
      iconColor: '#7c3aed',
    },
    {
      label: 'AI Processed',
      value: filteredNotes.filter((n) => n.ai_processed).length,
      icon: HelpCircle,
      gradient: 'linear-gradient(135deg, #10b981, #34d399)',
      shadow: 'rgba(16,185,129,0.25)',
      bg: '#ecfdf5',
      iconColor: '#059669',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
        }}
      >
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white">Welcome back! 👋</h2>
          <p className="text-indigo-100 mt-2 text-base">
            Your study materials, summaries, and revision schedule — all in one place.
          </p>
        </div>
        {/* Decorative circles */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        />
        <div
          className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.5)' }}
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: stat.bg,
              borderColor: 'var(--border-light)',
              boxShadow: `0 4px 16px ${stat.shadow}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: stat.gradient,
                  boxShadow: `0 4px 12px ${stat.shadow}`,
                }}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
              </span>
            </div>
            <p className="text-sm font-semibold" style={{ color: stat.iconColor }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notes + Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Notes */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              className="px-6 py-4 border-b flex justify-between items-center"
              style={{ borderColor: 'var(--border-light)', background: 'var(--surface-secondary)' }}
            >
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                📄 Recent Notes
              </h3>
              <Link
                href="/notes"
                className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
                style={{
                  color: 'var(--primary)',
                  background: 'var(--primary-lighter)',
                }}
              >
                View All →
              </Link>
            </div>

            <div>
              {notesLoading ? (
                <div className="p-8 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
                  Loading your notes...
                </div>
              ) : isError ? (
                <div className="p-8 text-center text-sm italic" style={{ color: '#ef4444' }}>
                  Backend not connected. Start the FastAPI server on port 8000.
                </div>
              ) : notes.length === 0 ? (
                <div className="p-8 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
                  No notes yet.{' '}
                  <Link href="/upload" style={{ color: 'var(--primary)' }} className="font-semibold">
                    Upload material
                  </Link>{' '}
                  to get started.
                </div>
              ) : (
                <div>
                  {notes.filter(note => note.content_type !== 'text').slice(0, 5).map((note, idx) => (
                    <div
                      key={note.id}
                      className="px-6 py-4 flex items-center justify-between group transition-all duration-150 border-b"
                      style={{
                        borderColor: 'var(--border-light)',
                        borderBottom: idx === 4 ? 'none' : undefined,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'var(--primary-lighter)',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.12)',
                          }}
                        >
                          <FileText className="w-4.5 h-4.5" style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {note.title}
                          </h4>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {note.subject && `${note.subject}`}
                            {note.topic && ` › ${note.topic}`}
                            {note.subject && ' • '}
                            {new Date(note.created_at).toLocaleDateString()}
                            {!note.ai_processed && note.processing_status !== 'complete' && note.processing_status !== 'failed' && (
                              <span className="ml-2 font-medium" style={{ color: '#d97706' }}>Processing...</span>
                            )}
                            {note.processing_status === 'failed' && (
                              <span className="ml-2 font-medium" style={{ color: '#ef4444' }}>Failed</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/notes/${note.id}`}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200"
                        style={{
                          background: 'var(--primary)',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                        }}
                      >
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <UploadStatsChart />
        </div>

        {/* Due for Review */}
        <div
          className="rounded-2xl border overflow-hidden flex flex-col"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'var(--border-light)', background: 'var(--surface-secondary)' }}
          >
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock className="w-4.5 h-4.5" style={{ color: '#d97706' }} />
              Due for Review
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Schedule: Day {REVISION_DAYS.join(', ')}
            </p>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px]">
            {dueReminders.length === 0 ? (
              <div className="text-center py-10 text-sm italic" style={{ color: 'var(--text-muted)' }}>
                ✅ No revisions due right now.
              </div>
            ) : (
              dueReminders.map((reminder) => {
                const note = notes.find((n) => n.id === reminder.note_id);
                const isOverdue = new Date(reminder.next_review_at) < new Date();
                const dayLabel = REVISION_DAYS[reminder.revision_day] ?? reminder.interval;
                const answered = !!reminder.answer_submitted_at;
                const revisionNum = reminder.revision_day + 1;
                const totalRevisions = REVISION_DAYS.length;

                return (
                  <div
                    key={reminder.id}
                    className="p-4 rounded-xl border space-y-3 transition-all duration-150"
                    style={{
                      background: answered ? '#f0fdf4' : isOverdue ? '#fff7ed' : 'var(--surface-secondary)',
                      borderColor: answered ? '#86efac' : isOverdue ? '#fed7aa' : 'var(--border-light)',
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                        {note?.title || 'Unknown Note'}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {answered && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase text-white"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                          >
                            ✓ Answered
                          </span>
                        )}
                        {isOverdue && !answered && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 text-white"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                          >
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      Day {dayLabel} revision &nbsp;·&nbsp; {revisionNum}/{totalRevisions}
                    </div>
                    {answered && reminder.user_answer && (
                      <div
                        className="text-xs rounded-lg px-3 py-2"
                        style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                      >
                        <span className="font-semibold">Your answer: </span>
                        <em>"{reminder.user_answer}"</em>
                      </div>
                    )}
                    {!answered && (
                      <Link
                        href={`/notes/${reminder.note_id}`}
                        className="block w-full text-center py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                        }}
                      >
                        Review Now
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
