import { Product, Shop, Price } from './types';

export const initialProducts: Product[] = [
  {
    id: 'mehl',
    name: 'Pizzamehl Tipo 00',
    category: 'Grundzutaten',
    unit: 'kg',
    currentStock: 1.5,
    minStock: 5,
    orderQuantity: 10,
  },
  {
    id: 'tomaten',
    name: 'San Marzano Tomaten',
    category: 'Grundzutaten',
    unit: 'Dosen',
    currentStock: 3,
    minStock: 10,
    orderQuantity: 24,
  },
  {
    id: 'mozzarella',
    name: 'Mozzarella di Bufala',
    category: 'Käse',
    unit: 'kg',
    currentStock: 0.8,
    minStock: 4,
    orderQuantity: 5,
  },
  {
    id: 'olivenoel',
    name: 'Olivenöl Extra Vergine',
    category: 'Grundzutaten',
    unit: 'Liter',
    currentStock: 1.2,
    minStock: 3,
    orderQuantity: 5,
  },
  {
    id: 'salami',
    name: 'Salami Milano',
    category: 'Belag',
    unit: 'kg',
    currentStock: 0.4,
    minStock: 2,
    orderQuantity: 3,
  },
  {
    id: 'parmesan',
    name: 'Parmigiano Reggiano',
    category: 'Käse',
    unit: 'kg',
    currentStock: 0.3,
    minStock: 1,
    orderQuantity: 2,
  },
  {
    id: 'basilikum',
    name: 'Frischer Basilikum',
    category: 'Gewürze',
    unit: 'Bund',
    currentStock: 2,
    minStock: 5,
    orderQuantity: 10,
  },
  {
    id: 'hefe',
    name: 'Frische Hefe',
    category: 'Grundzutaten',
    unit: 'Päckchen',
    currentStock: 15,
    minStock: 10,
    orderQuantity: 20,
  },
  {
    id: 'salz',
    name: 'Meersalz',
    category: 'Gewürze',
    unit: 'kg',
    currentStock: 3,
    minStock: 2,
    orderQuantity: 5,
  },
  {
    id: 'peperoni',
    name: 'Peperoni',
    category: 'Belag',
    unit: 'kg',
    currentStock: 0.2,
    minStock: 1.5,
    orderQuantity: 2,
  },
];

export const initialShops: Shop[] = [
  { id: 'metro', name: 'Metro', type: 'Großhandel', color: '#003DA5' },
  { id: 'edeka', name: 'Edeka', type: 'Supermarkt', color: '#E31E24' },
  { id: 'lidl', name: 'Lidl', type: 'Discounter', color: '#0050AA' },
  { id: 'rewe', name: 'Rewe', type: 'Supermarkt', color: '#CC0000' },
];

export const initialPrices: Price[] = [
  // Mehl
  { shopId: 'metro', productId: 'mehl', pricePerUnit: 0.89 },
  { shopId: 'edeka', productId: 'mehl', pricePerUnit: 1.29 },
  { shopId: 'lidl', productId: 'mehl', pricePerUnit: 0.79 },
  { shopId: 'rewe', productId: 'mehl', pricePerUnit: 1.19 },

  // Tomaten
  { shopId: 'metro', productId: 'tomaten', pricePerUnit: 0.99 },
  { shopId: 'edeka', productId: 'tomaten', pricePerUnit: 1.49 },
  { shopId: 'lidl', productId: 'tomaten', pricePerUnit: 0.89 },
  { shopId: 'rewe', productId: 'tomaten', pricePerUnit: 1.39 },

  // Mozzarella
  { shopId: 'metro', productId: 'mozzarella', pricePerUnit: 4.99 },
  { shopId: 'edeka', productId: 'mozzarella', pricePerUnit: 5.99 },
  { shopId: 'lidl', productId: 'mozzarella', pricePerUnit: 3.99 },
  { shopId: 'rewe', productId: 'mozzarella', pricePerUnit: 5.49 },

  // Olivenöl
  { shopId: 'metro', productId: 'olivenoel', pricePerUnit: 5.49 },
  { shopId: 'edeka', productId: 'olivenoel', pricePerUnit: 6.99 },
  { shopId: 'lidl', productId: 'olivenoel', pricePerUnit: 4.49 },
  { shopId: 'rewe', productId: 'olivenoel', pricePerUnit: 6.49 },

  // Salami
  { shopId: 'metro', productId: 'salami', pricePerUnit: 7.99 },
  { shopId: 'edeka', productId: 'salami', pricePerUnit: 9.49 },
  { shopId: 'lidl', productId: 'salami', pricePerUnit: 6.49 },
  { shopId: 'rewe', productId: 'salami', pricePerUnit: 8.99 },

  // Parmesan
  { shopId: 'metro', productId: 'parmesan', pricePerUnit: 8.99 },
  { shopId: 'edeka', productId: 'parmesan', pricePerUnit: 11.99 },
  { shopId: 'lidl', productId: 'parmesan', pricePerUnit: 7.99 },
  { shopId: 'rewe', productId: 'parmesan', pricePerUnit: 10.49 },

  // Basilikum
  { shopId: 'metro', productId: 'basilikum', pricePerUnit: 0.69 },
  { shopId: 'edeka', productId: 'basilikum', pricePerUnit: 0.99 },
  { shopId: 'lidl', productId: 'basilikum', pricePerUnit: 0.59 },
  { shopId: 'rewe', productId: 'basilikum', pricePerUnit: 0.89 },

  // Hefe (nicht low stock, trotzdem Preise hinterlegt)
  { shopId: 'metro', productId: 'hefe', pricePerUnit: 0.39 },
  { shopId: 'edeka', productId: 'hefe', pricePerUnit: 0.49 },
  { shopId: 'lidl', productId: 'hefe', pricePerUnit: 0.29 },
  { shopId: 'rewe', productId: 'hefe', pricePerUnit: 0.45 },

  // Salz (nicht low stock)
  { shopId: 'metro', productId: 'salz', pricePerUnit: 0.49 },
  { shopId: 'edeka', productId: 'salz', pricePerUnit: 0.69 },
  { shopId: 'lidl', productId: 'salz', pricePerUnit: 0.39 },
  { shopId: 'rewe', productId: 'salz', pricePerUnit: 0.59 },

  // Peperoni
  { shopId: 'metro', productId: 'peperoni', pricePerUnit: 5.99 },
  { shopId: 'edeka', productId: 'peperoni', pricePerUnit: 7.49 },
  { shopId: 'lidl', productId: 'peperoni', pricePerUnit: 4.99 },
  { shopId: 'rewe', productId: 'peperoni', pricePerUnit: 6.99 },
];
