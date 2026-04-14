import React from 'react';
export default function Dashboard({ user }) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-extrabold text-[#1e1e2e] mb-2" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
        Dashboard
      </h1>
      <p className="text-gray-400 text-sm mb-8">Willkommen zurück, {user?.full_name}!</p>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
        <div className="text-4xl mb-3">📊</div>
        <div className="font-bold text-lg text-gray-500">Dashboard — wird in Phase 2 gebaut</div>
        <div className="text-sm mt-2">Hier kommen Stats, Activity Feed und Quick Actions</div>
      </div>
    </div>
  );
}
