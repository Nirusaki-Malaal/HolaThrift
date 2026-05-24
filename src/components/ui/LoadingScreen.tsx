import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  readonly text: string;
}

export default function LoadingScreen({ text }: LoadingScreenProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center px-6 transform-gpu">
      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        <div className="flex items-center space-x-3 mb-16 animate-pulse-fast">
          <div className="bg-white text-black p-2.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.8)]">
            <Sparkles size={32} className="fill-current" />
          </div>
          <span className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic glitch-text" data-text="HolaThrift">
            Hola<span className="text-purple-500">Thrift</span>
          </span>
        </div>
        <div className="w-full max-w-[240px] bg-[#111] h-1.5 rounded-full overflow-hidden mb-8 border border-white/5">
          <div className="bg-purple-500 h-full animate-fill-bar shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div>
        </div>
        <p className="text-[10px] sm:text-xs text-neutral-400 font-mono uppercase tracking-[0.2em] text-center">
          {text}
        </p>
      </div>
    </div>
  );
}