import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ShoppingBag, Search, X, ArrowRight, AlertCircle, Heart, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { getCookie } from '@/utils/cookies';
import { getErrorMessage, getResponseError, readJson } from '@/utils/http';
import CheckoutModal from './CheckoutModal';
import ProductDetail from './ProductDetail';
import CartDrawer from './cart/CartDrawer';
import { getAvailableStockCount, getStockLabel, getStockToneClass, isProductOutOfStock } from '@/utils/inventory';
import { ALL_FILTER_VALUE, getProductFilterOptions, getVisibleProducts } from '@/utils/productFilters';
import type { CartItem } from '@/types/cart';
import type { ProductItem } from '@/types/product';
import type { UserSession } from '@/types/user';
import type { AvailabilityFilter, ProductSort } from '@/utils/productFilters';

interface ArchivesProps {
  readonly user: UserSession | null;
  readonly onLogout: () => void;
  readonly onToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function Archives({ user, onToast }: ArchivesProps): React.JSX.Element {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_FILTER_VALUE);
  const [selectedSize, setSelectedSize] = useState<string>(ALL_FILTER_VALUE);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityFilter>('all');
  const [selectedSort, setSelectedSort] = useState<ProductSort>('featured');
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
      const data = await readJson<ProductItem[] | { error?: string }>(res);
      if (!res.ok) throw new Error(getResponseError(data, 'Archives could not be loaded'));
      if (!Array.isArray(data)) throw new Error('Archives response was not valid');
      setProducts(data);
      setCatalogError('');
    } catch (err) {
      console.error(err);
      setCatalogError(getErrorMessage(err, 'Archives could not be loaded'));
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
      const data = await readJson<ProductItem[]>(res);
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
      const unavailableInCart = cart.filter(item => {
        const p = products.find(pr => pr._id === item.product._id);
        return p && getAvailableStockCount(p) < item.quantity;
      });
      if (unavailableInCart.length > 0) {
        const updated = cart.filter(item => {
          const p = products.find(pr => pr._id === item.product._id);
          return !p || getAvailableStockCount(p) >= item.quantity;
        });
        const timer = window.setTimeout(() => {
          saveCart(updated);
          onToast?.('info', `${unavailableInCart.length} item(s) are out of stock and were removed from bag`);
        }, 0);
        return () => window.clearTimeout(timer);
      }
    }
  }, [cart, onToast, products, saveCart]);

  const handleAddToCart = (product: ProductItem): void => {
    if (isProductOutOfStock(product)) {
      onToast?.('error', 'This item is out of stock');
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
      const data = await readJson<ProductItem[] | { error?: string }>(res);
      if (!res.ok) throw new Error(getResponseError(data, 'Could not update saved items'));
      if (!Array.isArray(data)) throw new Error('Could not update saved items');
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

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const handlePaymentSuccess = async (): Promise<void> => {
    saveCart([]);
    await fetchProducts(false);
  };

  const filterOptions = useMemo(() => getProductFilterOptions(products), [products]);
  const filteredProducts = useMemo(() => getVisibleProducts(products, {
    searchQuery,
    category: selectedCategory,
    size: selectedSize,
    availability: selectedAvailability,
    sort: selectedSort,
  }), [products, searchQuery, selectedAvailability, selectedCategory, selectedSize, selectedSort]);

  const hasAvailableProducts = filteredProducts.some((product) => !isProductOutOfStock(product));
  const hasOutOfStockProducts = filteredProducts.some(isProductOutOfStock);
  const inventorySummary = filteredProducts.length === 0
    ? 'No Matches'
    : `${hasAvailableProducts ? 'Available Now' : 'Out Of Stock'}${hasOutOfStockProducts ? ' · Some Sold Out' : ''}`;

  return (
    <div className="flex-grow max-w-7xl mx-auto px-3 sm:px-6 md:px-12 pt-24 md:pt-28 pb-8 md:pb-12 w-full relative z-10 text-left">
      <div className="motion-panel flex items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4 md:items-center md:pb-6 md:mb-8">
        <div className="min-w-0">
          <span className="text-purple-400 text-[10px] md:text-xs font-black uppercase tracking-[0.16em] md:tracking-[0.2em] flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-fast"></span>
            {inventorySummary}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            THE ARCHIVES
          </h1>
        </div>

        <button
          onClick={() => setCartOpen(true)}
          className="motion-lift motion-press relative flex h-11 shrink-0 items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-black uppercase tracking-widest text-neutral-300 transition-all duration-300 hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer sm:px-5"
        >
          <ShoppingBag size={14} />
          <span className="hidden sm:inline">MY BAG</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-purple-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-sans shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      <div className="motion-panel sticky top-[4.75rem] z-30 -mx-3 mb-5 flex flex-col gap-3 border-y border-white/5 bg-[#050505]/95 px-3 py-3 shadow-[0_16px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:-mx-6 sm:px-6 md:static md:top-auto md:z-auto md:mx-0 md:mb-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0 lg:flex-row lg:items-center lg:gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-3.5 text-neutral-500 md:top-4" size={16} />
          <input
            type="text"
            placeholder="Search the archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-white/5 bg-[#111]/70 px-11 text-xs text-white outline-none transition-colors focus:border-purple-500 md:h-auto md:px-12 md:py-4"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-3.5 text-neutral-500 hover:text-white md:top-4">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:pb-0 lg:flex lg:items-center">
          <label className="relative min-w-[142px] flex-1 md:min-w-0">
            <span className="sr-only">Category</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-3 text-neutral-500 md:top-3.5" size={14} />
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-white/5 bg-[#050505] pl-9 pr-7 text-[9px] font-black uppercase tracking-[0.14em] text-neutral-300 outline-none transition-colors focus:border-purple-500 md:h-11 md:text-[10px] md:tracking-widest lg:w-44"
            >
              <option value={ALL_FILTER_VALUE}>All Categories</option>
              {filterOptions.categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="relative min-w-[110px] flex-1 md:min-w-0">
            <span className="sr-only">Size</span>
            <select
              value={selectedSize}
              onChange={(event) => setSelectedSize(event.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-white/5 bg-[#050505] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-neutral-300 outline-none transition-colors focus:border-purple-500 md:h-11 md:text-[10px] md:tracking-widest lg:w-32"
            >
              <option value={ALL_FILTER_VALUE}>All Sizes</option>
              {filterOptions.sizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>

          <label className="relative min-w-[132px] flex-1 md:min-w-0">
            <span className="sr-only">Availability</span>
            <select
              value={selectedAvailability}
              onChange={(event) => setSelectedAvailability(event.target.value as AvailabilityFilter)}
              className="h-10 w-full cursor-pointer rounded-lg border border-white/5 bg-[#050505] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-neutral-300 outline-none transition-colors focus:border-purple-500 md:h-11 md:text-[10px] md:tracking-widest lg:w-40"
            >
              <option value="all">Availability</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out Of Stock</option>
            </select>
          </label>

          <label className="relative min-w-[112px] flex-1 md:min-w-0">
            <span className="sr-only">Sort</span>
            <select
              value={selectedSort}
              onChange={(event) => setSelectedSort(event.target.value as ProductSort)}
              className="h-10 w-full cursor-pointer rounded-lg border border-white/5 bg-[#050505] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-neutral-300 outline-none transition-colors focus:border-purple-500 md:h-11 md:text-[10px] md:tracking-widest lg:w-40"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price Low</option>
              <option value="price-high">Price High</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="motion-card flex h-48 items-center justify-center md:h-64">
          <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Loading archives catalog from vault...
          </span>
        </div>
      ) : catalogError && products.length === 0 ? (
        <div className="motion-card flex h-56 flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-8 text-center md:h-64">
          <AlertCircle className="text-red-400 mb-4" size={24} />
          <span className="text-red-400 font-mono text-xs uppercase tracking-widest mb-2">
            {catalogError}
          </span>
          <button
            type="button"
            onClick={() => fetchProducts(true)}
            className="motion-press mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="motion-card flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-white/5 p-8 text-center md:h-64">
          <AlertCircle className="text-neutral-500 mb-4" size={24} />
          <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest mb-1">
            No matching archives found
          </span>
          <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest">
            Try adjusting your search filters
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {filteredProducts.map((product, index) => {
            const isOutOfStock = isProductOutOfStock(product);
            const isInCart = cart.some(item => item.product._id === product._id);
            const isSaved = wishlistIds.has(product._id);
            return (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className={`motion-card motion-lift group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-lg border border-white/5 bg-[#111]/30 p-2.5 transition-all duration-500 hover:border-purple-500/25 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] sm:p-3 md:p-5 ${isOutOfStock ? 'opacity-60' : ''}`}
                style={{ animationDelay: `${Math.min(index, 16) * 45}ms` }}
              >
                <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg border border-white/5 bg-[#050505] md:mb-4">
                  <img src={product.image} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute left-2 top-2 max-w-[calc(100%-4.5rem)] truncate rounded-md border border-white/5 bg-black/60 px-1.5 py-0.5 font-mono text-[7px] tracking-widest text-neutral-400 backdrop-blur-sm md:left-3 md:top-3 md:px-2 md:text-[8px]">
                    {product.category}
                  </span>
                  <span className="absolute right-2 top-2 rounded-md bg-purple-500/90 px-1.5 py-0.5 font-mono text-[7px] font-black tracking-wider text-white shadow-[0_0_8px_rgba(168,85,247,0.4)] md:right-3 md:top-3 md:px-2 md:text-[8px]">
                    SIZE {product.size}
                  </span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleWishlist(product);
                    }}
                    aria-label={isSaved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
                    className={`motion-press absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-all md:bottom-3 md:right-3 md:h-9 md:w-9 ${
                      isSaved
                        ? 'border-pink-400/40 bg-pink-500/20 text-pink-300'
                        : 'border-white/10 bg-black/60 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Heart size={15} className={isSaved ? 'fill-current' : ''} />
                  </button>
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="rotate-[-12deg] rounded-lg border-2 border-red-400/40 px-2 py-1 text-xs font-black uppercase tracking-widest text-red-400 md:px-4 md:text-lg">OUT OF STOCK</span>
                    </div>
                  )}
                </div>

                <div className="mb-3 min-h-[3.05rem] space-y-1 text-left md:mb-4">
                  <h3 className="line-clamp-2 text-[11px] font-black uppercase leading-[1.15] tracking-tight text-white transition-colors group-hover:text-purple-300 sm:text-xs md:text-sm md:leading-tight">
                    {product.name}
                  </h3>
                  <p className={`font-mono text-[8px] uppercase leading-tight tracking-[0.14em] md:text-[9px] md:tracking-widest ${getStockToneClass(product)}`}>
                    {getStockLabel(product)}
                  </p>
                </div>

                <div className="mt-auto flex flex-col items-stretch gap-2 border-t border-white/5 pt-3 md:flex-row md:items-center md:justify-between md:pt-4">
                  <span className="font-sans text-sm font-black text-white md:text-base">₹{product.price}</span>
                  {isOutOfStock ? (
                    <span className="rounded-lg border border-white/5 bg-neutral-800/50 px-2 py-2 text-center text-[8px] font-black uppercase tracking-[0.12em] text-neutral-500 md:px-4 md:py-2.5 md:text-[9px] md:tracking-widest">
                      OUT OF STOCK
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                      className={`motion-press flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[8px] font-black uppercase tracking-[0.12em] transition-all cursor-pointer md:min-h-0 md:px-4 md:py-2.5 md:text-[9px] md:tracking-widest ${
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
