import { Shop, Price, Product } from '../types';

interface Props {
  shops: Shop[];
  prices: Price[];
  products: Product[];
}

function formatPrice(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export default function ShopsTab({ shops, prices, products }: Props) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {shops.map((shop) => {
          const shopPrices = prices.filter((p) => p.shopId === shop.id);
          const total = shopPrices.reduce(
            (sum, p) => {
              const product = products.find((pr) => pr.id === p.productId);
              if (!product) return sum;
              return sum + p.pricePerUnit * product.orderQuantity;
            },
            0
          );

          return (
            <div
              key={shop.id}
              style={{
                border: '1px solid #e0d5c8',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  backgroundColor: shop.color,
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {shop.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                    {shop.type}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                    Gesamteinkauf
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {formatPrice(total)}
                  </div>
                </div>
              </div>

              {/* Price list */}
              <div style={{ padding: '4px 0' }}>
                {products.map((product) => {
                  const priceEntry = prices.find(
                    (p) => p.shopId === shop.id && p.productId === product.id
                  );
                  const isLow = product.currentStock < product.minStock;

                  return (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 18px',
                        borderBottom: '1px solid #f0e8e0',
                        backgroundColor: isLow ? '#fff9f8' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isLow && (
                          <span style={{ fontSize: '11px' }}>⚠️</span>
                        )}
                        <span style={{ fontSize: '13px', color: '#333' }}>
                          {product.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: priceEntry ? '#222' : '#ccc',
                        }}
                      >
                        {priceEntry
                          ? `${formatPrice(priceEntry.pricePerUnit)} /${product.unit}`
                          : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
