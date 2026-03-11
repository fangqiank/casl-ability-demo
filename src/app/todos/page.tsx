'use client';

import { TodoList } from '@/components/TodoList';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function TodosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin'
      ? 'bg-linear-to-r from-purple-500 to-pink-500'
      : 'bg-linear-to-r from-blue-500 to-cyan-500';
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-card border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-linear-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Todo App
              </h1>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              {/* User Badge */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {session.user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Signed in as</span>
                  <span className="text-sm font-medium text-gray-800 truncate max-w-37.5">
                    {session.user?.email}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getRoleBadgeColor(session.user?.role || 'user')}`}>
                  {session.user?.role}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 text-gray-600 hover:text-gray-800 hover:bg-white/80 transition-all duration-300"
                  aria-label="Home"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 text-red-500 hover:text-red-600 hover:bg-white/80 transition-all duration-300"
                  aria-label="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              My Todos
            </h2>
            <p className="text-gray-500">
              Manage your tasks efficiently with role-based permissions
            </p>
          </div>

          {/* Todo List */}
          <TodoList />
        </div>
      </main>
    </div>
  );
}
