'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import KnowledgeGraph, { GraphData } from '@/components/KnowledgeGraph';
import { Network, Sparkles, Clock, BookOpen, HelpCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function KnowledgeGraphPage() {
  const { data, isLoading, isError, refetch } = useQuery<GraphData>({
    queryKey: ['knowledge-graph'],
    queryFn: async () => {
      const res = await api.get<GraphData>('/notes/graph');
      return res.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Building your interactive Knowledge Graph...
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-center py-20">
        <Network className="w-16 h-16 mx-auto opacity-20" style={{ color: 'var(--primary)' }} />
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Could not load Knowledge Graph
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Make sure backend is running and you have uploaded materials.
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="flex items-center gap-2 mb-4 w-fit text-sm font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
            boxShadow: '0 8px 32px rgba(79,70,229,0.35)',
          }}
        >
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Network className="w-8 h-8" /> Interactive Knowledge Graph
            </h2>
            <p className="text-indigo-100 mt-2 text-base">
              Explore your Second Brain visually — nodes pulse when revisions are due!
            </p>
          </div>
          <div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Nodes', value: stats.total_nodes, icon: Network, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Notes & Materials', value: stats.total_notes, icon: BookOpen, color: '#8b5cf6', bg: '#f3e8ff' },
          { label: 'AI Concepts', value: stats.total_questions, icon: HelpCircle, color: '#06b6d4', bg: '#ecfeff' },
          { label: 'Revisions Due', value: stats.due_count, icon: Clock, color: '#d97706', bg: '#fffbeb' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 border flex items-center gap-4 transition-all hover:-translate-y-0.5"
            style={{ background: s.bg, borderColor: `${s.color}33`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: s.color, color: '#fff' }}
            >
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Knowledge Graph Component */}
      <KnowledgeGraph data={data} />
    </div>
  );
}
