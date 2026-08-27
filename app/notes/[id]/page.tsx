'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesService } from '@/services/notes';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText, Loader2, ChevronLeft, HelpCircle, CheckCircle2, Clock, Mail,
  AlertCircle, RefreshCw, Trash2, Pencil, X, Save,
} from 'lucide-react';
import Link from 'next/link';
import { Question, Reminder } from '@/types/note';

type ScheduleDelay = { minutes?: number; hours?: number };
type ScheduleResponse = Reminder & { scheduled_question?: string; email_to?: string; };

export default function NotePage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const noteId = Number(id);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [lastScheduledQuestion, setLastScheduledQuestion] = useState<string | null>(null);

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => { const response = await api.get<{ email: string }>('/user/me'); return response.data; },
  });

  useEffect(() => {
    if (profile?.email && !recipientEmail) setRecipientEmail(profile.email);
  }, [profile?.email, recipientEmail]);

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesService.getNote(noteId),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const n = query.state.data;
      return n && !n.ai_processed && n.processing_status !== 'failed' ? 5000 : false;
    },
  });

  // Pre-fill edit fields when note loads
  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditSubject(note.subject ?? '');
      setEditTopic(note.topic ?? '');
      setEditContent(note.content ?? '');
    }
  }, [note]);

  const { data: questions } = useQuery({
    queryKey: ['questions', id],
    queryFn: async () => { const response = await api.get<Question[]>(`/questions?note_id=${id}`); return response.data; },
    enabled: !!note,
  });

  const { data: reminders, refetch: refetchReminders } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => { const response = await api.get<Reminder[]>('/reminders'); return response.data; },
  });

  const noteReminder = reminders?.find((r) => r.note_id === noteId);

  useEffect(() => {
    if (!noteReminder || noteReminder.email_sent_at) { setCountdown(null); return; }
    const tick = () => {
      const due = new Date(noteReminder.next_review_at).getTime();
      const diff = due - Date.now();
      if (diff <= 0) { setCountdown('Due now — check your email for the revision question'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}m ${secs}s until question is emailed`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [noteReminder]);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateNoteMutation = useMutation({
    mutationFn: () =>
      notesService.updateNote(noteId, {
        title: editTitle.trim() || undefined,
        subject: editSubject.trim() || undefined,
        topic: editTopic.trim() || undefined,
        content: editContent.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsEditing(false);
    },
  });

  const scheduleReminderMutation = useMutation({
    mutationFn: async (delay: ScheduleDelay) => {
      if (!recipientEmail.trim()) throw new Error('Please enter your email address');
      const email = recipientEmail.trim();
      const body: Record<string, string | number> = { note_id: noteId, email };
      if (delay.minutes != null) body.delay_minutes = delay.minutes;
  // ── Toast notification state ─────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const scheduleMutation = useMutation({
    mutationFn: async (delay: ScheduleDelay) => {
      const email = recipientEmail.trim() || undefined;
      const body: Record<string, any> = { note_id: noteId, email };
      if (delay.minutes != null) body.delay_minutes = delay.minutes;
      else body.delay_hours = delay.hours ?? 1;
      if (noteReminder) {
        const params: Record<string, string | number> = { email };
        if (delay.minutes != null) params.delay_minutes = delay.minutes;
        else params.delay_hours = delay.hours ?? 1;
        const response = await api.post<ScheduleResponse>(`/reminders/${noteReminder.id}/schedule`, null, { params });
        return response.data;
      }
      const response = await api.post<ScheduleResponse>('/reminders', body);
      return response.data;
    },
    onSuccess: (data) => {
      refetchReminders();
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['questions', id] });
      if (data.scheduled_question) setLastScheduledQuestion(data.scheduled_question);
      showToast(`Revision scheduled! Email will be sent to: ${data.email_to || recipientEmail}`, 'success');
    },
    onError: (err: Error) => { showToast(err.message || 'Failed to schedule revision', 'error'); },
  });

  const completeReminderMutation = useMutation({
    mutationFn: async (reminderId: number) => { const response = await api.post(`/reminders/${reminderId}/complete`); return response.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reminders'] }); setLastScheduledQuestion(null); showToast('Revision marked complete! ✨', 'success'); },
  });

  const retryMutation = useMutation({
    mutationFn: async () => { await notesService.retryNoteSummary(noteId); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['note', id] }); queryClient.invalidateQueries({ queryKey: ['questions', id] }); showToast('AI processing retried successfully! ✨', 'success'); },
    onError: (err: any) => { showToast(err.message || 'Failed to retry AI processing', 'error'); },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => { await notesService.deleteNote(noteId); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notes'] }); router.push('/notes'); },
    onError: (err: any) => { showToast(err.message || 'Failed to delete note', 'error'); },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!note) return <div style={{ color: 'var(--text-primary)' }}>Note not found</div>;
  const isProcessing = !note.ai_processed && note.processing_status !== 'failed';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Back link */}
      <Link href="/notes" className="flex items-center gap-2 text-sm font-medium transition-colors w-fit" style={{ color: 'var(--text-muted)' }}>
        <ChevronLeft className="w-4 h-4" />
        Back to Notes
      </Link>

      {/* ── Title / Header area ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
      >
        {/* View mode header */}
        {!isEditing && (
          <div className="px-8 py-6 flex justify-between items-start gap-4 flex-wrap">
            <div className="space-y-2 flex-1 min-w-0">
              <h1 className="text-4xl font-bold break-words" style={{ color: 'var(--text-primary)' }}>{note.title}</h1>
              <p className="text-sm flex items-center gap-2 flex-wrap" style={{ color: 'var(--text-secondary)' }}>
                {note.subject && <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{note.subject}</span>}
                {note.topic && <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: '#f3e8ff', color: '#7c3aed' }}>{note.topic}</span>}
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(note.created_at).toLocaleDateString()} • {note.content_type.toUpperCase()}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Edit button */}
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                }}
              >
                <Pencil className="w-4 h-4" />
                Edit Note
              </button>
              {/* Delete button */}
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteNoteMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 p-1.5 rounded-xl border border-red-200 dark:border-red-900">
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 px-2">Delete note?</span>
                  <button
                    onClick={() => deleteNoteMutation.mutate()}
                    disabled={deleteNoteMutation.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all"
                  >
                    {deleteNoteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit mode panel */}
        {isEditing && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (!updateNoteMutation.isPending) updateNoteMutation.mutate(); }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between border-b"
              style={{ borderColor: 'var(--border-light)', background: 'var(--surface-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Pencil className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Editing Note</span>
              </div>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditTitle(note.title); setEditSubject(note.subject ?? ''); setEditTopic(note.topic ?? ''); setEditContent(note.content ?? ''); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm font-semibold transition-all"
                  style={{ background: 'var(--surface-secondary)', border: '2px solid #6366f1', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Subject + Topic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="e.g. Programming"
                    className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Topic</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    placeholder="e.g. Data Types"
                    className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                  />
                </div>
              </div>

              {/* Content – only for text notes */}
              {note.content_type === 'text' && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Content</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-y font-mono"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }}
                  />
                </div>
              )}

              {/* Error */}
              {updateNoteMutation.isError && (
                <div className="p-3 rounded-xl flex items-center gap-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Failed to update note. Please try again.
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditTitle(note.title); setEditSubject(note.subject ?? ''); setEditTopic(note.topic ?? ''); setEditContent(note.content ?? ''); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateNoteMutation.isPending || !editTitle.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                >
                  {updateNoteMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Schedule Revision Panel */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ background: '#fff7ed', borderColor: '#fed7aa', boxShadow: 'var(--shadow-md)' }}
      >
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#d97706' }}>
          <Mail className="w-5 h-5" />
          Schedule Revision for this Topic
        </h3>
        <p className="text-sm" style={{ color: '#92400e' }}>
          When you schedule, the system generates a <strong>new question</strong> for{' '}
          <strong>{note.topic || note.title}</strong> and emails it to you when the time is due.
        </p>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#92400e' }}>Your email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="student@university.edu"
            className="w-full max-w-md px-4 py-3 rounded-xl outline-none"
            style={{ background: '#fff', border: '1px solid #fed7aa', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => scheduleReminderMutation.mutate({ minutes: 1 })}
            disabled={scheduleReminderMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-white text-xs"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}
          >
            {scheduleReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            1 Min (Test)
          </button>
          <button
            onClick={() => scheduleReminderMutation.mutate({ minutes: 5 })}
            disabled={scheduleReminderMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold border transition-all disabled:opacity-50 text-xs"
            style={{ background: '#fff', borderColor: '#fed7aa', color: '#92400e' }}
          >
            5 Mins
          </button>
          <button
            onClick={() => scheduleReminderMutation.mutate({ hours: 1 })}
            disabled={scheduleReminderMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold border transition-all disabled:opacity-50 text-xs"
            style={{ background: '#fff', borderColor: '#fed7aa', color: '#92400e' }}
          >
            1 Hour
          </button>
          <button
            onClick={() => scheduleReminderMutation.mutate({ hours: 24 })}
            disabled={scheduleReminderMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold border transition-all disabled:opacity-50 text-xs"
            style={{ background: '#fff', borderColor: '#fed7aa', color: '#92400e' }}
          >
            1 Day
          </button>
          <button
            onClick={() => scheduleReminderMutation.mutate({ hours: 48 })}
            disabled={scheduleReminderMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold border transition-all disabled:opacity-50 text-xs"
            style={{ background: '#fff', borderColor: '#fed7aa', color: '#92400e' }}
          >
            2 Days
          </button>
          <button
            onClick={() => scheduleReminderMutation.mutate({ hours: 96 })}
            disabled={scheduleReminderMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold border transition-all disabled:opacity-50 text-xs"
            style={{ background: '#fff', borderColor: '#fed7aa', color: '#92400e' }}
          >
            4 Days
          </button>
          <button
            onClick={() => scheduleReminderMutation.mutate({ hours: 168 })}
            disabled={scheduleReminderMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold border transition-all disabled:opacity-50 text-xs"
            style={{ background: '#fff', borderColor: '#fed7aa', color: '#92400e' }}
          >
            7 Days
          </button>
          {noteReminder && (
            <button
              onClick={() => completeReminderMutation.mutate(noteReminder.id)}
              disabled={completeReminderMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-white text-xs"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Done
            </button>
          )}
        </div>
        {lastScheduledQuestion && (
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #fed7aa' }}>
            <p className="text-xs uppercase font-bold mb-1" style={{ color: '#d97706' }}>Generated revision question</p>
            <p style={{ color: 'var(--text-primary)' }}>{lastScheduledQuestion}</p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>This question will be sent in your email when the revision is due.</p>
          </div>
        )}
        {countdown && (
          <div className="text-sm flex items-center gap-2" style={{ color: '#d97706' }}>
            <Clock className="w-4 h-4 animate-pulse" />
            {countdown}
          </div>
        )}
      </div>

      {/* AI Processing Banner */}
      {isProcessing && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' }}>
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <div>
            <p className="font-semibold">AI is processing this note to generate MCQs.</p>
            <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>This can take 1-3 minutes for larger files. Please wait...</p>
          </div>
        </div>
      )}

      {note.processing_status === 'failed' && (
        <div className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>AI processing failed for this note. You can try reprocessing.</span>
          </div>
          <button
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2 text-white"
            style={{ background: '#dc2626' }}
          >
            {retryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Retry AI Processing
          </button>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Original Content */}
        <div className="lg:col-span-2 space-y-8">
          <div
            className="rounded-2xl border p-8"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Original Content
            </h3>
            <div
              className="leading-relaxed whitespace-pre-wrap font-mono text-sm max-h-[600px] overflow-y-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              {note.content}
            </div>
          </div>
        </div>

        {/* Questions Sidebar */}
        <div className="space-y-8">
          {questions && questions.length > 0 && (
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
            >
              <h3 className="text-base font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <HelpCircle className="w-5 h-5" />
                Saved Questions ({questions.length})
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Revision emails use a freshly generated question when you schedule.</p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {questions.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border"
                    style={{ background: 'var(--surface-secondary)', borderColor: 'var(--border-light)' }}
                  >
                    <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--primary)' }}>{q.question_type}</span>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{q.question_text}</p>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </div>

      {/* Modern Floating Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all border text-sm font-semibold text-white"
          style={{
            background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#6366f1' : '#10b981',
            borderColor: 'rgba(255, 255, 255, 0.25)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white font-bold text-xs p-1">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
