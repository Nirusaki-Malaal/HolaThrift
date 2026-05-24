import React from 'react';
import { Sparkles, Search, User, Package, ShoppingBag } from 'lucide-react';

export default function Header(): React.JSX.Element {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center space-x-2 cursor-pointer group">
        <div className="bg-white text-black p-1.5 rounded-lg group-hover:rotate-12 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          <Sparkles size={18} className="fill-current" />
        </div>
        <span className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic">
          HOLA<span className="text-purple-500">THRIFT</span>
        </span>
      </div>
      <div className="flex items-center space-x-4 md:space-x-6">
        <button className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <Search size={20} />
        </button>
        <button className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <User size={20} />
        </button>
        <button className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <Package size={20} />
        </button>
        <button className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <ShoppingBag size={20} />
        </button>
      </div>
    </nav>
  );
}
