import { useMemo } from 'react';
import { Product, Shop, Price, ShoppingCombination } from '../types';
import { calculateCombinations } from '../utils/combinations';

interface Props {
  products: Product[];
  shops: Shop[];
  prices: Price[];
}

function formatPrice(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function ShopBadge({ shop }: { shop: Shop }) {
  return (
    <span
      style={{
        backgroundColor: shop.color,
        color: '#fff',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
    >
      {shop.name}
    </span>
  );
}

function CombinationCard({
  combo,
  rank,
}: {
  combo: ShoppingCombination;
  rank: number;
}) {
  const shopMap = new Map(combo.shops.map((s) => [s.id, s]));

  // Group items by shop
  const byShop = new Map<string, typeof combo.items>();
  for (const item of combo.items) {
    const list = byShop.get(item.shop.id) ?? [];
    list.push(item);
    byShop.set(item.shop.id, list);
  }

  return (
    <div
      style={{
        border: combo.isRecommended ? '2px solid #c0392b' : '1px solid #e0d5c8',
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: combo.isRecommended ? '#fff9f8' : '#fff',
        position: 'relative',
        boxShadow: combo.isRecommended
          ? '0 4px 16px rgba(192,57,43,0.15)'
          : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Rank + EMPFOHLEN */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: rank === 1 ? '#c0392b' : '#8d8d8d',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            {rank}
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {combo.shops.map((shop) => (
              <ShopBadge key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
        {combo.isRecommended && (
          <span
            style={{
              backgroundColor: '#c0392b',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
            }}
          >
            ★ Empfohlen
          </span>
        )}
      </div>

      {/* Items grouped by shop */}
      {Array.from(byShop.entries()).map(([shopId, items]) => {
        const shop = shopMap.get(shopId)!;
        const shopTotal = items.reduce((s, i) => s + i.totalCost, 0);
        return (
          <div key={shopId} style={{ marginBottom: '12px' }}>
            {combo.numShops > 1 && (
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: shop.color,
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>@ {shop.name}</span>
                <span>{formatPrice(shopTotal)}</span>
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product.id}>
                    <td
                      style={{
                        padding: '3px 0',
                        fontSize: '13px',
                        color: '#444',
                      }}
                    >
                      {item.product.name}
                    </td>
                    <td
                      style={{
                        padding: '3px 0',
                        fontSize: '13px',
                        color: '#666',
                        textAlign: 'center',
                      }}
                    >
                      {item.quantity} {item.product.unit}
                    </td>
                    <td
                      style={{
                        padding: '3px 0',
                        fontSize: '12px',
                        color: '#888',
                        textAlign: 'right',
                      }}
                    >
                      {formatPrice(item.pricePerUnit)}/{item.product.unit}
                    </td>
                    <td
                      style={{
                        padding: '3px 0 3px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#333',
                        textAlign: 'right',
                      }}
                    >
                      {formatPrice(item.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Divider + Total */}
      <div
        style={{
          borderTop: '1px solid #e0d5c8',
          paddingTop: '12px',
          marginTop: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '13px', color: '#666' }}>Gesamt</span>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: combo.isRecommended ? '#c0392b' : '#222',
          }}
        >
          {formatPrice(combo.totalCost)}
        </span>
      </div>
    </div>
  );
}

export default function KombisTab({ products, shops, prices }: Props) {
  const { singleShop, twoShop, hasLowStock } = useMemo(
    () => calculateCombinations(products, shops, prices),
    [products, shops, prices]
  );

  const lowStockProducts = products.filter((p) => p.currentStock < p.minStock);

  if (!hasLowStock) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
          Alle Bestände in Ordnung
        </h3>
        <p style={{ fontSize: '14px' }}>
          Momentan hat kein Produkt niedrigen Bestand. Sobald Produkte unter ihr
          Minimum fallen, erscheinen hier die günstigsten Einkaufskombinationen.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Low stock summary */}
      <div
        style={{
          backgroundColor: '#fff3f2',
          border: '1px solid #f5c6c2',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div>
          <strong style={{ fontSize: '14px', color: '#c0392b' }}>
            {lowStockProducts.length} Produkte mit niedrigem Bestand:
          </strong>
          <span style={{ fontSize: '13px', color: '#555', marginLeft: '8px' }}>
            {lowStockProducts.map((p) => p.name).join(' · ')}
          </span>
        </div>
      </div>

      {/* Two-shop section */}
      {twoShop.length > 0 && (
        <section style={{ marginBottom: '36px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🏪🏪</span>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#222',
                margin: 0,
              }}
            >
              Top {twoShop.length} mit 2 Geschäften
            </h2>
            <span
              style={{
                fontSize: '12px',
                color: '#888',
                fontStyle: 'italic',
              }}
            >
              Optimale Preisverteilung zwischen 2 Shops
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {twoShop.map((combo, i) => (
              <CombinationCard key={combo.id} combo={combo} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Single-shop section */}
      {singleShop.length > 0 && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🏪</span>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#222',
                margin: 0,
              }}
            >
              Top {singleShop.length} mit 1 Geschäft
            </h2>
            <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
              Alles in einem Shop kaufen
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {singleShop.map((combo, i) => (
              <CombinationCard key={combo.id} combo={combo} rank={i + 1} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
