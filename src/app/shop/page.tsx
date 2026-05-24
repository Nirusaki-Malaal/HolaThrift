import React, { useState, useEffect } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import Footer from '@/components/Footer';
import ReturnPolicy from '@/components/ReturnPolicy';
import TermsAndConditions from '@/components/TermsAndConditions';
import { LOADING_MESSAGES } from '@/constants/loading';

export default function Shop(): React.JSX.Element {
  const loadingMessages: readonly string[] = LOADING_MESSAGES;
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>(loadingMessages[0]);
  const [activePage, setActivePage] = useState<string>('home');

  useEffect(() => {
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

  const handlePageChange = (page: string): void => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (appLoading) {
    return <LoadingScreen text={loadingText} />;
  }

  return (
    <div className="text-white font-sans min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-flow"></div>
      
      <Header setActivePage={handlePageChange} />
      
      {activePage === 'home' && (
        <>
          <Hero />
          <Marquee />
        </>
      )}

      {activePage === 'return' && <ReturnPolicy setActivePage={handlePageChange} />}
      {activePage === 'tnc' && <TermsAndConditions setActivePage={handlePageChange} />}

      <Footer setActivePage={handlePageChange} />
    </div>
  );
}