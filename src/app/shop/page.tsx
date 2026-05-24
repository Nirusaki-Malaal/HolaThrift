import React, { useState, useEffect } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import Footer from '@/components/Footer';
import ReturnPolicy from '@/components/ReturnPolicy';
import TermsAndConditions from '@/components/TermsAndConditions';
import AuthModal from '@/components/AuthModal';
import Archives from '@/components/Archives';
import Profile from '@/components/Profile';
import AdminPanel from '@/components/AdminPanel';
import ToastContainer from '@/components/Toast';
import { LOADING_MESSAGES } from '@/constants/loading';
import { getCookie, deleteCookie } from '@/utils/cookies';
import { useToast } from '@/hooks/useToast';
import type { UserSession } from '@/types/user';

export default function Shop(): React.JSX.Element {
  const loadingMessages: readonly string[] = LOADING_MESSAGES;
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>(loadingMessages[0]);
  const [activePage, setActivePage] = useState<string>('home');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const textTimeout = setTimeout(() => {
      setLoadingText(loadingMessages[1]);
    }, 1500);

    const finishTimeout = setTimeout(() => {
      setAppLoading(false);
    }, 3000);

    const loadSession = async (): Promise<void> => {
      const token = getCookie('auth_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
          } else {
            deleteCookie('auth_token');
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    loadSession();

    return () => {
      clearTimeout(textTimeout);
      clearTimeout(finishTimeout);
    };
  }, [loadingMessages]);

  const handlePageChange = (page: string): void => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLoginSuccess = (user: UserSession): void => {
    setCurrentUser(user);
    addToast('success', 'Welcome back!');
    handlePageChange('archives');
  };

  const handleLogout = (): void => {
    deleteCookie('auth_token');
    setCurrentUser(null);
    handlePageChange('home');
  };

  const showFooter = activePage === 'home' || activePage === 'return' || activePage === 'tnc';

  if (appLoading) {
    return <LoadingScreen text={loadingText} />;
  }

  return (
    <div className="text-white font-sans min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-flow"></div>
      
      <Header
        setActivePage={handlePageChange}
        onLoginClick={() => setIsAuthOpen(true)}
        user={currentUser}
        onLogout={handleLogout}
        isAdmin={Boolean(currentUser?.isAdmin)}
      />
      
      {activePage === 'home' && (
        <>
          <Hero />
          <Marquee />
        </>
      )}

      {activePage === 'return' && <ReturnPolicy setActivePage={handlePageChange} />}
      {activePage === 'tnc' && <TermsAndConditions setActivePage={handlePageChange} />}
      {activePage === 'archives' && <Archives user={currentUser} onLogout={handleLogout} onToast={addToast} />}
      {activePage === 'profile' && <Profile user={currentUser} onLogout={handleLogout} onUserUpdate={setCurrentUser} onToast={addToast} />}
      {activePage === 'admin' && currentUser?.isAdmin && <AdminPanel />}

      {showFooter && <Footer setActivePage={handlePageChange} />}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
