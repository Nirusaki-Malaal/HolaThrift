import React from 'react';

export default function Marquee(): React.JSX.Element {
  const items: readonly string[] = [
    "🔥 1-OF-1 VINTAGE",
    "100% AUTHENTIC",
    "FREE SHIPPING",
    "DAILY DROPS"
  ];

  const repeated = Array(8).fill(items).flat();

  return (
    <div className="fixed bottom-0 left-0 w-full overflow-hidden border-t border-white/5 bg-[#050505] py-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex whitespace-nowrap animate-marquee text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
        {repeated.map((item, index) => (
          <span key={index} className="mx-4 flex items-center select-none">
            {item.includes("🔥") ? (
              <span className="text-white">🔥 1-OF-1 VINTAGE</span>
            ) : item === "FREE SHIPPING" ? (
              <span className="text-purple-500">{item}</span>
            ) : (
              <span>{item}</span>
            )}
            <span className="ml-8 text-neutral-700">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
