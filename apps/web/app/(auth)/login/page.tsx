'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGitHub } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/campaigns';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      router.push(redirectTo);
    }
  }

  async function handleGitHub() {
    const { error: err } = await signInWithGitHub();
    if (err) setError(err);
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="text-center">
        <h1 className="font-display text-4xl tracking-wider text-[var(--accent-primary)]">THE HEIST</h1>
        <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[var(--text-secondary)]">by New World Coding</p>
        <p className="mt-4 text-xs uppercase tracking-widest text-[var(--text-secondary)]">Classified Access Required</p>
      </div>

      {error && (
        <div className="rounded-tactical border border-[var(--danger)] bg-red-900/20 px-4 py-3 text-sm text-[var(--danger)] font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] focus:shadow-[0_0_8px_var(--accent-glow)]"
            placeholder="operative@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] focus:shadow-[0_0_8px_var(--accent-glow)]"
            placeholder="********"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-amber w-full text-sm"
        >
          {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[var(--bg-primary)] px-2 text-[var(--text-secondary)] text-xs">or</span>
        </div>
      </div>

      <button
        onClick={handleGitHub}
        className="flex w-full items-center justify-center gap-2 rounded-tactical border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        Continue with GitHub
      </button>

      <p className="text-center text-xs text-[var(--text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 bg-[var(--bg-primary)]">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(var(--text-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--text-secondary) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative z-10">
        <Suspense fallback={<div className="text-[var(--text-secondary)] font-mono">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
