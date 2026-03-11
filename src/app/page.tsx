import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decoration shapes */}
      <div className="floating-shape w-96 h-96 bg-orange-300/30 -top-32 -left-32" style={{ animationDelay: '0s' }} />
      <div className="floating-shape w-md h-112 bg-purple-300/30 -bottom-40 -right-40" style={{ animationDelay: '-7s' }} />
      <div className="floating-shape w-72 h-72 bg-pink-300/30 top-1/3 right-1/4" style={{ animationDelay: '-14s' }} />

      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-linear-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Next.js Ability Demo
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A modern todo app showcasing role-based permissions using CASL Ability library
          </p>
        </div>

        {/* Features Card */}
        <div className="glass-card-strong rounded-3xl p-8 mb-8 fade-in-up delay-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Features
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '👥', title: 'Role-based Permissions', desc: 'Admin, User, and Guest roles with different access levels' },
              { icon: '🔒', title: 'Field-level Control', desc: 'Granular permissions down to specific fields' },
              { icon: '🎨', title: 'Dynamic UI', desc: 'Interface adapts based on user permissions' },
              { icon: '⚡', title: 'Server-side Checks', desc: 'All API calls protected with authorization' },
              { icon: '🗄️', title: 'Data Layer Security', desc: 'Built-in authorization in data access layer' },
              { icon: '✨', title: 'Modern Design', desc: 'Beautiful glassmorphism UI with smooth animations' },
            ].map((feature, index) => (
              <div key={index} className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/40 hover:bg-white/70 transition-all duration-300">
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="font-semibold text-gray-900 mt-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-6 fade-in-up delay-200 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Admin</h3>
            <p className="text-sm text-gray-600">Manage all todos but cannot modify titles</p>
          </div>

          <div className="glass-card rounded-2xl p-6 fade-in-up delay-300 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">User</h3>
            <p className="text-sm text-gray-600">Manage own todos, read public todos</p>
          </div>

          <div className="glass-card rounded-2xl p-6 fade-in-up delay-400 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-linear-to-r from-gray-400 to-gray-500 flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Guest</h3>
            <p className="text-sm text-gray-600">Read-only access to public todos</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up delay-500">
          <Link
            href="/login"
            className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login to Demo
          </Link>
          <Link
            href="/todos"
            className="btn-secondary flex items-center justify-center gap-2 text-lg px-8 py-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Go to Todo App
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-12 fade-in-up delay-500">
          Powered by Next.js 16 • React 19 • NextAuth • CASL • Tailwind CSS 4
        </p>
      </div>
    </div>
  );
}
