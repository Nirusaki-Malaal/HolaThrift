import React from 'react';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';

interface ProductItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  size: string;
  condition: string;
  image: string;
  description?: string;
  status?: string;
}

interface ProductDetailProps {
  readonly product: ProductItem;
  readonly onClose: () => void;
  readonly onAddToCart: (product: ProductItem) => void;
  readonly isInCart: boolean;
}

export default function ProductDetail({ product, onClose, onAddToCart, isInCart }: ProductDetailProps): React.JSX.Element {
  const isSold = product.status === 'sold';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>

      <div className="motion-modal relative bg-[#0d0d0d] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.2)]">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/30 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-1/2 aspect-square bg-[#050505]">
            <img src={product.image} alt="" className="w-full h-full object-cover" />
            {isSold && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-red-400 font-black text-2xl uppercase tracking-widest rotate-[-12deg]">SOLD OUT</span>
              </div>
            )}
            <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg text-[9px] font-mono tracking-widest text-neutral-300 uppercase">
              {product.category}
            </span>
            <span className="absolute top-4 right-4 px-3 py-1 bg-purple-500/90 text-white font-mono text-[9px] font-black rounded-lg tracking-wider shadow-[0_0_8px_rgba(168,85,247,0.4)]">
              SIZE {product.size}
            </span>
          </div>

          <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight mb-2">
                {product.name}
              </h2>
              <p className="text-purple-400 font-mono text-[10px] uppercase tracking-widest mb-6">
                {product.condition}
              </p>
              {product.description && (
                <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">Category</span>
                  <span className="text-white text-xs font-bold uppercase">{product.category}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">Size</span>
                  <span className="text-white text-xs font-bold uppercase">{product.size}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">Condition</span>
                  <span className="text-white text-xs font-bold uppercase">{product.condition}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-black text-2xl">₹{product.price}</span>
                {isSold && <span className="text-red-400 font-mono text-[9px] font-black uppercase tracking-widest">Unavailable</span>}
              </div>

              {isSold ? (
                <div className="w-full py-4 bg-neutral-800/50 text-neutral-500 font-black rounded-xl uppercase text-xs tracking-widest text-center border border-white/5">
                  SOLD OUT
                </div>
              ) : isInCart ? (
                <div className="w-full py-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-black rounded-xl uppercase text-xs tracking-widest text-center flex items-center justify-center gap-2">
                  <ShoppingBag size={14} />
                  ALREADY IN BAG
                </div>
              ) : (
                <button
                  onClick={() => { onAddToCart(product); onClose(); }}
                  className="motion-press w-full py-4 bg-white text-black hover:bg-purple-500 hover:text-white font-black rounded-xl uppercase text-xs tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
                >
                  <span>ADD TO BAG</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
