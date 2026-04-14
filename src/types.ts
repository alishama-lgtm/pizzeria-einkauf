export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  orderQuantity: number;
}

export interface Shop {
  id: string;
  name: string;
  type: string;
  color: string;
}

export interface Price {
  shopId: string;
  productId: string;
  pricePerUnit: number;
}

export interface ShoppingItem {
  product: Product;
  shop: Shop;
  pricePerUnit: number;
  quantity: number;
  totalCost: number;
}

export interface ShoppingCombination {
  id: string;
  shops: Shop[];
  items: ShoppingItem[];
  totalCost: number;
  numShops: number;
  isRecommended: boolean;
}
