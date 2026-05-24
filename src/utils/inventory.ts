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

export const getInitialStockCount = (product: ProductItem): number => {
  return Math.max(getStockCount(product), toCount(product.initialStock, getStockCount(product)));
};

export const getAvailableStockCount = (product: ProductItem): number => {
  return Math.max(0, getStockCount(product) - getReservedStockCount(product));
};

export const isProductOutOfStock = (product: ProductItem): boolean => {
  return getAvailableStockCount(product) <= 0;
};

export const isProductLowStock = (product: ProductItem): boolean => {
  const available = getAvailableStockCount(product);
  const initial = getInitialStockCount(product);
  return available > 0 && initial > 0 && available / initial <= 0.4;
};

export const getStockLabel = (product: ProductItem): string => {
  if (isProductOutOfStock(product)) return 'Out of stock';
  if (isProductLowStock(product)) return 'Few Left BUY NOW!!';
  return 'In stock';
};

export const getStockToneClass = (product: ProductItem): string => {
  if (isProductOutOfStock(product) || isProductLowStock(product)) return 'text-red-400';
  return 'text-emerald-400';
};
