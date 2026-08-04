'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  CheckCircle2, XCircle, HelpCircle, Mail, Monitor,
  Lightbulb, ChevronDown, ChevronUp, BarChart2, BookOpen, Filter
} from 'lucide-react';

interface ResultItem {
  reminder_id: number;
  note_id: number;
  note_title: string;
  note_subject: string | null;
  note_topic: string | null;
  revision_number: number;
  total_revisions: number;
  question_text: string | null;
  question_type: string;
  options: string[];
  user_answer: string | null;
  correct_answer: string | null;
  reason: string | null;
  is_correct: boolean | null;
  answer_source: 'web' | 'email' | null;
  answer_submitted_at: string | null;
  status: string;
}

type FilterType = 'all' | 'correct' | 'wrong' | 'unknown' | 'email' | 'web';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export default function ResultsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: results = [], isLoading } = useQuery<ResultItem[]>({
    queryKey: ['results'],
    queryFn: async () => {
      const res = await api.get<ResultItem[]>('/reminders/results');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const toggle = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Stats
  const total = results.length;
  const correct = results.filter(r => r.is_correct === true).length;
  const wrong = results.filter(r => r.is_correct === false).length;
  const viaEmail = results.filter(r => r.answer_source === 'email').length;
  const viaWeb = results.filter(r => r.answer_source === 'web').length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Filtered list
  const filtered = results.filter(r => {
    if (filter === 'correct') return r.is_correct === true;
    if (filter === 'wrong') return r.is_correct === false;
    if (filter === 'unknown') return r.is_correct === null;
    if (filter === 'email') return r.answer_source === 'email';
    if (filter === 'web') return r.answer_source === 'web';
    return true;
  });

  const filterBtns: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'All', count: total, color: '#6366f1' },
    { key: 'correct', label: '✓ Correct', count: correct, color: '#16a34a' },
    { key: 'wrong', label: '✗ Wrong', count: wrong, color: '#dc2626' },
    { key: 'email', label: '📧 Via Email', count: viaEmail, color: '#0891b2' },
    { key: 'web', label: '🖥️ Via Web', count: viaWeb, color: '#7c3aed' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .result-card { animation: fadeUp 0.3s ease both; }
        .filter-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Header */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
        }}
      >
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="w-8 h-8" /> My Results
          </h2>
          <p className="text-indigo-100 mt-2">
            Review all your answered questions — web &amp; email replies in one place.
          </p>
        </div>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)' }} />
        <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.5)' }} />
      </div>

      {/* Stats Row */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Answered', value: total, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
            {
              label: 'Accuracy',
              value: `${accuracy}%`,
              color: accuracy >= 70 ? '#16a34a' : accuracy >= 40 ? '#d97706' : '#dc2626',
              bg: accuracy >= 70 ? '#f0fdf4' : accuracy >= 40 ? '#fffbeb' : '#fef2f2',
              border: accuracy >= 70 ? '#bbf7d0' : accuracy >= 40 ? '#fde68a' : '#fecaca',
            },
            { label: '📧 Via Email', value: viaEmail, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
            { label: '🖥️ Via Web', value: viaWeb, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          ].map(s => (
            <div key={s.label}
              className="rounded-2xl p-5 text-center"
              style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Accuracy Bar */}
      {total > 0 && (
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Overall Accuracy</span>
            <span className="text-sm font-bold" style={{ color: accuracy >= 70 ? '#16a34a' : '#d97706' }}>{accuracy}%</span>
          </div>
          <div className="rounded-full overflow-hidden h-3" style={{ background: '#e2e8f0' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${accuracy}%`,
                background: accuracy >= 70
                  ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                  : accuracy >= 40
                  ? 'linear-gradient(90deg,#fbbf24,#d97706)'
                  : 'linear-gradient(90deg,#f87171,#dc2626)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            <span>{correct} correct</span>
            <span>{wrong} wrong</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Filter className="w-4 h-4 mt-2.5" style={{ color: 'var(--text-muted)' }} />
        {filterBtns.map(f => (
          <button
            key={f.key}
            className="filter-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? f.color : 'var(--surface-secondary)',
              color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${filter === f.key ? f.color : 'var(--border)'}`,
              boxShadow: filter === f.key ? `0 2px 8px ${f.color}44` : 'none',
            }}
          >
            {f.label} <span className="ml-1 opacity-75">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Results List */}
      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          Loading your results…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-14 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <BarChart2 className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--border)' }} />
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-muted)' }}>
            {filter === 'all' ? 'No answered questions yet' : `No ${filter} answers yet`}
          </h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Answer questions via email or the web to see results here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r, idx) => {
            const isExp = expanded.has(r.reminder_id);
            const answeredAt = r.answer_submitted_at
              ? new Date(r.answer_submitted_at).toLocaleString()
              : '';

            let borderColor = 'var(--border)';
            let headerBg = 'var(--surface-secondary)';
            let StatusIcon = HelpCircle;
            let statusColor = '#64748b';
            let statusLabel = 'Recorded';

            if (r.is_correct === true) {
              borderColor = '#86efac';
              headerBg = '#f0fdf4';
              StatusIcon = CheckCircle2;
              statusColor = '#16a34a';
              statusLabel = 'Correct';
            } else if (r.is_correct === false) {
              borderColor = '#fca5a5';
              headerBg = '#fef2f2';
              StatusIcon = XCircle;
              statusColor = '#dc2626';
              statusLabel = 'Wrong';
            }

            return (
              <div
                key={r.reminder_id}
                className="result-card rounded-2xl border overflow-hidden"
                style={{
                  borderColor,
                  boxShadow: 'var(--shadow-md)',
                  animationDelay: `${idx * 0.04}s`,
                }}
              >
                {/* Card header — always visible */}
                <button
                  className="w-full text-left p-5 flex items-start gap-4 transition-all"
                  style={{ background: headerBg }}
                  onClick={() => toggle(r.reminder_id)}
                >
                  <StatusIcon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: statusColor }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                        {r.note_title}
                      </h3>
                      {/* Source badge */}
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 flex items-center gap-1"
                        style={
                          r.answer_source === 'email'
                            ? { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }
                            : r.answer_source === 'web'
                            ? { background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }
                            : { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
                        }
                      >
                        {r.answer_source === 'email'
                          ? <><Mail className="w-2.5 h-2.5" /> Email</>
                          : r.answer_source === 'web'
                          ? <><Monitor className="w-2.5 h-2.5" /> Web</>
                          : 'Unknown'}
                      </span>
                      {/* Result badge */}
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                        style={{
                          background: r.is_correct === true ? '#16a34a' : r.is_correct === false ? '#dc2626' : '#64748b',
                          color: '#fff',
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {r.note_subject && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                          {r.note_subject}
                        </span>
                      )}
                      {r.note_topic && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>› {r.note_topic}</span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        <BookOpen className="w-3 h-3 inline mr-0.5" />
                        Revision {r.revision_number + 1}/{r.total_revisions}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{answeredAt}</span>
                    </div>

                    {/* Answer preview */}
                    {r.user_answer && (
                      <p className="text-sm mt-2 font-medium italic line-clamp-1" style={{ color: statusColor }}>
                        "{r.user_answer}"
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 mt-1">
                    {isExp
                      ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExp && (
                  <div
                    className="px-6 pb-6 pt-4 space-y-4"
                    style={{ background: 'var(--surface)', borderTop: `1px solid ${borderColor}` }}
                  >
                    {/* Question */}
                    {r.question_text && (
                      <div className="rounded-xl p-4"
                        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-light)' }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2"
                          style={{ color: 'var(--primary)' }}>
                          {r.question_type === 'mcq' ? 'Multiple Choice Question' : 'Question'}
                        </p>
                        <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {r.question_text}
                        </p>
                        {r.options.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {r.options.map((opt, i) => (
                              <li key={i}
                                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg"
                                style={{
                                  background: opt === r.correct_answer
                                    ? '#f0fdf4'
                                    : opt === r.user_answer && r.is_correct === false
                                    ? '#fef2f2'
                                    : 'transparent',
                                  border: opt === r.correct_answer
                                    ? '1px solid #bbf7d0'
                                    : opt === r.user_answer && r.is_correct === false
                                    ? '1px solid #fecaca'
                                    : '1px solid transparent',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                                  style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                {opt}
                                {opt === r.correct_answer && (
                                  <CheckCircle2 className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: '#16a34a' }} />
                                )}
                                {opt === r.user_answer && r.is_correct === false && (
                                  <XCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: '#dc2626' }} />
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Your answer vs correct */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl p-4"
                        style={{
                          background: r.is_correct === true ? '#f0fdf4' : r.is_correct === false ? '#fef2f2' : '#f8fafc',
                          border: `1px solid ${r.is_correct === true ? '#bbf7d0' : r.is_correct === false ? '#fecaca' : '#e2e8f0'}`,
                        }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                          style={{ color: r.is_correct === true ? '#15803d' : r.is_correct === false ? '#b91c1c' : '#64748b' }}>
                          Your Answer
                        </p>
                        <p className="text-sm font-semibold"
                          style={{ color: r.is_correct === true ? '#14532d' : r.is_correct === false ? '#991b1b' : 'var(--text-primary)' }}>
                          {r.user_answer || '—'}
                        </p>
                      </div>

                      {r.correct_answer && (
                        <div className="rounded-xl p-4"
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                            style={{ color: '#15803d' }}>
                            Correct Answer
                          </p>
                          <p className="text-sm font-semibold" style={{ color: '#14532d' }}>
                            {r.correct_answer}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Reason / Explanation */}
                    {r.reason && (
                      <div className="rounded-xl p-4"
                        style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 flex-shrink-0" style={{ color: '#d97706' }} />
                          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#92400e' }}>
                            Why this answer?
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: '#78350f' }}>{r.reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
