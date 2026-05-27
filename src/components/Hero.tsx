import React from 'react';
import { ArrowRight } from 'lucide-react';
import HeroScene from './HeroScene';

interface HeroProps {
  readonly onExploreArchives: () => void;
}

export default function Hero({ onExploreArchives }: HeroProps): React.JSX.Element {
  return (
    <section className="relative z-10 flex min-h-screen w-full items-center justify-center overflow-hidden px-4 text-center transform-gpu">
      <HeroScene />
      <div className="hero-overlay absolute inset-0 bg-black/35"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative perspective-1000 mb-8 select-none motion-hero-copy">
          <div className="hero-live-badge inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0b0d]/80 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md animate-3d-float">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse-fast"></span>
            Fresh Drops Live
          </div>
        </div>

        <h1 className="motion-hero-copy text-6xl md:text-8xl lg:text-[9.5rem] font-black tracking-tighter text-white uppercase leading-[0.85] select-none" style={{ animationDelay: '120ms' }}>
          <span className="relative inline-block glitch-text" data-text="RARE">RARE</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 italic pr-2">
            GARMENTS.
          </span>
        </h1>

        <p className="motion-hero-copy mt-8 max-w-md md:max-w-xl text-sm md:text-base font-medium tracking-wide text-neutral-400" style={{ animationDelay: '240ms' }}>
          Strictly curated 1-of-1 vintage & streetwear.
          <br className="hidden md:block" />
          Once it's gone, it's gone forever.
        </p>

        <button onClick={onExploreArchives} className="motion-hero-copy motion-shimmer motion-press relative group mt-10 md:mt-12 inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-wider text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 hover:bg-neutral-100 hover:shadow-[0_0_60px_rgba(255,255,255,0.7)] transform-gpu cursor-pointer" style={{ animationDelay: '360ms' }}>
          <span className="relative z-10 flex items-center gap-2">
            Explore The Archive <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>
      </div>
    </section>
  );
}
