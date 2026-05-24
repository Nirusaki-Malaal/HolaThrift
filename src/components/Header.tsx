import React, { useState } from 'react';
import { Sparkles, User, Menu, X } from 'lucide-react';

export default function Header(): React.JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

      <div className="hidden md:flex items-center">
        <button className="flex items-center space-x-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest text-neutral-300 hover:text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 cursor-pointer">
          <User size={14} />
          <span>LOGIN</span>
        </button>
      </div>

      <div className="flex md:hidden items-center">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#050505]/95 backdrop-blur-lg border-b border-white/5 flex flex-col p-6 space-y-4 md:hidden animate-fade-in shadow-2xl">
          <a
            href="#archive"
            className="text-neutral-400 hover:text-white font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Archive
          </a>
          <a
            href="#return"
            className="text-neutral-400 hover:text-white font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Return Policy
          </a>
          <a
            href="#tnc"
            className="text-neutral-400 hover:text-white font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Terms & Conditions
          </a>
          <button
            className="flex items-center justify-center space-x-2 bg-white text-black py-3.5 rounded-xl font-black text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <User size={14} />
            <span>LOGIN</span>
          </button>
        </div>
      )}
    </nav>
  );
}
