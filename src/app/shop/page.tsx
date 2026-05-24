import React, { useState, useEffect } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { LOADING_MESSAGES } from '@/constants/loading';

export default function Shop(): React.JSX.Element {
  const loadingMessages: readonly string[] = LOADING_MESSAGES;
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>(loadingMessages[0]);

  useEffect(() => {
    // Replicates the downloaded project's exact timing & transition
    const textTimeout = setTimeout(() => {
      setLoadingText(loadingMessages[1]);
    }, 1500);

    const finishTimeout = setTimeout(() => {
      setAppLoading(false);
    }, 3000);

    return () => {
      clearTimeout(textTimeout);
      clearTimeout(finishTimeout);
    };
  }, [loadingMessages]);

  if (appLoading) {
    return <LoadingScreen text={loadingText} />;
  }

  return (
    <div className="text-white p-10 font-sans min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-flow"></div>
      
      <div className="relative z-10 text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic">
          Hola<span className="text-purple-500">Thrift</span>
        </h1>
        <p className="text-sm md:text-base text-neutral-400 font-mono tracking-wider max-w-md mx-auto">
          Premium Gen-Z Vintage Archive loaded successfully. 🚀
        </p>
      </div>
    </div>
  );
}