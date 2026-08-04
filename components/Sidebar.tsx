'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileUp,
  FileText,
  HelpCircle,
  Clock,
  Bell,
  Search,
  Sparkles,
  LogOut,
  User,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: FileUp, label: 'Upload', href: '/upload' },
  { icon: FileText, label: 'Notes', href: '/notes' },
  { icon: HelpCircle, label: 'Questions', href: '/questions' },
  { icon: Clock, label: 'Reminders', href: '/reminders' },
  { icon: BarChart2, label: 'My Results', href: '/results' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div
      className="flex flex-col w-64 h-screen border-r"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: '2px 0 16px rgba(99,102,241,0.06)',
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--border-light)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1
            className="text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI Memory
          </h1>
        </div>
        <p className="text-xs font-medium ml-10" style={{ color: 'var(--text-muted)' }}>
          Student MVP
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium text-sm"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--primary-lighter)';
              el.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'transparent';
              el.style.color = 'var(--text-secondary)';
            }}
          >
            <item.icon className="w-4.5 h-4.5 transition-colors duration-200" style={{ color: 'var(--text-muted)' }} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border-light)' }}>
        {/* User info */}
        {user && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-light)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user.full_name || 'User'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          id="sidebar-logout-btn"
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        <div
          className="rounded-xl p-3"
          style={{ background: 'var(--primary-lighter)' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>✨ AI-Powered</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--primary-light)' }}>Your second brain is active</p>
        </div>
      </div>
    </div>
  );
}
