'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/todos');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decoration shapes */}
      <div className="floating-shape w-72 h-72 bg-orange-300/30 -top-20 -left-20" style={{ animationDelay: '0s' }} />
      <div className="floating-shape w-96 h-96 bg-purple-300/30 -bottom-32 -right-32" style={{ animationDelay: '-5s' }} />
      <div className="floating-shape w-64 h-64 bg-pink-300/30 top-1/2 left-1/4" style={{ animationDelay: '-10s' }} />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card-strong rounded-3xl p-8 sm:p-10 fade-in-up">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6 fade-in-up delay-100">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8 fade-in-up delay-200">
            <h1 className="text-3xl font-bold bg-linear-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="mt-2 text-gray-500 text-sm">Sign in to manage your todos</p>
          </div>

          {/* Demo Accounts */}
          <div className="mb-6 p-4 bg-linear-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100 fade-in-up delay-300">
            <p className="text-xs font-medium text-gray-600 mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Admin:</span>
                <span className="font-mono bg-white/60 px-2 py-0.5 rounded">admin@example.com / admin123</span>
              </div>
              <div className="flex items-center justify-between">
                <span>User:</span>
                <span className="font-mono bg-white/60 px-2 py-0.5 rounded">user@example.com / user123</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 fade-in-up delay-400">
            {error && (
              <div className="p-3 bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </>
                )}
              </button>

              <Link
                href="/"
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Home
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6 fade-in-up delay-500">
          Powered by Next.js + NextAuth + CASL
        </p>
      </div>
    </div>
  );
}
