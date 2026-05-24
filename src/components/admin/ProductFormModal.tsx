import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { productCategories } from './form';
import type { ProductFormValues } from './types';

interface ProductFormModalProps {
  readonly isOpen: boolean;
  readonly isEditing: boolean;
  readonly values: ProductFormValues;
  readonly error: string;
  readonly imageLoading: boolean;
  readonly submitLoading: boolean;
  readonly onClose: () => void;
  readonly onChange: (values: Partial<ProductFormValues>) => void;
  readonly onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onSubmit: (event: React.FormEvent) => void;
}

export default function ProductFormModal({
  isOpen,
  isEditing,
  values,
  error,
  imageLoading,
  submitLoading,
  onClose,
  onChange,
  onImageChange,
  onSubmit,
}: ProductFormModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d0d0d] text-left shadow-[0_0_80px_rgba(168,85,247,0.3)] animate-fade-in-up">
        <button
          onClick={onClose}
          aria-label="Close inventory form"
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="shrink-0 border-b border-white/5 p-5 pr-14 sm:p-6 sm:pr-16">
          <span className="inline-flex rounded-md border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-purple-400">
            Inventory Form
          </span>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
            {isEditing ? 'Edit Product Details' : 'Add New Streetwear Item'}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="custom-scrollbar space-y-5 overflow-y-auto p-5 sm:p-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-red-500">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Item Name</label>
              <input
                required
                type="text"
                placeholder="Carhartt Detroit Jacket"
                value={values.name}
                onChange={(event) => onChange({ name: event.target.value })}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Category</label>
              <select
                value={values.category}
                onChange={(event) => onChange({ category: event.target.value })}
                className="w-full cursor-pointer rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              >
                {productCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Price (INR)</label>
              <input
                required
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="2499"
                value={values.price}
                onChange={(event) => onChange({ price: event.target.value })}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Size</label>
              <input
                required
                type="text"
                placeholder="M or L"
                value={values.size}
                onChange={(event) => onChange({ size: event.target.value })}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Stock Quantity</label>
              <input
                required
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="64"
                value={values.stock}
                onChange={(event) => onChange({ stock: event.target.value })}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Item Description</label>
            <textarea
              placeholder="Optional description"
              value={values.description}
              onChange={(event) => onChange({ description: event.target.value })}
              className="h-24 w-full resize-none rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Item Image</label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                required
                type="text"
                placeholder="Image URL or uploaded file URL"
                value={values.image}
                onChange={(event) => onChange({ image: event.target.value })}
                className="w-full min-w-0 rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
              <div className="relative shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                  id="file-upload-input"
                />
                <label
                  htmlFor="file-upload-input"
                  className="flex w-full min-w-[8rem] cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/10 sm:w-auto"
                >
                  {imageLoading ? <RefreshCw size={12} className="animate-spin" /> : 'Choose'}
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitLoading || imageLoading}
            className="mt-2 w-full cursor-pointer rounded-lg bg-white py-4 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLoading ? 'Saving Changes' : isEditing ? 'Update Streetwear Item' : 'Upload Streetwear Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
