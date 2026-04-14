import React from 'react';
import { clearAuth } from '../api/auth.js';

const ROLE_BADGES = {
  admin:    { label: '👑 ADMIN',      cls: 'bg-red-100 text-red-800 border border-red-200' },
  manager:  { label: '🏢 MANAGER',    cls: 'bg-orange-100 text-orange-800 border border-orange-200' },
  employee: { label: '👤 MITARBEITER',cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
  kitchen:  { label: '👨‍🍳 KÜCHE',     cls: 'bg-green-100 text-green-800 border border-green-200' },
};

export default function Header({ user, onLogout }) {
  const badge = ROLE_BADGES[user?.role] || ROLE_BADGES.employee;

  function handleLogout() {
    clearAuth();
    onLogout();
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-3xl">🍕</span>
          <div>
            <div className="font-extrabold text-lg text-[#8B0000] leading-tight" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
              Pizzeria San Carino
            </div>
            <div className="text-xs text-gray-400 hidden sm:block">Management System</div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ${badge.cls}`}>
            {badge.label}
          </span>

          {/* Username */}
          <span className="text-sm font-semibold text-gray-600 hidden md:block">
            {user?.full_name || user?.username}
          </span>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <span>→</span>
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </div>
    </header>
  );
}
