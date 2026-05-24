export type InventoryStatus = 'available' | 'reserved' | 'sold';

export interface InventoryLike {
  stock?: unknown;
  reservedStock?: unknown;
  status?: unknown;
}

const DEFAULT_STOCK = 1;

const toCount = (value: unknown, fallback = 0): number => {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) return fallback;
  return Math.floor(count);
};

export const getStockCount = (product: InventoryLike): number => {
  const fallback = product.status === 'sold' ? 0 : DEFAULT_STOCK;
  return toCount(product.stock, fallback);
};

export const getReservedStockCount = (product: InventoryLike): number => {
  return Math.min(getStockCount(product), toCount(product.reservedStock, 0));
};

export const getAvailableStockCount = (product: InventoryLike): number => {
  return Math.max(0, getStockCount(product) - getReservedStockCount(product));
};

export const getInventoryStatus = (product: InventoryLike): InventoryStatus => {
  const stock = getStockCount(product);
  if (stock <= 0) return 'sold';
  return getAvailableStockCount(product) > 0 ? 'available' : 'reserved';
};

export const normalizeInventory = (product: InventoryLike): { stock: number; reservedStock: number; status: InventoryStatus } => {
  const stock = getStockCount(product);
  const reservedStock = Math.min(stock, toCount(product.reservedStock, 0));
  return {
    stock,
    reservedStock,
    status: getInventoryStatus({ stock, reservedStock }),
  };
};
