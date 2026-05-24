import React from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import type { CartItem } from '@/types/cart';

interface CartDrawerProps {
  readonly cart: CartItem[];
  readonly total: number;
  readonly onClose: () => void;
  readonly onRemove: (productId: string) => void;
  readonly onCheckout: () => void;
}

export default function CartDrawer({ cart, total, onClose, onRemove, onCheckout }: CartDrawerProps): React.JSX.Element {
  const drawer = (
    <div className="fixed inset-0 z-[250] flex items-end justify-center p-3 md:items-stretch md:justify-end md:p-0" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button type="button" aria-label="Dismiss shopping bag overlay" className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-default" onClick={onClose}></button>

      <aside className="motion-drawer relative z-10 flex h-[min(86dvh,720px)] w-full max-w-lg flex-col rounded-[1.75rem] border border-white/10 bg-[#0a0a0a] shadow-[-10px_0_50px_rgba(0,0,0,0.8)] md:h-full md:max-w-md md:rounded-none md:rounded-l-[2rem] md:border-y-0 md:border-r-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close bag"
          className="motion-press absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 backdrop-blur-md transition-all hover:bg-white hover:text-black cursor-pointer"
        >
          <X size={19} />
        </button>

        <div className="flex min-h-0 flex-1 flex-col p-5 pt-6 md:p-8">
          <div className="mb-5 flex items-center gap-2 border-b border-white/5 pb-5 pr-14">
            <ShoppingBag size={18} className="text-purple-400" />
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white">My Bag</h2>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                {cart.length} {cart.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
              <span className="mb-2 font-mono text-xs uppercase tracking-widest text-neutral-500">Your bag is empty</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Browse the archives to add pieces</span>
            </div>
          ) : (
            <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-left">
              {cart.map((item, index) => (
                <div key={item.product._id} className="motion-card flex items-center gap-4 rounded-2xl border border-white/5 bg-[#111]/30 p-4" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                  <img src={item.product.image} alt="" loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-xl border border-white/5 bg-[#050505] object-cover" />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-xs font-black uppercase text-white">{item.product.name}</h4>
                    <span className="mt-0.5 block font-mono text-[9px] font-bold text-purple-400">
                      SIZE: {item.product.size} · ₹{item.product.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.product._id)}
                    aria-label={`Remove ${item.product.name}`}
                    className="motion-press rounded-xl p-2 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-5 border-t border-white/5 pt-5">
              <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                <span>Total ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                <span className="font-sans text-base font-black text-white">₹{total}</span>
              </div>
              <button
                type="button"
                onClick={onCheckout}
                className="motion-press w-full rounded-xl bg-white py-4 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:bg-neutral-200 cursor-pointer"
              >
                Secure Checkout
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}
