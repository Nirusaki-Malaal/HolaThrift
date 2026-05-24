import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface FooterProps {
  readonly setActivePage: (page: string) => void;
}

export default function Footer({ setActivePage }: FooterProps): React.JSX.Element {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 pt-12 md:pt-16 pb-8 mt-auto relative overflow-hidden w-full">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-purple-900/10 rounded-[100%] blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12 text-left">
          <div className="col-span-2 md:col-span-1">
            <div
              className="flex items-center space-x-2 mb-4 md:mb-6 cursor-pointer inline-flex group"
              onClick={() => setActivePage('home')}
            >
              <div className="bg-white text-black p-1 rounded-lg group-hover:rotate-12 transition-all duration-300">
                <Sparkles size={16} className="fill-current" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                HOLA<span className="text-purple-500">THRIFT</span>
              </span>
            </div>
            <p className="hidden md:block text-neutral-400 text-sm leading-relaxed mb-6 font-medium">
              Curating the most exclusive, high-quality vintage and pre-loved fashion. Every piece is unique, handpicked, and ready for a second life. Sustainably styling the future.
            </p>
          </div>

          <div className="col-span-1 md:pl-12">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-4 md:mb-6">The Store</h4>
            <ul className="space-y-3 md:space-y-4 text-xs font-bold text-neutral-400">
              <li>
                <button
                  onClick={() => setActivePage('return')}
                  className="hover:text-purple-500 transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                >
                  <ArrowRight size={12} className="text-neutral-600" /> Return Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('tnc')}
                  className="hover:text-purple-500 transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                >
                  <ArrowRight size={12} className="text-neutral-600" /> Terms & Conditions
                </button>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-purple-500 transition-colors uppercase tracking-widest flex items-center gap-2"
                >
                  <ArrowRight size={12} className="text-neutral-600" /> Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-4 md:mb-6">Hit Us Up</h4>
            <ul className="space-y-3 md:space-y-4 text-xs md:text-sm font-medium text-neutral-400">
              <li className="flex items-center gap-3">
                <span className="text-lg select-none">📸</span>
                <a
                  href="https://instagram.com/holathrifttt"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  @holathrifttt
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg select-none">📞</span>
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg select-none">✉️</span>
                <a href="mailto:support@holathrift.in" className="hover:text-white transition-colors">
                  support@holathrift.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-600 font-medium tracking-wide">
          <p>© 2026 Hola Thrift. All rights reserved.</p>
          <p className="mt-2 md:mt-0 select-none">Curated with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
}
