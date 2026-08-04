'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { notesService } from '@/services/notes';
import { Question } from '@/types/note';
import { HelpCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

type ApiError = { response?: { data?: { detail?: string } } };

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeMcqOption(option: unknown, index: number): string {
  if (typeof option === 'string') return option;
  if (typeof option === 'number') return String(option);
  if (option && typeof option === 'object') {
    const obj = option as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.value === 'string') return obj.value;
    if (typeof obj.option === 'string') return obj.option;
    const textValues = Object.values(obj).filter((v) => typeof v === 'string') as string[];
    if (textValues.length > 0) return textValues.join(' ');
  }
  return `Option ${String.fromCharCode(65 + index)}`;
}

function parseQuestionOptions(optionsJson: string | null): string[] {
  if (!optionsJson) return [];
  try {
    const parsed = JSON.parse(optionsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((opt, index) => normalizeMcqOption(opt, index));
  } catch { return []; }
}

function resolveMcqAnswer(answer: string | null, options: string[]): string {
  if (!answer) return '';
  const normalized = normalizeText(answer);
  if (normalized.length === 1 && normalized >= 'a' && normalized <= 'z') {
    const index = normalized.charCodeAt(0) - 97;
    if (index >= 0 && index < options.length) return options[index];
  }
  return answer;
}

function isCorrectMcqAnswer(selected: string, answer: string | null, options: string[]): boolean {
  if (!answer || !selected) return false;
  const normalizedSelected = normalizeText(selected);
  const normalizedAnswer = normalizeText(answer);
  if (normalizedSelected === normalizedAnswer) return true;
  const resolvedAnswer = normalizeText(resolveMcqAnswer(answer, options));
  if (normalizedSelected === resolvedAnswer) return true;
  const selectedIndex = options.findIndex((opt) => normalizeText(opt) === normalizedSelected);
  if (selectedIndex >= 0) {
    const letter = String.fromCharCode(65 + selectedIndex).toLowerCase();
    return normalizedAnswer === letter;
  }
  return false;
}

function QuestionCard({
  q, index, showAnswers, selectedAnswers, setSelectedAnswers,
}: {
  q: Question; index: number; showAnswers: boolean;
  selectedAnswers: Record<number, string>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  const options = parseQuestionOptions(q.options);
  const isMcq = q.question_type === 'mcq' && options.length > 0;
  const selectedOpt = selectedAnswers[q.id];
  const hasAnswered = !!selectedOpt || showAnswers;
  const resolvedAnswer = resolveMcqAnswer(q.answer, options);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex justify-between items-start gap-4">
        <span
          className="text-xs uppercase px-2 py-0.5 rounded-md font-bold"
          style={{ background: 'var(--primary-lighter)', color: 'var(--primary)', border: '1px solid var(--border)' }}
        >
          {q.question_type}
        </span>
      </div>

      <p className="font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>
        {index + 1}. {q.question_text}
      </p>

      {isMcq ? (
        <div className="mt-4 space-y-2">
          {options.map((opt, optIdx) => {
            const isSelected = selectedOpt === opt;
            const isCorrect = isCorrectMcqAnswer(opt, q.answer, options);

            let bg = 'var(--surface-secondary)';
            let borderColor = 'var(--border)';
            let textColor = 'var(--text-primary)';

            if (hasAnswered) {
              if (isCorrect) { bg = '#ecfdf5'; borderColor = '#6ee7b7'; textColor = '#059669'; }
              else if (isSelected) { bg = '#fef2f2'; borderColor = '#fca5a5'; textColor = '#dc2626'; }
              else { bg = 'var(--surface-secondary)'; textColor = 'var(--text-muted)'; }
            }

            return (
              <button
                key={`${q.id}-${optIdx}`}
                disabled={hasAnswered}
                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between"
                style={{ background: bg, borderColor, color: textColor }}
              >
                <span>{opt}</span>
                {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {hasAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
              </button>
            );
          })}

          {hasAnswered && (
            <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs" style={{ borderColor: 'var(--border-light)' }}>
              {selectedOpt ? (
                isCorrectMcqAnswer(selectedOpt, q.answer, options) ? (
                  <span className="font-bold flex items-center gap-1" style={{ color: '#059669' }}>
                    <CheckCircle2 className="w-4 h-4" /> Correct!
                  </span>
                ) : (
                  <span className="font-bold flex items-center gap-1" style={{ color: '#dc2626' }}>
                    <XCircle className="w-4 h-4" /> Incorrect. The correct answer is: {resolvedAnswer}
                  </span>
                )
              ) : (
                <span className="font-medium" style={{ color: 'var(--primary)' }}>Correct answer: {resolvedAnswer}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {showAnswers && q.answer && (
            <div className="mt-3 text-sm flex items-start gap-2 rounded-xl p-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#059669' }}>
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold">Correct Answer</p>
                <p className="mt-0.5" style={{ color: 'var(--text-primary)' }}>{q.answer}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesService.getNotes(),
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', subject, topic],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (topic) params.set('topic', topic);
      const response = await api.get<Question[]>(`/questions${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    },
  });

  const notesById = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
  const subjects = useMemo(() => Array.from(new Set(notes.map((n) => n.subject).filter(Boolean) as string[])).sort(), [notes]);
  const topics = useMemo(() => {
    const filtered = subject ? notes.filter((n) => n.subject === subject) : notes;
    return Array.from(new Set(filtered.map((n) => n.topic).filter(Boolean) as string[])).sort();
  }, [notes, subject]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { mcq: 0, short: 0, long: 0, viva: 0 };
    for (const q of questions) counts[q.question_type] = (counts[q.question_type] ?? 0) + 1;
    return counts;
  }, [questions]);

  const groupedQuestions = useMemo(() => {
    const groups = new Map<string, Question[]>();
    for (const q of questions) {
      const title = q.note_title || notesById.get(q.note_id)?.title || 'Unknown Note';
      const existing = groups.get(title) ?? [];
      existing.push(q);
      groups.set(title, existing);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [questions, notesById]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}
      >
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <HelpCircle className="w-8 h-8" /> Question Practice
        </h2>
        <p className="text-indigo-100 mt-2">Practice generated MCQ, short, long, and viva questions.</p>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-4 gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        {[
          { value: subject, onChange: (v: string) => { setSubject(v); setTopic(''); }, options: subjects, placeholder: 'All Subjects' },
          { value: topic, onChange: (v: string) => setTopic(v), options: topics, placeholder: 'All Topics' },
        ].map((sel, i) => (
          <select
            key={i}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm font-medium outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="">{sel.placeholder}</option>
            {sel.options.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ))}
        <button
          onClick={() => setShowAnswers((v) => !v)}
          className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={showAnswers
            ? { background: 'var(--primary)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }
            : { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          {showAnswers ? 'Hide Answers' : 'Show Answers'}
        </button>
        <div className="text-sm self-center text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
          Total: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{questions.length}</span>
        </div>
      </div>

      {/* Type Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(typeCounts).map(([k, v]) => (
          <div key={k} className="rounded-xl border p-3 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{k}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Questions */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          No questions found for the selected filters.
        </div>
      ) : (
        <div className="space-y-8">
          {groupedQuestions.map(([noteTitle, groupQuestions]) => (
            <section key={noteTitle} className="space-y-4">
              <div
                className="flex items-center gap-3 sticky top-0 py-3 px-4 rounded-xl z-10 backdrop-blur-sm"
                style={{ background: 'rgba(240,244,255,0.9)', border: '1px solid var(--border-light)' }}
              >
                <h3 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>{noteTitle}</h3>
                <span className="text-xs shrink-0 font-medium" style={{ color: 'var(--text-muted)' }}>
                  {groupQuestions.length} question{groupQuestions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-4 pl-1">
                {groupQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    index={idx}
                    showAnswers={showAnswers}
                    selectedAnswers={selectedAnswers}
                    setSelectedAnswers={setSelectedAnswers}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
