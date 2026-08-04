'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Sparkles, Brain, Zap, BookOpen } from 'lucide-react';

type ApiError = { response?: { data?: { detail?: string } } };

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['#ef4444', '#f59e0b', '#10b981'];
  const labels = ['Weak', 'Fair', 'Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 4,
              background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {checks.map(({ label, ok }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: ok ? '#6ee7b7' : 'rgba(255,255,255,0.3)' }}>
              <CheckCircle2 style={{ width: 11, height: 11 }} />
              {label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: colors[score - 1] }}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsLoading(true);
    try {
      await register(email, password, fullName || undefined);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr?.response?.data?.detail ?? 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <div className="auth-root">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-container">
        {/* Left brand panel */}
        <div className="auth-brand-panel">
          <div className="auth-brand-inner">
            <div className="auth-logo-wrap">
              <div className="auth-logo-icon">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="auth-logo-text">AI Memory</span>
            </div>
            <h1 className="auth-brand-headline">
              Start building<br />your second brain
            </h1>
            <p className="auth-brand-sub">
              Join thousands of students who supercharge their learning with AI-powered memory augmentation.
            </p>

            <div className="auth-features">
              {[
                { icon: Brain, label: 'AI-powered notes', desc: 'Auto-summarise and extract key concepts' },
                { icon: Zap, label: 'Smart questions', desc: 'Practice questions generated instantly' },
                { icon: BookOpen, label: 'Spaced repetition', desc: "Never forget what you've learned" },
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

        {/* Right form panel */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Create your account</h2>
              <p className="auth-card-sub">Free forever. No credit card required.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Full Name */}
              <div className="auth-field">
                <label htmlFor="reg-name" className="auth-label">Full name <span style={{ color: '#6366f1', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="auth-input"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div className="auth-field">
                <label htmlFor="reg-email" className="auth-label">Email address</label>
                <input
                  id="reg-email"
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
                <label htmlFor="reg-password" className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input auth-input-pw"
                    disabled={isLoading}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="auth-eye-btn" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label htmlFor="reg-confirm" className="auth-label">Confirm password</label>
                <div className="auth-input-wrap">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`auth-input auth-input-pw ${confirmPassword && (passwordsMatch ? 'auth-input-valid' : 'auth-input-invalid')}`}
                    disabled={isLoading}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="auth-eye-btn" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {confirmPassword && (
                    <div className="auth-match-icon">
                      {passwordsMatch
                        ? <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} />
                        : <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />}
                    </div>
                  )}
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
                disabled={isLoading || !email || !password || !confirmPassword}
                className="auth-submit-btn"
                id="register-submit-btn"
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
                  : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link href="/login" className="auth-switch-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{registerStyles}</style>
    </div>
  );
}

const registerStyles = `
  .auth-root {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: stretch;
    background: #0f0c29;
    position: relative;
    overflow: hidden;
  }
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
    0%   { transform: translate(0,0) scale(1); }
    100% { transform: translate(30px,40px) scale(1.08); }
  }
  .auth-container {
    display: flex;
    width: 100%;
    min-height: 100vh;
    position: relative;
    z-index: 1;
  }
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
    display: flex; align-items: center; gap: 12px; margin-bottom: 40px;
  }
  .auth-logo-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(99,102,241,0.45);
  }
  .auth-logo-text {
    font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.5px;
  }
  .auth-brand-headline {
    font-size: 42px; font-weight: 800; color: #fff;
    line-height: 1.15; letter-spacing: -1px; margin-bottom: 16px;
  }
  .auth-brand-sub {
    font-size: 15px; color: #a5b4fc; line-height: 1.65; margin-bottom: 40px;
  }
  .auth-features { display: flex; flex-direction: column; gap: 20px; }
  .auth-feature-item { display: flex; align-items: flex-start; gap: 14px; }
  .auth-feature-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(99,102,241,0.18);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(165,180,252,0.15);
  }
  .auth-feature-label { font-size: 14px; font-weight: 700; color: #e0e7ff; margin-bottom: 2px; }
  .auth-feature-desc { font-size: 13px; color: #818cf8; }

  .auth-form-panel {
    width: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 32px;
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(24px);
    border-left: 1px solid rgba(255,255,255,0.08);
    overflow-y: auto;
  }
  @media (max-width: 768px) { .auth-form-panel { width: 100%; border-left: none; } }

  .auth-card {
    width: 100%;
    max-width: 400px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    padding: 36px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1);
  }
  .auth-card-header { margin-bottom: 28px; }
  .auth-card-title {
    font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 6px;
  }
  .auth-card-sub { font-size: 13px; color: #818cf8; }

  .auth-form { display: flex; flex-direction: column; gap: 18px; }
  .auth-field { display: flex; flex-direction: column; gap: 7px; }
  .auth-label { font-size: 13px; font-weight: 600; color: #c7d2fe; }

  .auth-input {
    width: 100%;
    padding: 12px 16px;
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
  .auth-input-valid { border-color: #10b981 !important; }
  .auth-input-invalid { border-color: #ef4444 !important; }

  .auth-input-wrap { position: relative; }
  .auth-input-pw { padding-right: 80px; }
  .auth-eye-btn {
    position: absolute; right: 42px; top: 50%; transform: translateY(-50%);
    color: rgba(255,255,255,0.35);
    background: none; border: none; cursor: pointer; padding: 0;
    transition: color 0.15s;
  }
  .auth-eye-btn:hover { color: #a5b4fc; }
  .auth-match-icon {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  }

  .auth-error {
    display: flex; align-items: center; gap: 8px;
    padding: 11px 14px;
    border-radius: 10px;
    background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.3);
    color: #fca5a5;
    font-size: 13px;
  }

  .auth-submit-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
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
    text-align: center; margin-top: 22px; font-size: 13px; color: #818cf8;
  }
  .auth-switch-link {
    color: #a5b4fc; font-weight: 700; text-decoration: none; transition: color 0.15s;
  }
  .auth-switch-link:hover { color: #fff; }
`;
