import React, { useEffect, useState } from 'react';
import { AlertCircle, Boxes, Mail, ReceiptText, UsersRound } from 'lucide-react';
import { getCookie } from '@/utils/cookies';
import { getResponseError, readJson } from '@/utils/http';
import AdminHeader from './admin/AdminHeader';
import AdminEmailPanel from './admin/AdminEmailPanel';
import AdminInventoryTable from './admin/AdminInventoryTable';
import AdminOrdersTable from './admin/AdminOrdersTable';
import AdminUsersPanel from './admin/AdminUsersPanel';
import ProductFormModal from './admin/ProductFormModal';
import {
  createEmptyProductForm,
  isProductFormComplete,
  productFormToPayload,
  productToFormValues,
} from './admin/form';
import { getStockCount } from '@/utils/inventory';
import type { ProductFormValues, ProductItem } from './admin/types';
import type { OrderRecord } from '@/types/order';
import type { AdminEmailPayload, AdminEmailUser } from './admin/AdminEmailPanel';
import type { AdminUserRecord, AdminUserUpdate } from './admin/AdminUsersPanel';

type AdminView = 'inventory' | 'orders' | 'users' | 'emails';

export default function AdminPanel(): React.JSX.Element {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [emailUsers, setEmailUsers] = useState<AdminEmailUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [adminUsersLoading, setAdminUsersLoading] = useState<boolean>(true);
  const [userSavingId, setUserSavingId] = useState<string>('');
  const [emailUsersLoading, setEmailUsersLoading] = useState<boolean>(true);
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailResult, setEmailResult] = useState<string>('');
  const [emailValues, setEmailValues] = useState<AdminEmailPayload>({
    target: 'all',
    email: '',
    subject: '',
    message: '',
  });
  const [activeView, setActiveView] = useState<AdminView>('inventory');
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
      const data = await readJson(response);
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError('Inventory could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (): Promise<void> => {
    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    try {
      const response = await fetch('/api/orders/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to load orders'));
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Orders could not be loaded');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchEmailUsers = async (): Promise<void> => {
    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      setEmailUsersLoading(false);
      return;
    }

    setEmailUsersLoading(true);
    try {
      const response = await fetch('/api/user/admin/email-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to load users'));
      setEmailUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Users could not be loaded');
    } finally {
      setEmailUsersLoading(false);
    }
  };

  const fetchAdminUsers = async (): Promise<void> => {
    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      setAdminUsersLoading(false);
      return;
    }

    setAdminUsersLoading(true);
    try {
      const response = await fetch('/api/user/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to load users'));
      setAdminUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin users could not be loaded');
    } finally {
      setAdminUsersLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchProducts();
      fetchOrders();
      fetchEmailUsers();
      fetchAdminUsers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateFormValues = (values: Partial<ProductFormValues>): void => {
    setFormValues((currentValues) => ({ ...currentValues, ...values }));
  };

  const updateEmailValues = (values: Partial<AdminEmailPayload>): void => {
    setEmailValues((currentValues) => ({ ...currentValues, ...values }));
    setEmailResult('');
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
        const data = await readJson<{ url?: string }>(response);
        if (!response.ok) throw new Error(getResponseError(data, 'Failed to upload image file'));
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
    if (!Number.isFinite(payload.stock) || payload.stock < 0) {
      setError('Stock must be zero or a positive number');
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
      const data = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to save product record'));
      closeModal();
      await fetchProducts();
      await fetchOrders();
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
      const data = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to delete product record'));
      await fetchProducts();
      await fetchOrders();
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

    const nextStock = getStockCount(product) > 0 ? 0 : 1;

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
          stock: nextStock,
          image: product.image,
          description: product.description || '',
        }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to update stock status'));
      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock status');
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');
    setEmailResult('');

    if (!emailValues.subject.trim() || !emailValues.message.trim()) {
      setError('Email subject and message are required');
      return;
    }
    if (emailValues.target === 'user' && !emailValues.email) {
      setError('Select a user before sending an individual email');
      return;
    }

    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      return;
    }

    setEmailSending(true);
    try {
      const response = await fetch('/api/user/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailValues),
      });
      const data = await readJson<{ sent?: number; total?: number; failed?: string[] }>(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to send email'));
      const failedCount = Array.isArray(data.failed) ? data.failed.length : 0;
      setEmailResult(`Sent ${data.sent || 0} of ${data.total || 0} emails${failedCount > 0 ? `, ${failedCount} failed` : ''}`);
      setEmailValues((currentValues) => ({ ...currentValues, subject: '', message: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email send failed');
    } finally {
      setEmailSending(false);
    }
  };

  const handleUserUpdate = async (id: string, values: AdminUserUpdate): Promise<void> => {
    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      return;
    }

    setError('');
    setUserSavingId(id);
    try {
      const response = await fetch(`/api/user/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to update user'));
      await fetchAdminUsers();
      await fetchEmailUsers();
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User update failed');
    } finally {
      setUserSavingId('');
    }
  };

  const handleUserDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Delete this user account? Orders will stay visible for admin records.')) return;
    const token = getCookie('auth_token');
    if (!token) {
      setError('Admin session expired. Please sign in again.');
      return;
    }

    setError('');
    setUserSavingId(id);
    try {
      const response = await fetch(`/api/user/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(data, 'Failed to delete user'));
      await fetchAdminUsers();
      await fetchEmailUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User delete failed');
    } finally {
      setUserSavingId('');
    }
  };

  return (
    <div className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-28 sm:pt-32 pb-20 text-left animate-fade-in">
      <AdminHeader onAddProduct={openCreateModal} />

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-white/5 bg-[#111]/30 p-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setActiveView('inventory')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeView === 'inventory' ? 'bg-white text-black' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Boxes size={14} />
          <span>Inventory</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('orders')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeView === 'orders' ? 'bg-white text-black' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ReceiptText size={14} />
          <span>Placed Orders</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('emails')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeView === 'emails' ? 'bg-white text-black' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Mail size={14} />
          <span>Emails</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('users')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeView === 'users' ? 'bg-white text-black' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <UsersRound size={14} />
          <span>Users</span>
        </button>
      </div>

      {error && !modalOpen && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeView === 'inventory' && (loading ? (
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
      ))}

      {activeView === 'orders' && (ordersLoading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-white/5 bg-[#111]/20">
          <span className="text-center text-[10px] font-mono uppercase tracking-widest text-neutral-500 animate-pulse">
            Retrieving placed orders from database
          </span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-8 text-center">
          <span className="mb-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
            No placed orders found
          </span>
          <p className="max-w-sm text-[10px] font-mono uppercase leading-relaxed tracking-widest text-neutral-600">
            Paid customer orders will appear here with delivery and payment status.
          </p>
        </div>
      ) : (
        <AdminOrdersTable orders={orders} />
      ))}

      {activeView === 'emails' && (
        <AdminEmailPanel
          users={emailUsers}
          loading={emailUsersLoading}
          sending={emailSending}
          result={emailResult}
          values={emailValues}
          onChange={updateEmailValues}
          onSubmit={handleEmailSubmit}
        />
      )}

      {activeView === 'users' && (
        <AdminUsersPanel
          users={adminUsers}
          loading={adminUsersLoading}
          savingId={userSavingId}
          onUpdate={handleUserUpdate}
          onDelete={handleUserDelete}
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
