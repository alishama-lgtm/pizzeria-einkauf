import React from 'react';
export default function Inventory({ user }) {
  const readOnly = user?.role === 'kitchen';
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-extrabold text-[#1e1e2e] mb-2" style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}>
        Inventory {readOnly && <span className="text-sm font-normal text-gray-400 ml-2">(Nur Lesen)</span>}
      </h1>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
        <div className="text-4xl mb-3">📦</div>
        <div className="font-bold text-lg text-gray-500">Inventory — wird in Phase 2 gebaut</div>
      </div>
    </div>
  );
}
