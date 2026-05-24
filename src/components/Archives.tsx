import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Search, X, ArrowRight, AlertCircle, Heart } from 'lucide-react';
import { getCookie } from '@/utils/cookies';
import CheckoutModal from './CheckoutModal';
import ProductDetail from './ProductDetail';
import CartDrawer from './cart/CartDrawer';
import type { CartItem } from '@/types/cart';
import type { ProductItem } from '@/types/product';
import type { UserSession } from '@/types/user';

interface ArchivesProps {
  readonly user: UserSession | null;
  readonly onLogout: () => void;
  readonly onToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function Archives({ user, onToast }: ArchivesProps): React.JSX.Element {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem('hola_cart');
    if (!storedCart) return [];
    try {
      return JSON.parse(storedCart) as CartItem[];
    } catch (err) {
      console.error(err);
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProducts = useCallback(async (showLoading = false): Promise<void> => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const saveCart = useCallback((newCart: CartItem[]): void => {
    setCart(newCart);
    localStorage.setItem('hola_cart', JSON.stringify(newCart));
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      fetchProducts(true);
    }, 0);

    pollRef.current = setInterval(() => fetchProducts(false), 30000);
    return () => {
      window.clearTimeout(loadTimer);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchProducts]);

  const fetchWishlist = useCallback(async (): Promise<void> => {
    const token = getCookie('auth_token');
    if (!user || !token) {
      setWishlistIds(new Set());
      return;
    }

    try {
      const res = await fetch('/api/user/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setWishlistIds(new Set(data.map((product: ProductItem) => product._id)));
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchWishlist();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchWishlist]);

  useEffect(() => {
    if (products.length > 0 && cart.length > 0) {
      const soldInCart = cart.filter(item => {
        const p = products.find(pr => pr._id === item.product._id);
        return p && p.status === 'sold';
      });
      if (soldInCart.length > 0) {
        const updated = cart.filter(item => {
          const p = products.find(pr => pr._id === item.product._id);
          return !p || p.status !== 'sold';
        });
        const timer = window.setTimeout(() => {
          saveCart(updated);
          onToast?.('info', `${soldInCart.length} item(s) sold out — removed from bag`);
        }, 0);
        return () => window.clearTimeout(timer);
      }
    }
  }, [cart, onToast, products, saveCart]);

  const handleAddToCart = (product: ProductItem): void => {
    if (product.status === 'sold') {
      onToast?.('error', 'This item has been sold');
      return;
    }
    const existing = cart.find((item) => item.product._id === product._id);
    if (existing) {
      onToast?.('info', 'Already in your bag');
      setCartOpen(true);
      return;
    }
    saveCart([...cart, { product, quantity: 1 }]);
    onToast?.('success', 'Added to bag');
    setCartOpen(true);
  };

  const handleRemoveFromCart = (productId: string): void => {
    saveCart(cart.filter((item) => item.product._id !== productId));
  };

  const handleToggleWishlist = async (product: ProductItem): Promise<void> => {
    const token = getCookie('auth_token');
    if (!user || !token) {
      onToast?.('info', 'Sign in to save items');
      return;
    }

    const isSaved = wishlistIds.has(product._id);
    setWishlistIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (isSaved) nextIds.delete(product._id);
      else nextIds.add(product._id);
      return nextIds;
    });

    try {
      const res = await fetch(`/api/user/wishlist/${product._id}`, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update saved items');
      setWishlistIds(new Set(data.map((item: ProductItem) => item._id)));
      onToast?.('success', isSaved ? 'Removed from saved items' : 'Saved for later');
    } catch (err) {
      setWishlistIds((currentIds) => {
        const nextIds = new Set(currentIds);
        if (isSaved) nextIds.add(product._id);
        else nextIds.delete(product._id);
        return nextIds;
      });
      onToast?.('error', err instanceof Error ? err.message : 'Could not update saved items');
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handlePaymentSuccess = async (): Promise<void> => {
    saveCart([]);
    await fetchProducts(false);
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const sizes = ['All', ...new Set(products.map(p => p.size))];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSize = selectedSize === 'All' || prod.size === selectedSize;
    return matchesSearch && matchesCategory && matchesSize;
  });

  const availableCount = filteredProducts.filter(p => p.status !== 'sold').length;
  const soldCount = filteredProducts.filter(p => p.status === 'sold').length;

  return (
    <div className="motion-page flex-grow max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-12 w-full relative z-10 text-left">
      <div className="motion-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6 mb-8">
        <div>
          <span className="text-purple-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-fast"></span>
            {availableCount} Available{soldCount > 0 ? ` · ${soldCount} Sold` : ''}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            THE ARCHIVES
          </h1>
        </div>

        <button
          onClick={() => setCartOpen(true)}
          className="motion-lift motion-press relative flex items-center gap-2.5 bg-white/5 border border-white/10 text-neutral-300 hover:text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] px-5 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer"
        >
          <ShoppingBag size={14} />
          <span>MY BAG</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-purple-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-sans shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      <div className="motion-panel flex flex-col lg:flex-row gap-4 mb-8 items-stretch lg:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-4 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Search the archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111]/40 px-12 py-4 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-4 text-neutral-500 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-[#050505] p-1 rounded-xl border border-white/5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex bg-[#050505] p-1 rounded-xl border border-white/5">
            {sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedSize === sz ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="motion-card flex items-center justify-center h-64">
          <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Loading archives catalog from vault...
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="motion-card flex flex-col items-center justify-center h-64 border border-dashed border-white/5 rounded-[2rem] text-center p-8">
          <AlertCircle className="text-neutral-500 mb-4" size={24} />
          <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest mb-1">
            No matching archives found
          </span>
          <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest">
            Try adjusting your search filters
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product, index) => {
            const isSold = product.status === 'sold';
            const isInCart = cart.some(item => item.product._id === product._id);
            const isSaved = wishlistIds.has(product._id);
            return (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className={`motion-card motion-lift group relative bg-[#111]/30 border border-white/5 rounded-[2rem] p-5 hover:border-purple-500/25 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-500 flex flex-col justify-between overflow-hidden cursor-pointer ${isSold ? 'opacity-60' : ''}`}
                style={{ animationDelay: `${Math.min(index, 16) * 45}ms` }}
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-[#050505] border border-white/5">
                  <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-white/5 rounded-md text-[8px] font-mono tracking-widest text-neutral-400">
                    {product.category}
                  </span>
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-purple-500/90 text-white font-mono text-[8px] font-black rounded-md tracking-wider shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                    SIZE {product.size}
                  </span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleWishlist(product);
                    }}
                    aria-label={isSaved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
                    className={`motion-press absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all ${
                      isSaved
                        ? 'border-pink-400/40 bg-pink-500/20 text-pink-300'
                        : 'border-white/10 bg-black/60 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Heart size={15} className={isSaved ? 'fill-current' : ''} />
                  </button>
                  {isSold && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-red-400 font-black text-lg uppercase tracking-widest rotate-[-12deg] border-2 border-red-400/40 px-4 py-1 rounded-lg">SOLD</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 mb-4 text-left">
                  <h3 className="text-white font-black text-sm uppercase leading-tight tracking-tight group-hover:text-purple-300 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-neutral-500 font-mono text-[9px] uppercase tracking-widest">
                    {product.condition}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-auto border-t border-white/5 pt-4">
                  <span className="text-white font-black text-base font-sans">₹{product.price}</span>
                  {isSold ? (
                    <span className="px-4 py-2.5 bg-neutral-800/50 text-neutral-500 font-black text-[9px] uppercase tracking-widest rounded-xl border border-white/5">
                      SOLD OUT
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                      className={`motion-press flex items-center gap-1.5 px-4 py-2.5 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                        isInCart
                          ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                          : 'bg-white text-black hover:bg-purple-500 hover:text-white shadow-[0_0_12px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      }`}
                    >
                      <span>{isInCart ? '✓ IN BAG' : 'ADD TO BAG'}</span>
                      {!isInCart && <ArrowRight size={10} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          total={cartTotal}
          onClose={() => setCartOpen(false)}
          onRemove={handleRemoveFromCart}
          onCheckout={() => {
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
        />
      )}

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          isInCart={cart.some(item => item.product._id === selectedProduct._id)}
        />
      )}

      <CheckoutModal
        isOpen={checkoutOpen}
        total={cartTotal}
        items={cart.map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        }))}
        onClose={() => setCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onToast={onToast}
        user={user}
      />
    </div>
  );
}
