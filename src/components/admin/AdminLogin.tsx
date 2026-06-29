import { useState } from 'react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (res.ok) {
        window.location.href = '/admin/dashboard';
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full h-12 rounded-[var(--radius-field)] border border-[var(--hairline)] bg-base-100 px-4 text-sm text-base-content outline-none transition-colors focus:border-[var(--cta)] focus:ring-2 focus:ring-[var(--cta)]/15';
  const labelCls = 'block text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-base-content/55 mb-2';

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <img src="/images/logo-mark.png" alt="Pavlova Love Tampa" className="h-24 w-auto mx-auto mb-2" />
        <p className="text-[0.65rem] tracking-[0.3em] uppercase text-[var(--rose)] font-semibold">Admin Panel</p>
      </div>

      <div className="bg-base-100 rounded-[var(--radius-box)] border border-[var(--hairline)] shadow-[var(--shadow-lift)]">
        <div className="p-8">
          <h2 className="font-serif text-2xl font-semibold text-base-content mb-1">Welcome back</h2>
          <p className="text-sm text-base-content/55 mb-6">Sign in to manage your shop.</p>

          {error && (
            <div className="flex items-center gap-2 mb-5 rounded-[var(--radius-field)] border border-[var(--cta)]/30 bg-[var(--cta)]/5 px-4 py-3 text-sm text-[var(--cta)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelCls}>Username</label>
              <input
                type="text"
                className={inputCls}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="admin"
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[var(--cta)] text-white text-[0.72rem] font-bold tracking-[0.2em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[var(--cta-hover)] transition-colors shadow-lg shadow-[var(--cta)]/20 disabled:opacity-60"
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-sm"></span>}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      <p className="text-center mt-6 text-sm text-base-content/40">
        <a href="/" className="hover:text-[var(--cta)] transition-colors">← Back to site</a>
      </p>
    </div>
  );
}
