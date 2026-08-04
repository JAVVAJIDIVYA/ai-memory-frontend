'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, FileText, Globe, Mic, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { searchService } from '@/services/search';
import { SearchResult } from '@/types/note';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'semantic' | 'hybrid'>('semantic');
  const [hasSearched, setHasSearched] = useState(false);

  const { data: results = [], isLoading, refetch } = useQuery<SearchResult[]>({
    queryKey: ['search', query, searchMode],
    queryFn: async () => {
      if (!query.trim()) return [];
      if (searchMode === 'semantic') return searchService.semanticSearch(query);
      else return searchService.hybridSearch(query);
    },
    enabled: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { setHasSearched(true); refetch(); }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': case 'text': return FileText;
      case 'youtube': case 'link': return Globe;
      case 'voice': return Mic;
      default: return FileText;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/" className="flex items-center gap-2 mb-4 w-fit text-sm font-medium transition-colors" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Semantic Search</h2>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Search your knowledge base by meaning, not just keywords.</p>
      </div>

      {/* Search Box */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Ask anything about your notes..."
              className="w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all text-lg"
              style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setSearchMode('semantic')}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={searchMode === 'semantic'
                  ? { background: 'var(--primary)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }
                  : { color: 'var(--text-secondary)' }}
              >
                Semantic
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('hybrid')}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={searchMode === 'hybrid'
                  ? { background: 'var(--primary)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }
                  : { color: 'var(--text-secondary)' }}
              >
                Hybrid
              </button>
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</> : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Found <strong>{results.length}</strong> relevant results:
              </p>
              <div className="space-y-4">
                {results.map((result) => {
                  const Icon = getContentTypeIcon(result.content_type);
                  return (
                    <Link
                      key={result.id}
                      href={`/notes/${result.id}`}
                      className="block rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 group"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ background: 'var(--primary-lighter)' }}
                        >
                          <Icon className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>
                              {result.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#ecfdf5', color: '#059669' }}>
                              {(result.similarity * 100).toFixed(0)}% match
                            </span>
                          </div>
                          {result.subject && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{result.subject}</span>
                              {result.topic && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#f3e8ff', color: '#7c3aed' }}>{result.topic}</span>}
                            </div>
                          )}
                          <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {result.short_summary || result.content}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div
              className="text-center py-12 rounded-3xl border border-dashed"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              No results found. Try a different search query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
