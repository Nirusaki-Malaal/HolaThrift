import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { getCookie } from '@/utils/cookies';

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

export default function AdminPanel(): React.JSX.Element {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Outerwear');
  const [price, setPrice] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchProducts = async (): Promise<void> => {
    setLoading(true);
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleResetForm = (): void => {
    setEditingId(null);
    setName('');
    setCategory('Outerwear');
    setPrice('');
    setSize('');
    setCondition('');
    setImage('');
    setDescription('');
    setError('');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);
    setError('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      const token = getCookie('auth_token');
      try {
        const res = await fetch('/api/products/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (res.ok) {
          setImage(data.url);
        } else {
          setError(data.error || 'Failed to upload image file');
        }
      } catch (err) {
        setError('Image uploading connection failed');
      } finally {
        setImageLoading(false);
      }
    };
  };

  const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    if (!name || !category || !price || !size || !condition || !image) {
      setError('All fields except description are required');
      setSubmitLoading(false);
      return;
    }

    const token = getCookie('auth_token');
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, category, price: Number(price), size, condition, image, description }),
      });

      const data = await res.json();
      if (res.ok) {
        setModalOpen(false);
        handleResetForm();
        await fetchProducts();
      } else {
        setError(data.error || 'Failed to save product record');
      }
    } catch (err) {
      setError('Database save connection failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (prod: ProductItem): void => {
    setEditingId(prod._id);
    setName(prod.name);
    setCategory(prod.category);
    setPrice(prod.price.toString());
    setSize(prod.size);
    setCondition(prod.condition);
    setImage(prod.image);
    setDescription(prod.description || '');
    setModalOpen(true);
  };

  const handleDeleteClick = async (id: string): Promise<void> => {
    if (!window.confirm('Are you absolutely sure you want to delete this product?')) return;
    const token = getCookie('auth_token');
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchProducts();
      } else {
        alert('Failed to delete product record');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-grow max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-20 w-full animate-fade-in relative z-10 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8 mb-12">
        <div>
          <span className="text-purple-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-fast"></span>
            Management Console
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            Product Administration
          </h1>
          <p className="text-neutral-500 font-mono text-xs mt-2 uppercase tracking-widest">
            Manage your store collections & inventory items
          </p>
        </div>
        <button
          onClick={() => {
            handleResetForm();
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        >
          <Plus size={14} />
          <span>Add Product</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Retrieving inventory status from database...
          </span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/5 rounded-[2rem] text-center p-8">
          <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest mb-2">
            No products found in database
          </span>
          <p className="text-neutral-600 text-[10px] font-mono uppercase tracking-widest max-w-sm leading-relaxed mb-6">
            Add items to make them visible in the streetwear archives storefront.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 border border-white/10 hover:border-white/20 text-white font-black rounded-lg text-[9px] uppercase tracking-widest cursor-pointer"
          >
            Launch Uploader Form
          </button>
        </div>
      ) : (
        <div className="bg-[#111]/40 border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="overflow-x-auto pr-2 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                  <th className="p-6">Thumbnail</th>
                  <th className="p-6">Name</th>
                  <th className="p-6">Category</th>
                  <th className="p-6">Price</th>
                  <th className="p-6">Size</th>
                  <th className="p-6">Condition</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <img
                        src={prod.image}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-white/5 bg-[#050505]"
                      />
                    </td>
                    <td className="p-6 font-bold text-white font-sans text-xs uppercase">{prod.name}</td>
                    <td className="p-6">{prod.category}</td>
                    <td className="p-6 text-white font-sans font-bold">₹{prod.price}</td>
                    <td className="p-6 text-purple-400 font-bold">{prod.size}</td>
                    <td className="p-6 text-neutral-400">{prod.condition}</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEditClick(prod)}
                          className="p-2 bg-white/5 border border-white/5 rounded-lg hover:border-white/20 hover:text-white cursor-pointer transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(prod._id)}
                          className="p-2 bg-red-500/10 border border-red-500/10 rounded-lg hover:bg-red-500 hover:text-white text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setModalOpen(false)}></div>
          
          <div className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(168,85,247,0.3)] text-left animate-fade-in-up">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                INVENTORY FORM
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-3">
                {editingId ? 'Edit Product Details' : 'Add New Streetwear Item'}
              </h2>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-neutral-500 font-mono text-[8px] uppercase tracking-widest block mb-2">Item Name</label>
                  <input
                    required
                    type="text"
                    placeholder="E.G. CARHARTT DETROIT JACKET"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-neutral-500 font-mono text-[8px] uppercase tracking-widest block mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors cursor-pointer"
                  >
                    <option value="Outerwear">Outerwear</option>
                    <option value="Tops">Tops</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-neutral-500 font-mono text-[8px] uppercase tracking-widest block mb-2">Price (INR)</label>
                  <input
                    required
                    type="number"
                    placeholder="E.G. 2499"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-neutral-500 font-mono text-[8px] uppercase tracking-widest block mb-2">Size</label>
                  <input
                    required
                    type="text"
                    placeholder="E.G. M or L"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-neutral-500 font-mono text-[8px] uppercase tracking-widest block mb-2">Condition</label>
                  <input
                    required
                    type="text"
                    placeholder="E.G. 9/10 MINT"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-500 font-mono text-[8px] uppercase tracking-widest block mb-2">Item Description</label>
                <textarea
                  placeholder="OPTIONAL DESCRIPTION"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-neutral-500 font-mono text-[8px] uppercase tracking-widest block mb-2">Item Image</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    placeholder="IMAGE URL OR FILE UPLOADER"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="file-upload-input"
                    />
                    <label
                      htmlFor="file-upload-input"
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 text-xs font-black uppercase cursor-pointer flex items-center gap-1"
                    >
                      {imageLoading ? <RefreshCw size={12} className="animate-spin" /> : 'Choose'}
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading || imageLoading}
                className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer mt-6"
              >
                {submitLoading ? 'Saving changes...' : editingId ? 'Update Streetwear Item' : 'Upload Streetwear Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
