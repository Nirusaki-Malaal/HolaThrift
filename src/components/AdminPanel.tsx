import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { getCookie } from '@/utils/cookies';
import AdminHeader from './admin/AdminHeader';
import AdminInventoryTable from './admin/AdminInventoryTable';
import ProductFormModal from './admin/ProductFormModal';
import {
  createEmptyProductForm,
  isProductFormComplete,
  productFormToPayload,
  productToFormValues,
  toProductStatus,
} from './admin/form';
import type { ProductFormValues, ProductItem } from './admin/types';

export default function AdminPanel(): React.JSX.Element {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(createEmptyProductForm);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchProducts = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to load inventory');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError('Inventory could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateFormValues = (values: Partial<ProductFormValues>): void => {
    setFormValues((currentValues) => ({ ...currentValues, ...values }));
  };

  const resetForm = (): void => {
    setEditingId(null);
    setFormValues(createEmptyProductForm());
    setError('');
  };

  const openCreateModal = (): void => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    resetForm();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageLoading(true);
    setError('');

    const reader = new FileReader();

    reader.onload = async () => {
      const token = getCookie('auth_token');
      if (!token) {
        setError('Admin session expired. Please sign in again.');
        setImageLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/products/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image: reader.result }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to upload image file');
        updateFormValues({ image: data.url });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setImageLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Image file could not be read');
      setImageLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');

    if (!isProductFormComplete(formValues)) {
      setError('All fields except description are required');
      return;
    }

    const payload = productFormToPayload(formValues);
    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      setError('Price must be a valid positive number');
      return;
    }

    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      return;
    }

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    setSubmitLoading(true);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save product record');
      closeModal();
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database save failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (product: ProductItem): void => {
    setEditingId(product._id);
    setFormValues(productToFormValues(product));
    setError('');
    setModalOpen(true);
  };

  const handleDeleteClick = async (id: string): Promise<void> => {
    if (!window.confirm('Are you absolutely sure you want to delete this product?')) return;

    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete product record');
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product record');
    }
  };

  const handleToggleStock = async (product: ProductItem): Promise<void> => {
    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      return;
    }

    const nextStatus = toProductStatus(product.status) === 'sold' ? 'available' : 'sold';

    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: product.name,
          category: product.category,
          price: product.price,
          size: product.size,
          condition: product.condition,
          image: product.image,
          description: product.description || '',
          status: nextStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update stock status');
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock status');
    }
  };

  return (
    <div className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-28 sm:pt-32 pb-20 text-left animate-fade-in">
      <AdminHeader onAddProduct={openCreateModal} />

      {error && !modalOpen && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-white/5 bg-[#111]/20">
          <span className="text-center text-[10px] font-mono uppercase tracking-widest text-neutral-500 animate-pulse">
            Retrieving inventory status from database
          </span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-8 text-center">
          <span className="mb-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
            No products found in database
          </span>
          <p className="mb-6 max-w-sm text-[10px] font-mono uppercase leading-relaxed tracking-widest text-neutral-600">
            Add items to make them visible in the streetwear archives storefront.
          </p>
          <button
            onClick={openCreateModal}
            className="rounded-lg border border-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white transition-colors hover:border-white/20 hover:bg-white/5"
          >
            Launch Uploader Form
          </button>
        </div>
      ) : (
        <AdminInventoryTable
          products={products}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onToggleStock={handleToggleStock}
        />
      )}

      <ProductFormModal
        isOpen={modalOpen}
        isEditing={Boolean(editingId)}
        values={formValues}
        error={error}
        imageLoading={imageLoading}
        submitLoading={submitLoading}
        onClose={closeModal}
        onChange={updateFormValues}
        onImageChange={handleImageChange}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
