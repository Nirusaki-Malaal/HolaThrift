import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, X, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
import { getCookie } from '@/utils/cookies';
import CheckoutModal from './CheckoutModal';

interface ProductItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  size: string;
  condition: string;
  image: string;
  description?: string;
}

interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface ArchivesProps {
  readonly user: { email: string; phone: string } | null;
  readonly onLogout: () => void;
}

export default function Archives({ user }: ArchivesProps): React.JSX.Element {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();

    const storedCart = localStorage.getItem('hola_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCart = (newCart: CartItem[]): void => {
    setCart(newCart);
    localStorage.setItem('hola_cart', JSON.stringify(newCart));
  };

  const handleAddToCart = (product: ProductItem): void => {
    const existing = cart.find((item) => item.product._id === product._id);
    if (existing) {
      const updated = cart.map((item) =>
        item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      );
      saveCart(updated);
    } else {
      const updated = [...cart, { product, quantity: 1 }];
      saveCart(updated);
    }
    setCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, amount: number): void => {
    const updated = cart
      .map((item) => {
        if (item.product._id === productId) {
          const newQty = item.quantity + amount;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter((item): item is CartItem => item !== null);
    saveCart(updated);
  };

  const handleRemoveFromCart = (productId: string): void => {
    const updated = cart.filter((item) => item.product._id !== productId);
    saveCart(updated);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handlePaymentSuccess = async (txnId: string): Promise<void> => {
    const token = getCookie('auth_token');
    if (!token) return;

    try {
      const orderItems = cart.map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      }));

      await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          total: cartTotal,
          transactionId: txnId,
        }),
      });

      saveCart([]);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSize = selectedSize === 'All' || prod.size === selectedSize;

    return matchesSearch && matchesCategory && matchesSize;
  });

  return (
    <div className="flex-grow max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-20 w-full animate-fade-in relative z-10 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8 mb-12">
        <div>
          <span className="text-purple-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-fast"></span>
            Access Status: Secured
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            THE ARCHIVES
          </h1>
          <p className="text-neutral-500 font-mono text-xs mt-2 uppercase tracking-widest">
            Logged in as: <span className="text-white font-bold">{user?.email || 'Guest'}</span>
          </p>
        </div>

        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2.5 bg-white/5 border border-white/10 text-neutral-300 hover:text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] px-5 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer"
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

      <div className="flex flex-col lg:flex-row gap-6 mb-12 items-stretch lg:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-4 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Search streetwear archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111]/40 px-12 py-4 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-[#050505] p-1 rounded-xl border border-white/5">
            {['All', 'Outerwear', 'Tops', 'Accessories'].map((cat) => (
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
            {['All', 'S', 'M', 'L', 'XL'].map((sz) => (
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
        <div className="flex items-center justify-center h-64">
          <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Loading archives catalog from vault...
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/5 rounded-[2rem] text-center p-8">
          <AlertCircle className="text-neutral-500 mb-4" size={24} />
          <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest mb-1">
            No matching archives found
          </span>
          <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest">
            Try adjusting your search filters
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="group relative bg-[#111]/30 border border-white/5 rounded-[2rem] p-5 hover:border-purple-500/25 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-500 flex flex-col justify-between overflow-hidden"
            >
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-5 bg-[#050505] border border-white/5">
                <img
                  src={product.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-white/5 rounded-md text-[8px] font-mono tracking-widest text-neutral-400">
                  {product.category}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-purple-500/90 text-white font-mono text-[8px] font-black rounded-md tracking-wider shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                  SIZE {product.size}
                </span>
              </div>

              <div className="space-y-1 mb-6 text-left">
                <h3 className="text-white font-black text-sm uppercase leading-tight tracking-tight group-hover:text-purple-300 transition-colors">
                  {product.name}
                </h3>
                <p className="text-neutral-500 font-mono text-[9px] uppercase tracking-widest">
                  {product.condition}
                </p>
              </div>

              <div className="flex justify-between items-center mt-auto border-t border-white/5 pt-4">
                <span className="text-white font-black text-base font-sans">₹{product.price}</span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-black hover:bg-purple-500 hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_0_12px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
                >
                  <span>ADD TO BAG</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCartOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-[#0a0a0a] border-l border-white/10 h-full p-8 flex flex-col justify-between shadow-[-10px_0_50px_rgba(0,0,0,0.8)] animate-slide-in">
            <div>
              <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-purple-400" />
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">My Collection Bag</h2>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest mb-2">
                    Your collection bag is empty
                  </span>
                  <span className="text-neutral-600 font-mono text-[9px] uppercase tracking-widest">
                    Unlock unique streetwear pieces to proceed
                  </span>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar text-left">
                  {cart.map((item) => (
                    <div
                      key={item.product._id}
                      className="bg-[#111]/30 border border-white/5 rounded-2xl p-4 flex gap-4 items-center"
                    >
                      <img
                        src={item.product.image}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-white/5 bg-[#050505]"
                      />
                      <div className="flex-grow min-w-0">
                        <h4 className="text-white font-black text-xs uppercase truncate">{item.product.name}</h4>
                        <span className="text-purple-400 font-mono text-[9px] font-bold block mt-0.5">
                          SIZE: {item.product.size} // ₹{item.product.price}
                        </span>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center bg-[#050505] rounded-lg border border-white/5 p-0.5 font-mono text-[9px]">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.product._id, -1)}
                              className="px-2 py-0.5 text-neutral-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-2 text-white font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.product._id, 1)}
                              className="px-2 py-0.5 text-neutral-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.product._id)}
                        className="text-neutral-500 hover:text-red-400 p-2 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  <span>Bag Subtotal</span>
                  <span className="text-white font-black text-base font-sans">₹{cartTotal}</span>
                </div>
                
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  SECURE CHECKOUT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={checkoutOpen}
        total={cartTotal}
        onClose={() => setCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
