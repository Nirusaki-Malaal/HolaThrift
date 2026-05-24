import React from 'react';

export default function Marquee(): React.JSX.Element {
  const items: readonly string[] = [
    "🔥 1-OF-1 VINTAGE",
    "100% AUTHENTIC",
    "FREE SHIPPING",
    "DAILY DROPS"
  ];

  const repeated = Array(4).fill(items).flat();

  return (
    <div className="motion-card relative w-full overflow-hidden border-y border-white/5 bg-[#0a0a0a] py-3.5 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex">
      <div className="flex whitespace-nowrap animate-marquee text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-neutral-500 select-none">
        {repeated.map((item, index) => (
          <span key={index} className="mx-4 flex items-center">
            {item.includes("🔥") ? (
              <span className="text-white">🔥 1-OF-1 VINTAGE</span>
            ) : item === "FREE SHIPPING" ? (
              <span className="text-purple-500">{item}</span>
            ) : (
              <span>{item}</span>
            )}
            <span className="ml-8 text-neutral-700 font-medium">•</span>
          </span>
        ))}
      </div>
      <div className="flex whitespace-nowrap animate-marquee text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-neutral-500 select-none" aria-hidden="true">
        {repeated.map((item, index) => (
          <span key={index} className="mx-4 flex items-center">
            {item.includes("🔥") ? (
              <span className="text-white">🔥 1-OF-1 VINTAGE</span>
            ) : item === "FREE SHIPPING" ? (
              <span className="text-purple-500">{item}</span>
            ) : (
              <span>{item}</span>
            )}
            <span className="ml-8 text-neutral-700 font-medium">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
