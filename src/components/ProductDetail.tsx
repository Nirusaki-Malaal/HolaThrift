import React from 'react';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { getStockLabel, getStockToneClass, isProductOutOfStock } from '@/utils/inventory';
import type { ProductItem } from '@/types/product';

interface ProductDetailProps {
  readonly product: ProductItem;
  readonly onClose: () => void;
  readonly onAddToCart: (product: ProductItem) => void;
  readonly isInCart: boolean;
}

export default function ProductDetail({ product, onClose, onAddToCart, isInCart }: ProductDetailProps): React.JSX.Element {
  const isOutOfStock = isProductOutOfStock(product);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:px-4">
      <div className="product-detail-backdrop absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>

      <div className="product-detail-shell motion-modal relative bg-[#0d0d0d] border border-white/10 w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90dvh] rounded-t-[1.75rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.2)] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/30 transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-1/2 aspect-[4/3] sm:aspect-square bg-[#050505] shrink-0">
              <img src={product.image} alt="" decoding="async" className="w-full h-full object-cover" />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-red-400 font-black text-xl sm:text-2xl uppercase tracking-widest rotate-[-12deg]">OUT OF STOCK</span>
                </div>
              )}
              <span className="product-detail-chip absolute top-3 left-3 sm:top-4 sm:left-4 px-2 sm:px-3 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg text-[8px] sm:text-[9px] font-mono tracking-widest text-neutral-300 uppercase">
                {product.category}
              </span>
              <span className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 sm:px-3 py-1 bg-purple-500/90 text-white font-mono text-[8px] sm:text-[9px] font-black rounded-lg tracking-wider shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                SIZE {product.size}
              </span>
            </div>

            <div className="w-full md:w-1/2 p-5 sm:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-tight mb-1.5 sm:mb-2 pr-8 sm:pr-0">
                  {product.name}
                </h2>
                <p className={`font-mono text-[10px] uppercase tracking-widest mb-4 sm:mb-6 ${getStockToneClass(product)}`}>
                  {getStockLabel(product)}
                </p>
                {product.description && (
                  <p className="text-neutral-400 text-sm leading-relaxed mb-4 sm:mb-6">
                    {product.description}
                  </p>
                )}

                <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">Category</span>
                    <span className="text-white text-xs font-bold uppercase">{product.category}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">Size</span>
                    <span className="text-white text-xs font-bold uppercase">{product.size}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-white/5">
                    <span className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">Availability</span>
                    <span className={`text-xs font-bold uppercase ${getStockToneClass(product)}`}>{getStockLabel(product)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom CTA — always visible on mobile */}
        <div className="shrink-0 border-t border-white/5 bg-[#0d0d0d] px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <span className="text-white font-black text-xl sm:text-2xl">₹{product.price}</span>
            {isOutOfStock && <span className="text-red-400 font-mono text-[9px] font-black uppercase tracking-widest">Out of stock</span>}
          </div>

          {isOutOfStock ? (
            <div className="w-full py-3.5 sm:py-4 bg-neutral-800/50 text-neutral-500 font-black rounded-xl uppercase text-xs tracking-widest text-center border border-white/5">
              OUT OF STOCK
            </div>
          ) : isInCart ? (
            <div className="w-full py-3.5 sm:py-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-black rounded-xl uppercase text-xs tracking-widest text-center flex items-center justify-center gap-2">
              <ShoppingBag size={14} />
              ALREADY IN BAG
            </div>
          ) : (
            <button
              onClick={() => { onAddToCart(product); onClose(); }}
              className="motion-press w-full py-3.5 sm:py-4 bg-white text-black hover:bg-purple-500 hover:text-white font-black rounded-xl uppercase text-xs tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
            >
              <span>ADD TO BAG</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
