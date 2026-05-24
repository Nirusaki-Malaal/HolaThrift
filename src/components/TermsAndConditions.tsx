import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface TermsAndConditionsProps {
  readonly setActivePage: (page: string) => void;
}

export default function TermsAndConditions({ setActivePage }: TermsAndConditionsProps): React.JSX.Element {
  return (
    <div className="flex-grow max-w-4xl mx-auto px-4 pt-32 pb-20 w-full animate-fade-in-up relative z-10">
      <button
        onClick={() => setActivePage('home')}
        className="mb-8 flex items-center text-xs font-black tracking-widest text-neutral-400 hover:text-white transition-colors group cursor-pointer"
      >
        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" /> Back to Store
      </button>
      <div className="relative bg-[#111] border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="text-purple-500 animate-pulse-fast" size={32} />
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Terms & Conditions</h1>
          </div>
          <div className="space-y-6 text-neutral-400 text-sm leading-relaxed">
            <p>
              <strong className="text-white">1. Authenticity:</strong> All items sold on Hola Thrift are carefully curated, washed, and authenticated.
            </p>
            <p>
              <strong className="text-white">2. 1-of-1 Inventory:</strong> Items in your cart are not secured until checkout is fully completed.
            </p>
            <p>
              <strong className="text-white">3. Shipping:</strong> Orders are dispatched within 48 hours.
            </p>
            <p>
              <strong className="text-white">4. Order Cancellation:</strong> Once an order is placed and shipped, it cannot be cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
