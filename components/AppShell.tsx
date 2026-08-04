'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const AUTH_PATHS = ['/login', '/register'];
const PUBLIC_PATHS_PREFIX = ['/answer'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useAuth();
  const isAuthPage = AUTH_PATHS.includes(pathname);
  const isPublicPage = PUBLIC_PATHS_PREFIX.some((p) => pathname.startsWith(p));

  // Show a minimal full-screen loader while session is being restored
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0c29',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
            }}
          >
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
          <p style={{ color: '#818cf8', fontSize: 14, fontWeight: 600 }}>Loading…</p>
        </div>
      </div>
    );
  }

  // Public pages (e.g. email answer link): render without any auth or shell
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Auth pages: render full-screen without any shell
  if (isAuthPage) {
    return <>{children}</>;
  }

  // App pages: render with sidebar + topbar
  return (
    <div className="flex h-screen" style={{ background: 'var(--background)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--background)' }}>
        {/* Topbar */}
        <div
          className="sticky top-0 z-10 flex justify-between items-center px-8 py-4 border-b"
          style={{
            background: 'rgba(240, 244, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            AI Memory Augmentation
          </p>
          <NotificationBell />
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
