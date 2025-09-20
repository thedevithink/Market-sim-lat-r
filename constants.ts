
import type { Product } from './types';

export const INITIAL_MONEY = 500;
export const INITIAL_DAY = 1;

export const PRODUCTS: Product[] = [
  { id: 'apple', name: 'Elma', icon: '🍎', basePrice: 2, baseDemand: 20 },
  { id: 'bread', name: 'Ekmek', icon: '🍞', basePrice: 5, baseDemand: 30 },
  { id: 'milk', name: 'Süt', icon: '🥛', basePrice: 15, baseDemand: 25 },
  { id: 'cheese', name: 'Peynir', icon: '🧀', basePrice: 40, baseDemand: 15 },
  { id: 'water', name: 'Su', icon: '💧', basePrice: 1, baseDemand: 40 },
  { id: 'chocolate', name: 'Çikolata', icon: '🍫', basePrice: 8, baseDemand: 18 },
  { id: 'egg', name: 'Yumurta', icon: '🥚', basePrice: 3, baseDemand: 28 },
  { id: 'soda', name: 'Gazoz', icon: '🥤', basePrice: 10, baseDemand: 22 },
];
