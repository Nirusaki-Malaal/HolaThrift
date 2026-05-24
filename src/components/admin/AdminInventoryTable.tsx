import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import ProductStatusBadge from './ProductStatusBadge';
import { getReservedStockCount, getStockCount } from '@/utils/inventory';
import type { ProductItem } from './types';

interface AdminInventoryTableProps {
  readonly products: ProductItem[];
  readonly onEdit: (product: ProductItem) => void;
  readonly onDelete: (id: string) => void;
  readonly onToggleStock: (product: ProductItem) => void;
}

export default function AdminInventoryTable({ products, onEdit, onDelete, onToggleStock }: AdminInventoryTableProps): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-lg border border-white/5 bg-[#111]/40 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-widest text-neutral-500">
              <th className="p-5">Thumbnail</th>
              <th className="p-5">Name</th>
              <th className="p-5">Category</th>
              <th className="p-5">Price</th>
              <th className="p-5">Size</th>
              <th className="p-5">Stock</th>
              <th className="p-5">Reserved</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
            {products.map((product) => {
              const isOutOfStock = getStockCount(product) <= 0;
              return (
                <tr key={product._id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="p-5">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg border border-white/5 bg-[#050505] object-cover"
                    />
                  </td>
                  <td className="max-w-[220px] p-5 font-sans text-xs font-bold uppercase leading-snug text-white">
                    {product.name}
                  </td>
                  <td className="p-5">{product.category}</td>
                  <td className="p-5 font-sans font-bold text-white">₹{product.price}</td>
                  <td className="p-5 font-bold text-purple-400">{product.size}</td>
                  <td className="p-5">
                    <ProductStatusBadge product={product} />
                  </td>
                  <td className="p-5 text-neutral-400">{getReservedStockCount(product)} Held</td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onToggleStock(product)}
                        className={`whitespace-nowrap rounded-lg border px-3 py-2 text-[8px] font-black uppercase tracking-widest transition-colors ${
                          isOutOfStock
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                            : 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        {isOutOfStock ? 'Restock 1' : 'Set Out'}
                      </button>
                      <button
                        onClick={() => onEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        title={`Edit ${product.name}`}
                        className="rounded-lg border border-white/5 bg-white/5 p-2 text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => onDelete(product._id)}
                        aria-label={`Delete ${product.name}`}
                        title={`Delete ${product.name}`}
                        className="rounded-lg border border-red-500/10 bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
