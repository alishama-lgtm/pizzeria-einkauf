import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen.jsx';
import Header from './components/Header.jsx';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import ShoppingList from './pages/ShoppingList.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Reports from './pages/Reports.jsx';
import Analytics from './pages/Analytics.jsx';
import UserManagement from './pages/UserManagement.jsx';
import Settings from './pages/Settings.jsx';
import { getToken, getUser, clearAuth, isTokenExpired, verifyToken } from './api/auth.js';

const FIRST_TAB_BY_ROLE = {
  admin: 'dashboard',
  manager: 'dashboard',
  employee: 'dashboard',
  kitchen: 'dashboard',
};

function getPageForTab(tab, user) {
  switch(tab) {
    case 'dashboard':       return <Dashboard user={user} />;
    case 'inventory':       return <Inventory user={user} />;
    case 'shopping-list':   return <ShoppingList />;
    case 'suppliers':       return <Suppliers />;
    case 'reports':         return <Reports />;
    case 'analytics':       return <Analytics />;
    case 'user-management': return <UserManagement />;
    case 'settings':        return <Settings />;
    default:                return <Dashboard user={user} />;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      const savedUser = getUser();
      if (!token || !savedUser || isTokenExpired()) {
        clearAuth();
        setLoading(false);
        return;
      }
      // Verify with backend
      try {
        const res = await verifyToken(token);
        if (res.valid) {
          setUser(savedUser);
          setActiveTab(FIRST_TAB_BY_ROLE[savedUser.role] || 'dashboard');
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
      setLoading(false);
    }
    checkAuth();

    // Auto-logout check every minute
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        clearAuth();
        setUser(null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setActiveTab(FIRST_TAB_BY_ROLE[loggedInUser.role] || 'dashboard');
  }

  function handleLogout() {
    setUser(null);
    setActiveTab('dashboard');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fa]">
        <div className="text-center">
          <div className="text-5xl mb-4">🍕</div>
          <div className="text-gray-400 text-sm font-medium">Lade...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f8fa]">
      <Header user={user} onLogout={handleLogout} />
      <NavBar user={user} activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {getPageForTab(activeTab, user)}
      </main>
    </div>
  );
}
