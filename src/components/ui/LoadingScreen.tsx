import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  readonly text: string;
}

export default function LoadingScreen({ text }: LoadingScreenProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#050505] px-6 transform-gpu">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:42px_42px] animate-grid-flow"></div>
      <div className="absolute h-72 w-72 rounded-full border border-purple-500/10 blur-3xl loader-breathe"></div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center motion-modal">
        <div className="relative mb-10 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-purple-500/20"></div>
          <div className="loader-orbit absolute inset-2 rounded-full border border-transparent border-t-purple-400 border-r-blue-400 shadow-[0_0_28px_rgba(168,85,247,0.25)]"></div>
          <div className="loader-orbit absolute inset-5 rounded-full border border-transparent border-b-pink-400 border-l-purple-300 opacity-70" style={{ animationDirection: 'reverse', animationDuration: '2.6s' }}></div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.35)]">
            <Sparkles size={30} className="fill-current" />
          </div>
        </div>

        <span className="mb-8 text-4xl font-black uppercase italic tracking-tighter text-white md:text-5xl">
          Hola<span className="text-purple-500">Thrift</span>
        </span>

        <div className="relative mb-6 h-2 w-full max-w-[280px] overflow-hidden rounded-full border border-white/10 bg-[#111]">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-fill-bar shadow-[0_0_18px_rgba(168,85,247,0.65)]"></div>
          <div className="loader-scan absolute inset-y-0 left-0 w-24 bg-white/50 blur-sm"></div>
        </div>

        <p className="min-h-5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-400 sm:text-xs" aria-live="polite">
          {text}
        </p>
      </div>
    </div>
  );
}
