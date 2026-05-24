import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function Hero(): React.JSX.Element {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full h-screen transform-gpu overflow-hidden">
      <div className="relative perspective-1000 mb-8 select-none">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#111] to-[#222] border border-white/10 text-xs font-black text-white uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-3d-float backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-fast shadow-[0_0_10px_rgba(34,197,94,1)]"></span>
          Fresh Drops Live
        </div>
      </div>

      <h1 className="text-6xl md:text-8xl lg:text-[9.5rem] font-black tracking-tighter text-white uppercase leading-[0.85] select-none">
        <span className="relative inline-block glitch-text" data-text="RARE">RARE</span>
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 italic pr-2">
          GARMENTS.
        </span>
      </h1>

      <p className="mt-8 max-w-md md:max-w-xl text-sm md:text-base text-neutral-400 font-medium tracking-wide">
        Strictly curated 1-of-1 vintage & streetwear.
        <br className="hidden md:block" />
        Once it's gone, it's gone forever.
      </p>

      <button className="relative group mt-10 md:mt-12 inline-flex items-center justify-center px-8 py-4 text-sm font-black uppercase tracking-wider text-black bg-white rounded-full active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.7)] hover:bg-neutral-100 transform-gpu overflow-hidden cursor-pointer">
        <span className="relative z-10 flex items-center gap-2">
          Explore The Archive <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </button>
    </div>
  );
}
