'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/auth';
import api from '@/lib/api';
import { User } from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATHS = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user from /users/me using the stored token
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get<User>('/user/me');
      setUser(res.data);
    } catch {
      setUser(null);
      authService.logout();
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  // Redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/answer');
    if (!user && !isPublic) {
      router.push('/login');
    } else if (user && PUBLIC_PATHS.includes(pathname)) {
      router.push('/');
    }
  }, [user, isLoading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    await authService.login({ email, password });
    await fetchUser();
    router.push('/');
  }, [fetchUser, router]);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    await authService.register({ email, password, full_name: fullName });
    // auto-login after register
    await authService.login({ email, password });
    await fetchUser();
    router.push('/');
  }, [fetchUser, router]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
