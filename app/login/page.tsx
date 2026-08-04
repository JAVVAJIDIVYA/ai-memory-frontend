'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2, AlertCircle, Sparkles, Brain, Zap, BookOpen } from 'lucide-react';

type ApiError = { response?: { data?: { detail?: string } } };

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr?.response?.data?.detail ?? 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Animated background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-container">
        {/* Left panel – branding */}
        <div className="auth-brand-panel">
          <div className="auth-brand-inner">
            <div className="auth-logo-wrap">
              <div className="auth-logo-icon">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="auth-logo-text">AI Memory</span>
            </div>
            <h1 className="auth-brand-headline">
              Your intelligent<br />second brain
            </h1>
            <p className="auth-brand-sub">
              Capture, organise, and recall knowledge effortlessly with AI-powered memory augmentation.
            </p>

            <div className="auth-features">
              {[
                { icon: Brain, label: 'Smart recall', desc: 'AI surfaces what you need, when you need it' },
                { icon: Zap, label: 'Instant insights', desc: 'Auto-generated questions & summaries' },
                { icon: BookOpen, label: 'Study smarter', desc: 'Spaced-repetition reminders built in' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <Icon className="w-4 h-4" style={{ color: '#a5b4fc' }} />
                  </div>
                  <div>
                    <p className="auth-feature-label">{label}</p>
                    <p className="auth-feature-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel – form */}
        <div className="auth-form-panel">
          <div className="auth-card">
            {/* Card header */}
            <div className="auth-card-header">
              <h2 className="auth-card-title">Welcome back</h2>
              <p className="auth-card-sub">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email */}
              <div className="auth-field">
                <label htmlFor="login-email" className="auth-label">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-password" className="auth-label">Password</label>
                </div>
                <div className="auth-input-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input auth-input-pw"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="auth-eye-btn"
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="auth-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="auth-submit-btn"
                id="login-submit-btn"
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
                  : 'Sign In'}
              </button>
            </form>

            <p className="auth-switch">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="auth-switch-link">Create one free</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{authStyles}</style>
    </div>
  );
}

const authStyles = `
  .auth-root {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: stretch;
    background: #0f0c29;
    position: relative;
    overflow: hidden;
  }

  /* Animated blobs */
  .auth-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.35;
    animation: blobFloat 8s ease-in-out infinite alternate;
  }
  .auth-blob-1 {
    width: 520px; height: 520px;
    background: radial-gradient(circle, #6366f1, #8b5cf6);
    top: -160px; left: -160px;
    animation-delay: 0s;
  }
  .auth-blob-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, #3b82f6, #6366f1);
    bottom: -100px; left: 30%;
    animation-delay: 2.5s;
  }
  .auth-blob-3 {
    width: 320px; height: 320px;
    background: radial-gradient(circle, #8b5cf6, #ec4899);
    top: 40%; right: -80px;
    animation-delay: 5s;
  }
  @keyframes blobFloat {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(30px, 40px) scale(1.08); }
  }

  /* Layout */
  .auth-container {
    display: flex;
    width: 100%;
    min-height: 100vh;
    position: relative;
    z-index: 1;
  }

  /* Left brand panel */
  .auth-brand-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
  }
  @media (max-width: 768px) { .auth-brand-panel { display: none; } }

  .auth-brand-inner { max-width: 400px; }

  .auth-logo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 40px;
  }
  .auth-logo-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(99,102,241,0.45);
  }
  .auth-logo-text {
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .auth-brand-headline {
    font-size: 42px;
    font-weight: 800;
    color: #fff;
    line-height: 1.15;
    letter-spacing: -1px;
    margin-bottom: 16px;
  }
  .auth-brand-sub {
    font-size: 15px;
    color: #a5b4fc;
    line-height: 1.65;
    margin-bottom: 40px;
  }

  .auth-features { display: flex; flex-direction: column; gap: 20px; }
  .auth-feature-item {
    display: flex; align-items: flex-start; gap: 14px;
  }
  .auth-feature-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: rgba(99,102,241,0.18);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(165,180,252,0.15);
  }
  .auth-feature-label {
    font-size: 14px; font-weight: 700; color: #e0e7ff; margin-bottom: 2px;
  }
  .auth-feature-desc { font-size: 13px; color: #818cf8; }

  /* Right form panel */
  .auth-form-panel {
    width: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 32px;
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(24px);
    border-left: 1px solid rgba(255,255,255,0.08);
  }
  @media (max-width: 768px) {
    .auth-form-panel { width: 100%; border-left: none; }
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    padding: 40px 36px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1);
  }

  .auth-card-header { margin-bottom: 32px; }
  .auth-card-title {
    font-size: 26px; font-weight: 800; color: #fff;
    letter-spacing: -0.5px; margin-bottom: 6px;
  }
  .auth-card-sub { font-size: 14px; color: #818cf8; }

  .auth-form { display: flex; flex-direction: column; gap: 20px; }
  .auth-field { display: flex; flex-direction: column; gap: 8px; }

  .auth-label-row {
    display: flex; align-items: center; justify-content: space-between;
  }
  .auth-label {
    font-size: 13px; font-weight: 600; color: #c7d2fe;
  }

  .auth-input {
    width: 100%;
    padding: 13px 16px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.07);
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .auth-input::placeholder { color: rgba(255,255,255,0.25); }
  .auth-input:focus {
    border-color: #6366f1;
    background: rgba(99,102,241,0.08);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.22);
  }
  .auth-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .auth-input-wrap { position: relative; }
  .auth-input-pw { padding-right: 48px; }
  .auth-eye-btn {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    color: rgba(255,255,255,0.35);
    background: none; border: none; cursor: pointer; padding: 0;
    transition: color 0.15s;
  }
  .auth-eye-btn:hover { color: #a5b4fc; }

  .auth-error {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px;
    border-radius: 10px;
    background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.3);
    color: #fca5a5;
    font-size: 13px;
  }

  .auth-submit-btn {
    display: flex; align-items: center; justify-content: center; gap-8px;
    gap: 8px;
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 6px 20px rgba(99,102,241,0.45);
    margin-top: 4px;
  }
  .auth-submit-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 10px 28px rgba(99,102,241,0.55);
  }
  .auth-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .auth-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .auth-switch {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
    color: #818cf8;
  }
  .auth-switch-link {
    color: #a5b4fc;
    font-weight: 700;
    text-decoration: none;
    transition: color 0.15s;
  }
  .auth-switch-link:hover { color: #fff; }
`;
