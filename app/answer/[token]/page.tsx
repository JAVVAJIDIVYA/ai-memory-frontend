'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { CheckCircle2, XCircle, BookOpen, Clock, Loader2, Send, ChevronRight, Lightbulb } from 'lucide-react';

interface QuestionData {
  reminder_id: number;
  note_title: string;
  note_subject: string | null;
  note_topic: string | null;
  revision_number: number;
  total_revisions: number;
  due_at: string | null;
  question_text: string | null;
  question_type: string;
  options: string[];
  already_answered: boolean;
  user_answer: string | null;
  correct_answer: string | null;
  reason: string | null;
}

interface SubmitResult {
  message: string;
  user_answer: string;
  correct_answer: string | null;
  reason: string | null;
  options: string[];
  is_correct: boolean | null;
  next_revision_day: number | null;
  status: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export default function AnswerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [data, setData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/reminders/answer/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.detail) throw new Error(d.detail);
        setData(d);
        if (d.already_answered) {
          setResult({
            message: 'Already answered',
            user_answer: d.user_answer ?? '',
            correct_answer: d.correct_answer,
            reason: d.reason,
            options: d.options,
            is_correct: d.user_answer && d.correct_answer
              ? d.user_answer.trim().toLowerCase() === d.correct_answer.trim().toLowerCase()
              : null,
            next_revision_day: null,
            status: 'answered',
          });
        }
      })
      .catch((e) => setError(e.message ?? 'Failed to load question'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    const answer = data?.question_type === 'mcq' ? selectedOption : userAnswer;
    if (!answer?.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reminders/answer/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_answer: answer }),
      });
      const json = await res.json();
      if (json.detail) throw new Error(json.detail);
      setResult(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader2 style={{ width: 40, height: 40, color: '#6366f1', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontSize: 15 }}>Loading your question…</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 32px' }}>
          <XCircle style={{ width: 52, height: 52, color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Link Expired or Invalid</h2>
          <p style={{ color: '#64748b', fontSize: 15 }}>{error ?? 'This answer link is no longer valid.'}</p>
          <a href="/" style={styles.primaryBtn}>Go to Dashboard</a>
        </div>
      </div>
    );
  }

  const isMCQ = data.question_type === 'mcq' && data.options.length > 0;
  const revisionLabel = `Revision ${data.revision_number} of ${data.total_revisions}`;
  const hasAnswered = !!result;
  const isCorrect = result?.is_correct;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        .option-btn:hover { background: #eef2ff !important; border-color: #6366f1 !important; transform: translateX(4px); }
        .option-btn { transition: all 0.18s ease !important; }
        .submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn { transition: all 0.18s ease !important; }
      `}</style>

      {/* Header banner */}
      <div style={styles.banner}>
        <BookOpen style={{ width: 22, height: 22 }} />
        <span style={{ fontWeight: 700, fontSize: 16 }}>AI Memory · Revision Reminder</span>
      </div>

      <div style={styles.container}>
        {/* Meta info */}
        <div style={styles.meta}>
          <div>
            <h1 style={styles.noteTitle}>{data.note_title}</h1>
            {(data.note_subject || data.note_topic) && (
              <p style={styles.noteSub}>
                {data.note_subject}{data.note_subject && data.note_topic && ' › '}{data.note_topic}
              </p>
            )}
          </div>
          <div style={styles.revBadge}>
            <Clock style={{ width: 13, height: 13 }} />
            {revisionLabel}
          </div>
        </div>

        {/* Question card */}
        <div style={{ ...styles.card, animation: 'fadeUp 0.4s ease' }}>
          <div style={styles.qLabel}>
            {isMCQ ? 'Multiple Choice Question' : 'Short Answer Question'}
          </div>
          <p style={styles.qText}>{data.question_text ?? 'No question available for this revision.'}</p>

          {/* Answer form */}
          {!hasAnswered && data.question_text && (
            <>
              {isMCQ ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
                  {data.options.map((opt, i) => (
                    <button
                      key={i}
                      className="option-btn"
                      onClick={() => setSelectedOption(opt)}
                      style={{
                        ...styles.optionBtn,
                        background: selectedOption === opt ? '#eef2ff' : '#f8fafc',
                        borderColor: selectedOption === opt ? '#6366f1' : '#e2e8f0',
                        color: selectedOption === opt ? '#4338ca' : '#334155',
                        fontWeight: selectedOption === opt ? 600 : 500,
                      }}
                    >
                      <span style={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here…"
                  rows={4}
                  style={styles.textarea}
                />
              )}

              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={submitting || (isMCQ ? !selectedOption : !userAnswer.trim())}
                style={{
                  ...styles.primaryBtn,
                  marginTop: 20,
                  opacity: submitting || (isMCQ ? !selectedOption : !userAnswer.trim()) ? 0.5 : 1,
                  cursor: submitting || (isMCQ ? !selectedOption : !userAnswer.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {submitting
                  ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> Submitting…</>
                  : <><Send style={{ width: 16, height: 16 }} /> Submit Answer</>
                }
              </button>
            </>
          )}

          {/* Result panel */}
          {hasAnswered && (
            <div style={{ animation: 'fadeUp 0.35s ease', marginTop: 28 }}>
              {/* Correct/Wrong banner */}
              {result.is_correct !== null && (
                <div style={{
                  ...styles.resultBanner,
                  background: isCorrect ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)' : 'linear-gradient(135deg,#fee2e2,#fecaca)',
                  borderColor: isCorrect ? '#86efac' : '#fca5a5',
                }}>
                  {isCorrect
                    ? <CheckCircle2 style={{ width: 28, height: 28, color: '#16a34a', flexShrink: 0 }} />
                    : <XCircle style={{ width: 28, height: 28, color: '#dc2626', flexShrink: 0 }} />}
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 17, color: isCorrect ? '#15803d' : '#b91c1c' }}>
                      {isCorrect ? 'Correct! Well done 🎉' : 'Not quite right'}
                    </p>
                    {!isCorrect && result.user_answer && (
                      <p style={{ fontSize: 13, color: '#991b1b', marginTop: 2 }}>
                        Your answer: <em>"{result.user_answer}"</em>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Correct answer */}
              {result.correct_answer && (
                <div style={styles.answerBox}>
                  <p style={styles.answerLabel}>Correct Answer</p>
                  <p style={styles.answerText}>{result.correct_answer}</p>
                </div>
              )}

              {/* Reason / Explanation */}
              {result.reason && (
                <div style={styles.reasonBox}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Lightbulb style={{ width: 18, height: 18, color: '#d97706' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>Why this answer?</span>
                  </div>
                  <p style={{ fontSize: 15, color: '#78350f', lineHeight: 1.7 }}>{result.reason}</p>
                </div>
              )}

              {/* Next revision info */}
              <div style={styles.nextRevBox}>
                <ChevronRight style={{ width: 16, height: 16, color: '#6366f1', flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: '#4338ca' }}>
                  {result.status === 'completed'
                    ? '🎓 All 3 revisions complete! This material is well-learned.'
                    : result.next_revision_day
                    ? `Next revision scheduled in ${result.next_revision_day} day${result.next_revision_day !== 1 ? 's' : ''}. Check your dashboard for updates.`
                    : 'Revision recorded. Check your dashboard for updates.'}
                </p>
              </div>

              <a
                href="/"
                style={{ ...styles.primaryBtn, display: 'block', textAlign: 'center', marginTop: 20, textDecoration: 'none' }}
              >
                Go to Dashboard
              </a>
            </div>
          )}
        </div>

        <p style={styles.footer}>
          Powered by AI Memory Augmentation System &nbsp;·&nbsp; Spaced Repetition
        </p>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
    fontFamily: "'Inter', sans-serif",
  },
  banner: {
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 24px',
    boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
  },
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '40px 20px 60px',
  },
  meta: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#1e293b',
    lineHeight: 1.3,
  },
  noteSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: 500,
  },
  revBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: '#eef2ff',
    color: '#4338ca',
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: 20,
    border: '1px solid #c7d2fe',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  card: {
    background: '#ffffff',
    borderRadius: 20,
    padding: '32px',
    boxShadow: '0 8px 40px rgba(99,102,241,0.1), 0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #e0e7ff',
  },
  qLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#6366f1',
    marginBottom: 12,
  },
  qText: {
    fontSize: 19,
    fontWeight: 600,
    color: '#1e293b',
    lineHeight: 1.6,
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 18px',
    borderRadius: 12,
    border: '2px solid',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: 15,
    width: '100%',
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'rgba(99,102,241,0.12)',
    color: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  textarea: {
    width: '100%',
    marginTop: 20,
    padding: '14px 16px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    fontSize: 15,
    color: '#1e293b',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.6,
    background: '#f8fafc',
    transition: 'border-color 0.15s',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    padding: '13px 28px',
    borderRadius: 12,
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
    textDecoration: 'none',
    width: '100%',
  },
  resultBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '18px 20px',
    borderRadius: 14,
    border: '1px solid',
    marginBottom: 20,
  },
  answerBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: '#16a34a',
    marginBottom: 6,
  },
  answerText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#14532d',
    lineHeight: 1.5,
  },
  reasonBox: {
    background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
    border: '1px solid #fde68a',
    borderRadius: 12,
    padding: '18px 20px',
    marginBottom: 16,
  },
  nextRevBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#eef2ff',
    borderRadius: 10,
    padding: '14px 16px',
    border: '1px solid #c7d2fe',
  },
  footer: {
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 36,
  },
};
