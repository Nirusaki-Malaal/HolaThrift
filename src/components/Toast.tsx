import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import type { ToastData } from '@/hooks/useToast';

interface ToastProps {
  readonly toasts: ToastData[];
  readonly onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = { success: Check, error: AlertCircle, info: Info };
  const colors = {
    success: 'border-emerald-400/30 text-emerald-200 shadow-emerald-950/30',
    error: 'border-red-400/30 text-red-200 shadow-red-950/30',
    info: 'border-purple-400/30 text-purple-200 shadow-purple-950/30',
  };
  const Icon = icons[toast.type];

  return (
    <div className={`flex min-w-[280px] max-w-sm items-center gap-3 rounded-xl border bg-[#08080a]/95 px-5 py-3.5 shadow-2xl backdrop-blur-xl ${colors[toast.type]} animate-slide-up`}>
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 text-xs font-bold uppercase tracking-wider">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="shrink-0 cursor-pointer text-white/45 transition-colors hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }: ToastProps): React.JSX.Element {
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col-reverse gap-3">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
