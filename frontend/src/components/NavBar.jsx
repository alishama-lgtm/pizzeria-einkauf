import React from 'react';

// Tabs je nach Rolle
const ALL_TABS = [
  { id: 'dashboard',       label: '📊 Dashboard',        roles: ['admin','manager','employee','kitchen'] },
  { id: 'inventory',       label: '📦 Inventory',         roles: ['admin','manager','employee','kitchen'] },
  { id: 'shopping-list',   label: '🛒 Shopping List',     roles: ['admin','manager','employee'] },
  { id: 'suppliers',       label: '🏭 Suppliers',         roles: ['admin','manager'] },
  { id: 'reports',         label: '📋 Reports',           roles: ['admin','manager'] },
  { id: 'analytics',       label: '📈 Analytics',         roles: ['admin'] },
  { id: 'user-management', label: '👥 User Management',   roles: ['admin'] },
  { id: 'settings',        label: '⚙️ Settings',          roles: ['admin'] },
];

export default function NavBar({ user, activeTab, onTabChange }) {
  const visibleTabs = ALL_TABS.filter(t => t.roles.includes(user?.role));

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-end gap-1 overflow-x-auto hide-scrollbar">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                border-b-3 transition-all duration-150
                ${activeTab === tab.id
                  ? 'text-[#8B0000] font-bold border-b-[3px] border-[#8B0000] bg-[#fff0ee] rounded-t-lg'
                  : 'text-gray-500 border-b-[3px] border-transparent hover:text-[#8B0000] hover:bg-[#fff5f5] rounded-t-lg'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
