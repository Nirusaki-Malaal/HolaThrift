import React from 'react';
import type { ProductStatus } from './types';
import { toProductStatus } from './form';

interface ProductStatusBadgeProps {
  readonly status?: string;
}

const statusStyles: Record<ProductStatus, string> = {
  available: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  reserved: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  sold: 'bg-red-500/10 border-red-500/20 text-red-500',
};

const statusLabels: Record<ProductStatus, string> = {
  available: '1 Left',
  reserved: 'Reserved',
  sold: 'Sold Out',
};

export default function ProductStatusBadge({ status }: ProductStatusBadgeProps): React.JSX.Element {
  const normalizedStatus = toProductStatus(status);

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${statusStyles[normalizedStatus]}`}>
      {statusLabels[normalizedStatus]}
    </span>
  );
}
