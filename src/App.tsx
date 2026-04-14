import { useState } from 'react';
import { Product } from './types';
import { initialProducts, initialShops, initialPrices } from './data';
import ProductsTab from './components/ProductsTab';
import ShopsTab from './components/ShopsTab';
import KombisTab from './components/KombisTab';

type Tab = 'produkte' | 'geschaefte' | 'kombis';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'produkte', label: 'Produkte', icon: '📦' },
  { id: 'geschaefte', label: 'Geschäfte', icon: '🏪' },
  { id: 'kombis', label: 'Kombis', icon: '💡' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('kombis');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const shops = initialShops;
  const prices = initialPrices;

  const lowCount = products.filter((p) => p.currentStock < p.minStock).length;

  function handleUpdateStock(id: string, newStock: number) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, currentStock: newStock } : p))
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f0eb',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#c0392b',
          color: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '60px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🍕</span>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}>
              Pizzeria Einkauf
            </span>
          </div>
          {lowCount > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>⚠️</span>
              <span>{lowCount} Produkte brauchen Nachbestellung</span>
            </div>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0d5c8',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            padding: '0 24px',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'kombis' && lowCount > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 20px',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #c0392b' : '3px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#c0392b' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative',
                  transition: 'color 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {showBadge && (
                  <span
                    style={{
                      backgroundColor: '#c0392b',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '2px',
                    }}
                  >
                    {lowCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '28px 24px',
        }}
      >
        {activeTab === 'produkte' && (
          <ProductsTab products={products} onUpdateStock={handleUpdateStock} />
        )}
        {activeTab === 'geschaefte' && (
          <ShopsTab shops={shops} prices={prices} products={products} />
        )}
        {activeTab === 'kombis' && (
          <KombisTab products={products} shops={shops} prices={prices} />
        )}
      </main>
    </div>
  );
}
