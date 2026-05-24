import React from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

interface ReturnPolicyProps {
  readonly setActivePage: (page: string) => void;
}

export default function ReturnPolicy({ setActivePage }: ReturnPolicyProps): React.JSX.Element {
  return (
    <div className="flex-grow max-w-4xl mx-auto px-4 pt-32 pb-20 w-full animate-fade-in-up relative z-10">
      <button
        onClick={() => setActivePage('home')}
        className="mb-8 flex items-center text-xs font-black tracking-widest text-neutral-400 hover:text-white transition-colors group cursor-pointer"
      >
        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" /> Back to Store
      </button>
      <div className="relative bg-[#111] border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <RefreshCcw className="text-purple-500 animate-pulse-fast" size={32} />
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Return Policy</h1>
          </div>
          <div className="space-y-6 text-neutral-400 text-sm leading-relaxed">
            <div className="bg-purple-500/10 border border-purple-500/30 p-5 rounded-2xl text-purple-200 mb-6 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <strong className="text-white">Strict Policy:</strong> We do not offer returns or exchanges for sizing issues. Please check the exact measurements provided in the description before purchasing.
            </div>
            <p>
              <strong className="text-white">The "Unboxing Video" Rule:</strong> Returns or refunds are ONLY accepted if the item is severely damaged in transit or a wrong item is sent. To claim this, a continuous, unedited unboxing video from sealed package to defect reveal is 100% mandatory.
            </p>
            <p>
              <strong className="text-white">Process:</strong> If you face an issue, DM us the unboxing video on Instagram @holathrifttt within 24 hours of delivery. No claims will be entertained without the video.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
