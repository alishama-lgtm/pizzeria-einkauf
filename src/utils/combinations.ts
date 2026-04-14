import { Product, Shop, Price, ShoppingCombination, ShoppingItem } from '../types';

function getLowStockProducts(products: Product[]): Product[] {
  return products.filter((p) => p.currentStock < p.minStock);
}

function getPrice(
  shopId: string,
  productId: string,
  prices: Price[]
): number | null {
  const entry = prices.find(
    (p) => p.shopId === shopId && p.productId === productId
  );
  return entry ? entry.pricePerUnit : null;
}

function buildSingleShopCombination(
  shop: Shop,
  lowStockProducts: Product[],
  prices: Price[]
): ShoppingCombination | null {
  const items: ShoppingItem[] = [];

  for (const product of lowStockProducts) {
    const pricePerUnit = getPrice(shop.id, product.id, prices);
    if (pricePerUnit === null) return null; // shop doesn't carry this product

    items.push({
      product,
      shop,
      pricePerUnit,
      quantity: product.orderQuantity,
      totalCost: pricePerUnit * product.orderQuantity,
    });
  }

  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  return {
    id: `single-${shop.id}`,
    shops: [shop],
    items,
    totalCost,
    numShops: 1,
    isRecommended: false,
  };
}

function buildTwoShopCombination(
  shopA: Shop,
  shopB: Shop,
  lowStockProducts: Product[],
  prices: Price[]
): ShoppingCombination | null {
  const items: ShoppingItem[] = [];

  for (const product of lowStockProducts) {
    const priceA = getPrice(shopA.id, product.id, prices);
    const priceB = getPrice(shopB.id, product.id, prices);

    if (priceA === null && priceB === null) return null; // no shop carries this

    let chosenShop: Shop;
    let chosenPrice: number;

    if (priceA === null) {
      chosenShop = shopB;
      chosenPrice = priceB!;
    } else if (priceB === null) {
      chosenShop = shopA;
      chosenPrice = priceA;
    } else {
      chosenShop = priceA <= priceB ? shopA : shopB;
      chosenPrice = Math.min(priceA, priceB);
    }

    items.push({
      product,
      shop: chosenShop,
      pricePerUnit: chosenPrice,
      quantity: product.orderQuantity,
      totalCost: chosenPrice * product.orderQuantity,
    });
  }

  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  // Only count shops that are actually used
  const usedShopIds = new Set(items.map((i) => i.shop.id));
  const usedShops = [shopA, shopB].filter((s) => usedShopIds.has(s.id));

  // Skip if both shops produce the same result as a single shop
  if (usedShops.length === 1) return null;

  return {
    id: `two-${shopA.id}-${shopB.id}`,
    shops: usedShops,
    items,
    totalCost,
    numShops: 2,
    isRecommended: false,
  };
}

export function calculateCombinations(
  products: Product[],
  shops: Shop[],
  prices: Price[]
): {
  singleShop: ShoppingCombination[];
  twoShop: ShoppingCombination[];
  hasLowStock: boolean;
} {
  const lowStockProducts = getLowStockProducts(products);

  if (lowStockProducts.length === 0) {
    return { singleShop: [], twoShop: [], hasLowStock: false };
  }

  // Single-shop combinations
  const singleShopResults: ShoppingCombination[] = [];
  for (const shop of shops) {
    const combo = buildSingleShopCombination(shop, lowStockProducts, prices);
    if (combo) singleShopResults.push(combo);
  }
  singleShopResults.sort((a, b) => a.totalCost - b.totalCost);
  const top3Single = singleShopResults.slice(0, 3);

  // Two-shop combinations
  const twoShopResults: ShoppingCombination[] = [];
  for (let i = 0; i < shops.length; i++) {
    for (let j = i + 1; j < shops.length; j++) {
      const combo = buildTwoShopCombination(
        shops[i],
        shops[j],
        lowStockProducts,
        prices
      );
      if (combo) twoShopResults.push(combo);
    }
  }
  twoShopResults.sort((a, b) => a.totalCost - b.totalCost);
  const top3Two = twoShopResults.slice(0, 3);

  // Mark the globally cheapest as EMPFOHLEN
  const all = [...top3Two, ...top3Single];
  if (all.length > 0) {
    all.sort((a, b) => a.totalCost - b.totalCost);
    all[0].isRecommended = true;
  }

  return {
    singleShop: top3Single,
    twoShop: top3Two,
    hasLowStock: true,
  };
}
