import React from 'react';
import { Plus } from 'lucide-react';

interface AdminHeaderProps {
  readonly onAddProduct: () => void;
}

export default function AdminHeader({ onAddProduct }: AdminHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 border-b border-white/5 pb-8 mb-8 sm:mb-10 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <span className="text-purple-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-fast"></span>
          Management Console
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
          Product Administration
        </h1>
        <p className="text-neutral-500 font-mono text-xs mt-3 uppercase tracking-widest leading-relaxed">
          Manage your store collections and inventory items
        </p>
      </div>
      <button
        onClick={onAddProduct}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300 hover:bg-purple-600 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] sm:w-auto"
      >
        <Plus size={14} />
        <span>Add Product</span>
      </button>
    </div>
  );
}
