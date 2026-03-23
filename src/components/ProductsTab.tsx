import { useState } from 'react';
import { Product } from '../types';

interface Props {
  products: Product[];
  onUpdateStock: (id: string, newStock: number) => void;
}

function formatStock(value: number, unit: string): string {
  return `${value.toLocaleString('de-DE')} ${unit}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Grundzutaten: '#e8f4fd',
  Käse: '#fdf5e8',
  Belag: '#fde8e8',
  Gewürze: '#e8fdf0',
};

export default function ProductsTab({ products, onUpdateStock }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const lowCount = products.filter((p) => p.currentStock < p.minStock).length;

  function startEdit(product: Product) {
    setEditId(product.id);
    setEditValue(String(product.currentStock));
  }

  function commitEdit(product: Product) {
    const val = parseFloat(editValue.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      onUpdateStock(product.id, val);
    }
    setEditId(null);
  }

  return (
    <div>
      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            backgroundColor: '#f8f4f0',
            borderRadius: '10px',
            padding: '12px 20px',
            flex: 1,
            minWidth: '120px',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#222' }}>
            {products.length}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>Produkte gesamt</div>
        </div>
        <div
          style={{
            backgroundColor: lowCount > 0 ? '#fff3f2' : '#f0fdf4',
            borderRadius: '10px',
            padding: '12px 20px',
            flex: 1,
            minWidth: '120px',
            border: lowCount > 0 ? '1px solid #f5c6c2' : '1px solid #bbf7d0',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: lowCount > 0 ? '#c0392b' : '#16a34a',
            }}
          >
            {lowCount}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>Niedriger Bestand</div>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              marginBottom: '10px',
            }}
          >
            {category}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {products
              .filter((p) => p.category === category)
              .map((product) => {
                const isLow = product.currentStock < product.minStock;
                const pct = Math.min(
                  100,
                  (product.currentStock / product.minStock) * 100
                );
                const isEditing = editId === product.id;

                return (
                  <div
                    key={product.id}
                    style={{
                      backgroundColor: CATEGORY_COLORS[category] ?? '#f8f4f0',
                      border: isLow
                        ? '1px solid #f5c6c2'
                        : '1px solid transparent',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                    }}
                    onClick={() => !isEditing && startEdit(product)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#222',
                        }}
                      >
                        {product.name}
                      </span>
                      {isLow && (
                        <span style={{ fontSize: '13px' }}>⚠️</span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        height: '6px',
                        backgroundColor: '#e0d5c8',
                        borderRadius: '3px',
                        marginBottom: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: isLow ? '#e74c3c' : '#27ae60',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      <span>
                        Min: {formatStock(product.minStock, product.unit)}
                      </span>
                      {isEditing ? (
                        <div
                          style={{ display: 'flex', gap: '4px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit(product);
                              if (e.key === 'Escape') setEditId(null);
                            }}
                            style={{
                              width: '70px',
                              padding: '2px 6px',
                              border: '1px solid #c0392b',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          />
                          <button
                            onClick={() => commitEdit(product)}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: '#c0392b',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontWeight: 600,
                            color: isLow ? '#c0392b' : '#27ae60',
                          }}
                        >
                          {formatStock(product.currentStock, product.unit)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
