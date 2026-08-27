'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notesService } from '@/services/notes';
import { Note } from '@/types/note';
import {
  FileText, Mic, Globe, File, Loader2, Search, ArrowLeft, RefreshCw,
  Trash2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Pencil, X, Save, Clock,
} from 'lucide-react';
import Link from 'next/link';

type ApiError = { response?: { data?: { detail?: string } } };

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditNoteModal({ note, onClose }: { note: Note; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(note.title);
  const [subject, setSubject] = useState(note.subject ?? '');
  const [topic, setTopic] = useState(note.topic ?? '');
  const [content, setContent] = useState(note.content ?? '');

  const editMutation = useMutation({
    mutationFn: () =>
      notesService.updateNote(note.id, {
        title: title.trim() || undefined,
        subject: subject.trim() || undefined,
        topic: topic.trim() || undefined,
        content: content.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', String(note.id)] });
      onClose();
    },
  });

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-light)', background: 'var(--surface-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Pencil className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Edit Note
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form body */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (!editMutation.isPending) editMutation.mutate(); }}
          className="flex flex-col overflow-y-auto"
        >
          <div className="px-6 py-5 space-y-4 flex-1">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-all"
                style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6366f1'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* Subject + Topic */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Programming"
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6366f1'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Data Types"
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#6366f1'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                />
              </div>
            </div>

            {/* Content – only show for text notes */}
            {note.content_type === 'text' && (
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-y"
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#6366f1'; }}
                  onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }}
                />
              </div>
            )}

            {/* Error */}
            {editMutation.isError && (
              <div
                className="p-3 rounded-xl flex items-center gap-3 text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(editMutation.error as ApiError)?.response?.data?.detail ?? 'Failed to update note'}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div
            className="px-6 py-4 flex items-center justify-end gap-3 border-t flex-shrink-0"
            style={{ borderColor: 'var(--border-light)', background: 'var(--surface-secondary)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editMutation.isPending || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}
            >
              {editMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AllNotesPage() {
  const queryClient = useQueryClient();
  const { data: notes = [], isLoading, refetch } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => notesService.getNotes(),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      await notesService.deleteNote(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      refetch();
    },
  });

  const [searchTerm, setSearchQuery] = React.useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteTopic, setNoteTopic] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const createNoteMutation = useMutation({
    mutationFn: () =>
      notesService.uploadText(
        noteTitle,
        noteContent,
        noteSubject || undefined,
        noteTopic || undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setNoteTitle('');
      setNoteContent('');
      setNoteSubject('');
      setNoteTopic('');
    },
  });

  const filteredNotes = notes
    .filter((note) => note.content_type === 'text')
    .filter((note) => note.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const groupedNotes = useMemo(() => {
    const grouped: Record<string, Record<string, Note[]>> = {};
    filteredNotes.forEach((note) => {
      const subject = note.subject || 'Uncategorized';
      const topic = note.topic || 'General';
      if (!grouped[subject]) grouped[subject] = {};
      if (!grouped[subject][topic]) grouped[subject][topic] = [];
      grouped[subject][topic].push(note);
    });
    return grouped;
  }, [filteredNotes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Edit Modal */}
      {editingNote && (
        <EditNoteModal note={editingNote} onClose={() => setEditingNote(null)} />
      )}

      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 mb-4 w-fit text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Knowledge Base</h2>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Manage and explore all your stored information.</p>
        </div>

        <div className="flex items-center gap-3 mt-12">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all text-sm"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['notes'] });
              refetch();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Create Note Card */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
      >
        <button
          type="button"
          onClick={() => setShowCreateNote((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 transition-colors"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <span className="flex items-center gap-2 font-semibold">
            <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            Create Text Note
          </span>
          {showCreateNote
            ? <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
        </button>

        {showCreateNote && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (noteTitle.trim() && noteContent.trim().length >= 10) createNoteMutation.mutate();
            }}
            className="px-6 pb-6 space-y-4 border-t"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <p className="text-sm pt-4" style={{ color: 'var(--text-muted)' }}>
              Add study material as text. AI will generate questions automatically.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Note Title</label>
              <input
                type="text"
                placeholder="e.g. Python Basics"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Subject (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Programming"
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Topic (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Data Types"
                  value={noteTopic}
                  onChange={(e) => setNoteTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Content</label>
              <textarea
                placeholder="Paste or type your study notes here (minimum 10 characters)..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                required
                minLength={10}
                rows={6}
                className="w-full px-4 py-3 rounded-xl outline-none resize-y"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              type="submit"
              disabled={!noteTitle.trim() || noteContent.trim().length < 10 || createNoteMutation.isPending}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
            >
              {createNoteMutation.isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Saving Note...</>
              ) : 'Create Note'}
            </button>

            {createNoteMutation.isSuccess && (
              <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#059669' }}>
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="font-medium">Note created successfully!</p>
              </div>
            )}
            {createNoteMutation.isError && (
              <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-medium">{(createNoteMutation.error as ApiError)?.response?.data?.detail || 'Failed to create note'}</p>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Subject Org */}
      <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Subject / Topic Organization</h3>
        {Object.keys(groupedNotes).length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No subjects yet.</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(groupedNotes).map(([subject, topics]) => (
              <div key={subject}>
                <p className="font-semibold" style={{ color: 'var(--primary)' }}>{subject}</p>
                <div className="pl-4 mt-1 space-y-1">
                  {Object.entries(topics).map(([topic, topicNotes]) => (
                    <p key={topic} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {topic} <span style={{ color: 'var(--text-muted)' }}>({topicNotes.length})</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.length === 0 ? (
          <div
            className="col-span-full py-20 text-center rounded-3xl border border-dashed"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            No notes found matching your filter.
          </div>
        ) : (
          filteredNotes.map((note) => {
            const getNoteIcon = (type: string) => {
              switch (type.toLowerCase()) {
                case 'pdf': return FileText;
                case 'youtube': case 'link': return Globe;
                case 'voice': return Mic;
                case 'image': return File;
                default: return File;
              }
            };
            const Icon = getNoteIcon(note.content_type);
            return (
              <div
                key={note.id}
                className="rounded-2xl border p-6 group transition-all duration-200 hover:-translate-y-0.5 relative flex flex-col gap-4"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
              >
                {/* Top row: icon + info + action buttons */}
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/notes/${note.id}`} className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ background: 'var(--primary-lighter)' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold truncate transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {note.title}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Created {new Date(note.created_at).toLocaleDateString()}
                      </p>
                      {note.updated_at && note.updated_at !== note.created_at && (
                        <p
                          className="flex items-center gap-1 text-xs mt-0.5 font-medium"
                          style={{ color: '#6366f1' }}
                        >
                          <Clock className="w-3 h-3" />
                          Updated {new Date(note.updated_at).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {note.subject && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{note.subject}</span>
                        )}
                        {note.topic && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#f3e8ff', color: '#7c3aed' }}>{note.topic}</span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ background: 'var(--surface-secondary)', color: 'var(--text-muted)' }}>
                          {note.content_type}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {/* Edit */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingNote(note);
                      }}
                      title="Edit note"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ color: '#6366f1', background: '#eef1ff' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#e0e7ff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#eef1ff'; }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete */}
                    {deletingNoteId === note.id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 p-1 rounded-lg border border-red-200" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNoteMutation.mutate(note.id);
                            setDeletingNoteId(null);
                          }}
                          className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px]"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeletingNoteId(null);
                          }}
                          className="px-1.5 py-1 text-slate-500 font-bold text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingNoteId(note.id);
                        }}
                        disabled={deleteNoteMutation.isPending}
                        title="Delete note"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                        style={{ color: '#ef4444', background: '#fef2f2' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick-edit shortcut footer bar */}
                <div
                  className="flex items-center justify-between pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ borderColor: 'var(--border-light)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {note.subject ? `${note.subject}${note.topic ? ` › ${note.topic}` : ''}` : 'No subject'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingNote(note);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
