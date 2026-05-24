import React from 'react';
import { getAvailableStockCount, getStockCount } from '@/utils/inventory';
import type { ProductItem, ProductStatus } from './types';
import { toProductStatus } from './form';

interface ProductStatusBadgeProps {
  readonly product: ProductItem;
}

const statusStyles: Record<ProductStatus, string> = {
  available: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  reserved: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  sold: 'bg-red-500/10 border-red-500/20 text-red-500',
};

const getStatusLabel = (product: ProductItem, status: ProductStatus): string => ({
  available: `${getAvailableStockCount(product)} In Stock`,
  reserved: 'Reserved',
  sold: 'Out Of Stock',
}[status]);

export default function ProductStatusBadge({ product }: ProductStatusBadgeProps): React.JSX.Element {
  const normalizedStatus = getStockCount(product) <= 0
    ? 'sold'
    : getAvailableStockCount(product) <= 0
      ? 'reserved'
      : toProductStatus(product.status);

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${statusStyles[normalizedStatus]}`}>
      {getStatusLabel(product, normalizedStatus)}
    </span>
  );
}
