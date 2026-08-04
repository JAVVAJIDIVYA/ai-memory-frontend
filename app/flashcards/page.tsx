'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, ArrowLeft, Loader2, CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { flashcardsService } from '@/services/flashcards';
import { Flashcard } from '@/types/note';

export default function FlashcardsPage() {
  const queryClient = useQueryClient();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: dueCards = [], isLoading: isLoadingDue } = useQuery<Flashcard[]>({
    queryKey: ['flashcards', 'due'],
    queryFn: () => flashcardsService.getDueFlashcards(),
  });

  const { data: allCards = [], isLoading: isLoadingAll } = useQuery<Flashcard[]>({
    queryKey: ['flashcards', 'all'],
    queryFn: () => flashcardsService.getFlashcards(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, quality }: { id: number; quality: number }) =>
      flashcardsService.reviewFlashcard(id, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      setIsFlipped(false);
      setCurrentCardIndex(prev => prev + 1);
    },
  });

  const currentCard = dueCards[currentCardIndex];

  const qualityButtons = [
    { quality: 0, label: 'Again', bg: '#fef2f2', color: '#dc2626', hoverBg: '#dc2626' },
    { quality: 1, label: 'Hard', bg: '#fff7ed', color: '#d97706', hoverBg: '#d97706' },
    { quality: 3, label: 'Good', bg: '#eff6ff', color: '#2563eb', hoverBg: '#2563eb' },
    { quality: 5, label: 'Easy', bg: '#ecfdf5', color: '#059669', hoverBg: '#059669' },
  ];

  if (isLoadingDue || isLoadingAll) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/" className="flex items-center gap-2 mb-4 w-fit text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Layers className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          Flashcards
        </h2>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          {dueCards.length > 0
            ? `You have ${dueCards.length} cards due for review.`
            : 'All caught up! No cards due right now.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Due Today', value: dueCards.length, color: 'var(--primary)', bg: 'var(--primary-lighter)' },
          { label: 'Total Cards', value: allCards.length, color: '#7c3aed', bg: '#f3e8ff' },
          { label: 'In Learning', value: allCards.filter(c => c.repetitions > 0).length, color: '#059669', bg: '#ecfdf5' },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border p-6 text-center"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
            <div className="text-sm mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Flashcard Area */}
      {dueCards.length > 0 && currentCardIndex < dueCards.length && currentCard ? (
        <div className="space-y-6">
          <div className="text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Card {currentCardIndex + 1} of {dueCards.length}
          </div>

          <div
            className="relative w-full h-96 perspective-1000 cursor-pointer"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-600 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            >
              {/* Front */}
              <div
                className="absolute w-full h-full backface-hidden rounded-3xl p-8 flex flex-col items-center justify-center border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div className="text-2xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
                  {currentCard.front}
                </div>
                {!isFlipped && (
                  <div
                    className="text-sm mt-4 px-4 py-2 rounded-full font-medium"
                    style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}
                  >
                    Click to reveal answer
                  </div>
                )}
              </div>

              {/* Back */}
              <div
                className="absolute w-full h-full backface-hidden rounded-3xl p-8 flex flex-col items-center justify-center border rotate-y-180"
                style={{
                  background: 'linear-gradient(135deg, #f0f4ff, #e0e7ff)',
                  borderColor: 'var(--primary-light)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div className="text-xl text-center whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {currentCard.back}
                </div>
              </div>
            </div>
          </div>

          {isFlipped && (
            <div className="flex justify-center gap-3 flex-wrap">
              {qualityButtons.map((button) => (
                <button
                  key={button.quality}
                  onClick={() => reviewMutation.mutate({ id: currentCard.id, quality: button.quality })}
                  disabled={reviewMutation.isPending}
                  className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 border"
                  style={{ background: button.bg, color: button.color, borderColor: button.color + '40' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = button.hoverBg;
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = button.bg;
                    (e.currentTarget as HTMLElement).style.color = button.color;
                  }}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className="text-center py-16 rounded-3xl border border-dashed"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-secondary)' }}
        >
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#059669' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>All caught up!</h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            You&apos;ve reviewed all your due flashcards for today. Great job!
          </p>
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            <Zap className="w-4 h-4" />
            Add more notes
          </Link>
        </div>
      )}

      {/* All Cards */}
      {allCards.length > 0 && (
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
        >
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>All Flashcards</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {allCards.map((card) => (
              <div
                key={card.id}
                className="rounded-xl border p-4 transition-all"
                style={{ background: 'var(--surface-secondary)', borderColor: 'var(--border-light)' }}
              >
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{card.front}</div>
                <div className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{card.back}</div>
                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Interval: {card.interval} days</span>
                  <span>Repetitions: {card.repetitions}</span>
                  <span>Next: {new Date(card.next_review_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
