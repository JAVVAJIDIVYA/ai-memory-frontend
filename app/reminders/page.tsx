'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Note, Reminder } from '@/types/note';
import { Clock, CheckCircle2, Trash2, Loader2, FileText, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { REVISION_DAYS } from '@/lib/constants';
import { useState } from 'react';
import { formatDate, formatDateTime } from '@/lib/date';

export default function RemindersPage() {
  const queryClient = useQueryClient();
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => { const response = await api.get<Reminder[]>('/reminders'); return response.data; },
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => { const response = await api.get<Note[]>('/notes'); return response.data; },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => { const response = await api.post(`/reminders/${id}/complete`); return response.data; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/reminders/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const toggleAnswer = (id: number) => {
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  const totalRevisions = REVISION_DAYS.length;

  const sortedReminders = [...reminders].sort(
    (a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}
      >
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="w-8 h-8" /> Revision Schedule
        </h2>
        <p className="text-amber-100 mt-2">
          Spaced repetition: review on Day {REVISION_DAYS.join(', ')} after upload &nbsp;·&nbsp; {totalRevisions} total revisions per material.
        </p>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: reminders.length, color: '#6366f1', bg: '#eef1ff' },
          { label: 'Answered via Email', value: reminders.filter(r => !!r.answer_submitted_at).length, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Completed', value: reminders.filter(r => r.status === 'completed').length, color: '#d97706', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg, border: `1px solid ${s.bg}` }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reminders List */}
      <div className="grid gap-4">
        {sortedReminders.length === 0 ? (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--border)' }} />
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-muted)' }}>No reminders yet</h3>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Upload a note — a revision schedule is created automatically.</p>
          </div>
        ) : (
          sortedReminders.map((reminder) => {
            const note = notes.find((n) => n.id === reminder.note_id);
            const isOverdue = new Date(reminder.next_review_at) < new Date() && reminder.status !== 'completed';
            const isCompleted = reminder.status === 'completed';
            const answered = !!reminder.answer_submitted_at;
            const dayLabel = REVISION_DAYS[reminder.revision_day] ?? reminder.interval;
            const revisionNum = Math.min(reminder.revision_day + 1, totalRevisions);
            const isExpanded = expandedAnswers.has(reminder.id);

            // Border/bg color logic: answered > overdue > completed > normal
            let cardBg = 'var(--surface)';
            let cardBorder = 'var(--border)';
            if (answered) { cardBg = '#f0fdf4'; cardBorder = '#86efac'; }
            else if (isOverdue) { cardBg = '#fff7ed'; cardBorder = '#fed7aa'; }
            else if (isCompleted) { cardBg = 'var(--surface)'; cardBorder = 'var(--border)'; }

            return (
              <div
                key={reminder.id}
                className="rounded-2xl border transition-all duration-200"
                style={{ background: cardBg, borderColor: cardBorder, boxShadow: 'var(--shadow-md)' }}
              >
                {/* Main row */}
                <div className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: answered ? '#dcfce7' : isOverdue ? '#ffedd5' : 'var(--primary-lighter)',
                        color: answered ? '#16a34a' : isOverdue ? '#d97706' : 'var(--primary)',
                      }}
                    >
                      {answered ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-base line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                        {note?.title || 'Unknown Note'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {note?.subject && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>{note.subject}</span>
                        )}

                        {/* Status badge */}
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={
                            answered
                              ? { background: '#22c55e', color: '#fff' }
                              : isCompleted
                              ? { background: '#e2e8f0', color: '#64748b' }
                              : isOverdue
                              ? { background: '#f59e0b', color: '#fff' }
                              : { background: 'var(--surface-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                          }
                        >
                          {answered
                            ? '✓ Answered via email'
                            : isCompleted
                            ? 'All revisions done'
                            : isOverdue
                            ? 'Overdue'
                            : `Due: ${formatDate(reminder.next_review_at)}`}
                        </span>

                        {/* Revision count pill */}
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}
                        >
                          Revision {revisionNum}/{totalRevisions}
                        </span>

                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Day {dayLabel} · Reviewed {reminder.review_count}×
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {answered && (
                      <button
                        onClick={() => toggleAnswer(reminder.id)}
                        className="px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                        style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                        title="Show answer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <Link
                      href={`/notes/${reminder.note_id}`}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'var(--primary-lighter)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                    >
                      View
                    </Link>
                    {!isCompleted && (
                      <button
                        onClick={() => completeMutation.mutate(reminder.id)}
                        disabled={completeMutation.isPending}
                        className="p-2 rounded-xl transition-all disabled:opacity-50"
                        style={{ background: '#ecfdf5', color: '#059669' }}
                        title="Mark revision complete"
                      >
                        {completeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(reminder.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-xl transition-all disabled:opacity-50"
                      style={{ background: '#fef2f2', color: '#dc2626' }}
                      title="Delete reminder"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Expanded answer panel */}
                {answered && isExpanded && (
                  <div
                    className="px-6 pb-6 space-y-3 border-t"
                    style={{ borderColor: '#bbf7d0' }}
                  >
                    <div className="pt-4">
                      {reminder.user_answer && (
                        <div
                          className="rounded-xl px-4 py-3"
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                        >
                          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#16a34a' }}>
                            Your Answer (submitted via email)
                          </p>
                          <p className="text-sm font-medium" style={{ color: '#14532d' }}>
                            "{reminder.user_answer}"
                          </p>
                          {reminder.answer_submitted_at && (
                            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                              Submitted {formatDateTime(reminder.answer_submitted_at)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
