import React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import type { ProductItem } from '@/types/product';

interface WishlistGridProps {
  readonly products: ProductItem[];
  readonly loading: boolean;
  readonly onRemove: (productId: string) => void;
}

export default function WishlistGrid({ products, loading, onRemove }: WishlistGridProps): React.JSX.Element {
  return (
    <div className="motion-panel min-h-[300px] rounded-3xl border border-white/5 bg-[#111]/40 p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-pink-500/20 bg-pink-500/10 text-pink-300">
          <Heart size={14} className="fill-current" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Saved Items</h3>
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">{products.length} saved</span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-neutral-500">Loading saved items...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 text-center">
          <span className="mb-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500">No saved items yet</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Tap the heart on products you love</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((product, index) => (
            <div key={product._id} className="motion-card flex gap-4 rounded-2xl border border-white/5 bg-[#050505] p-4" style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}>
              <img src={product.image} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl border border-white/5 object-cover" />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-xs font-black uppercase text-white">{product.name}</h4>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                  {product.size} · {product.condition}
                </p>
                <span className="mt-2 block text-sm font-black text-white">₹{product.price}</span>
              </div>
              <button onClick={() => onRemove(product._id)} className="motion-press self-start rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400" aria-label={`Remove ${product.name}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
