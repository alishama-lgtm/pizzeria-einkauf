import React, { useState } from 'react';
import { login, saveAuth } from '../api/auth.js';

const QUICK_LOGINS = [
  { label: '👑 Admin',      user: 'admin',    pass: 'admin123',    color: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100' },
  { label: '🏢 Manager',    user: 'manager',  pass: 'manager123',  color: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100' },
  { label: '👤 Mitarbeiter',user: 'employee', pass: 'employee123', color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' },
  { label: '👨‍🍳 Küche',     user: 'kitchen', pass: 'kitchen123',  color: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100' },
];

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await login(username, password);
      saveAuth(token, user);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuick(u, p) {
    setUsername(u);
    setPassword(p);
    setError('');
    setLoading(true);
    try {
      const { token, user } = await login(u, p);
      saveAuth(token, user);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff8f6] to-[#ffe4e0] p-4">
      <div className="bg-white rounded-3xl border border-[#e3beb8] shadow-2xl p-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-5xl">🍕</span>
          <div>
            <div className="font-extrabold text-2xl text-[#8B0000] leading-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
              Pizzeria San Carino
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">Management System</div>
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-[#261816] mb-1" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
          Willkommen 👋
        </h2>
        <p className="text-sm text-gray-500 mb-6">Melde dich mit deinen Zugangsdaten an.</p>

        {/* Error */}
        {error && (
          <div className="bg-[#ffdad6] text-[#93000a] rounded-xl px-4 py-3 text-sm font-semibold mb-4">
            ❌ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="z.B. admin"
              autoComplete="username"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:border-[#8B0000] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 text-sm font-medium focus:border-[#8B0000] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#8B0000] hover:bg-[#6a0000] text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? '⏳ Prüfe...' : '→ Anmelden'}
          </button>
        </form>

        {/* Quick logins */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Schnell-Anmeldung
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LOGINS.map(q => (
              <button
                key={q.user}
                onClick={() => handleQuick(q.user, q.pass)}
                disabled={loading}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-60 ${q.color}`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
