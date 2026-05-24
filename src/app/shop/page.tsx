import React, { lazy, Suspense, useEffect, useState } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Header from '@/components/Header';
import Marquee from '@/components/Marquee';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import ToastContainer from '@/components/Toast';
import { LOADING_MESSAGES } from '@/constants/loading';
import { getCookie, deleteCookie } from '@/utils/cookies';
import { readJson } from '@/utils/http';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useTheme';
import type { UserSession } from '@/types/user';

const Hero = lazy(() => import('@/components/Hero'));
const ReturnPolicy = lazy(() => import('@/components/ReturnPolicy'));
const TermsAndConditions = lazy(() => import('@/components/TermsAndConditions'));
const Archives = lazy(() => import('@/components/Archives'));
const Profile = lazy(() => import('@/components/Profile'));
const AdminPanel = lazy(() => import('@/components/AdminPanel'));

function PageFallback(): React.JSX.Element {
  return (
    <div className="relative z-10 flex min-h-[55vh] items-center justify-center px-4 pt-28 text-center">
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 animate-pulse">
        Loading surface
      </span>
    </div>
  );
}

export default function Shop(): React.JSX.Element {
  const loadingMessages: readonly string[] = LOADING_MESSAGES;
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>(loadingMessages[0]);
  const [activePage, setActivePage] = useState<string>('home');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const { theme, toggleTheme } = useTheme();

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
            const data = await readJson<UserSession>(res);
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

  const handleExploreArchives = (): void => {
    handlePageChange('archives');
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
    <div className="text-white font-sans min-h-screen flex flex-col bg-[#050505] relative overflow-x-clip">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-flow"></div>
      
      <Header
        setActivePage={handlePageChange}
        onLoginClick={() => setIsAuthOpen(true)}
        user={currentUser}
        onLogout={handleLogout}
        isAdmin={Boolean(currentUser?.isAdmin)}
        theme={theme}
        onThemeToggle={toggleTheme}
        activePage={activePage}
      />
      
      <Suspense fallback={<PageFallback />}>
        {activePage === 'home' && (
          <>
            <Hero onExploreArchives={handleExploreArchives} />
            <Marquee />
          </>
        )}

        {activePage === 'return' && <ReturnPolicy setActivePage={handlePageChange} />}
        {activePage === 'tnc' && <TermsAndConditions setActivePage={handlePageChange} />}
        {activePage === 'archives' && <Archives user={currentUser} onLogout={handleLogout} onLoginRequired={() => setIsAuthOpen(true)} onToast={addToast} />}
        {activePage === 'profile' && <Profile user={currentUser} onLogout={handleLogout} onUserUpdate={setCurrentUser} onToast={addToast} />}
        {activePage === 'admin' && currentUser?.isAdmin && <AdminPanel />}
      </Suspense>

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
