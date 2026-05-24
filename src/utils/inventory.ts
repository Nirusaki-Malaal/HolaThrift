import type { ProductItem } from '@/types/product';

const DEFAULT_STOCK = 1;

const toCount = (value: unknown, fallback = 0): number => {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) return fallback;
  return Math.floor(count);
};

export const getStockCount = (product: ProductItem): number => {
  return toCount(product.stock, product.status === 'sold' ? 0 : DEFAULT_STOCK);
};

export const getReservedStockCount = (product: ProductItem): number => {
  return Math.min(getStockCount(product), toCount(product.reservedStock, 0));
};

export const getAvailableStockCount = (product: ProductItem): number => {
  return Math.max(0, getStockCount(product) - getReservedStockCount(product));
};

export const isProductOutOfStock = (product: ProductItem): boolean => {
  return getAvailableStockCount(product) <= 0;
};

export const getStockLabel = (product: ProductItem): string => {
  const available = getAvailableStockCount(product);
  if (available <= 0) return 'Out of stock';
  return `${available} in stock`;
};
