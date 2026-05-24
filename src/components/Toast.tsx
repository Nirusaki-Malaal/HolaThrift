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
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  };
  const Icon = icons[toast.type];

  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl ${colors[toast.type]} animate-slide-up min-w-[280px] max-w-sm`}>
      <Icon size={16} className="shrink-0" />
      <span className="text-xs font-bold uppercase tracking-wider flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="text-white/40 hover:text-white transition-colors cursor-pointer shrink-0">
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
