import React, { useState } from 'react';
import { Archive, CircleUserRound, FileText, Home, LogIn, Menu, Moon, RotateCcw, Shield, Sparkles, Sun, X } from 'lucide-react';
import type { UserSession } from '@/types/user';
import type { ThemeMode } from '@/hooks/useTheme';

interface HeaderProps {
  readonly setActivePage: (page: string) => void;
  readonly onLoginClick: () => void;
  readonly user: UserSession | null;
  readonly onLogout: () => void;
  readonly isAdmin: boolean;
  readonly theme: ThemeMode;
  readonly onThemeToggle: () => void;
  readonly activePage: string;
}

interface NavIconButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
  readonly tone?: 'default' | 'admin';
}

function NavIconButton({ label, onClick, children, tone = 'default' }: NavIconButtonProps): React.JSX.Element {
  const toneClass = tone === 'admin' ? 'text-purple-400 hover:text-purple-300' : 'text-neutral-300 hover:text-black';

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`motion-press flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] cursor-pointer ${toneClass}`}
    >
      {children}
    </button>
  );
}

export default function Header({ setActivePage, onLoginClick, user, isAdmin, theme, onThemeToggle, activePage }: HeaderProps): React.JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const isHome = activePage === 'home';
  const showArchivesLink = isHome || activePage === 'profile' || activePage === 'admin';
  const nextThemeLabel = theme === 'light' ? 'dark' : 'light';

  const goToPage = (page: string): void => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };

  const navClass = isHome
    ? 'motion-navbar fixed top-3 left-3 right-3 z-50 flex items-center justify-between rounded-2xl border border-white/10 bg-[#050505]/75 px-4 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 md:left-8 md:right-8 md:px-6'
    : 'motion-navbar fixed top-0 left-0 z-50 flex w-full items-center justify-between border-b border-white/5 bg-[#050505]/80 px-6 py-4 backdrop-blur-md transition-all duration-300 md:px-12';

  const brandTextClass = isHome ? 'text-lg md:text-xl' : 'text-xl md:text-2xl';

  return (
    <nav className={navClass}>
      <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => goToPage('home')}>
        <div className="bg-white text-black p-1.5 rounded-lg group-hover:rotate-12 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          <Sparkles size={18} className="fill-current" />
        </div>
        <span className={`${brandTextClass} font-black tracking-tighter text-white uppercase italic`}>
          HOLA<span className="text-purple-500">THRIFT</span>
        </span>
      </div>

      <div className={`hidden items-center md:flex ${isHome ? 'gap-3' : 'gap-5'}`}>
        {showArchivesLink && (
          <button
            type="button"
            onClick={() => goToPage('archives')}
            className="motion-lift motion-press flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-neutral-300 transition-all hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] cursor-pointer"
          >
            <Archive size={14} />
            <span>Archives</span>
          </button>
        )}

        <NavIconButton label={`Switch to ${nextThemeLabel} mode`} onClick={onThemeToggle}>
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </NavIconButton>

        {user ? (
          <>
            <NavIconButton label="My account" onClick={() => goToPage('profile')}>
              <CircleUserRound size={16} />
            </NavIconButton>
            {isAdmin && (
              <NavIconButton label="Admin panel" onClick={() => goToPage('admin')} tone="admin">
                <Shield size={16} />
              </NavIconButton>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="motion-lift motion-press flex items-center space-x-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-black tracking-widest text-neutral-300 transition-all duration-300 hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
          >
            <LogIn size={14} />
            <span>LOGIN</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <NavIconButton label={`Switch to ${nextThemeLabel} mode`} onClick={onThemeToggle}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </NavIconButton>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="motion-press flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-400 transition-colors hover:text-white cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-[calc(100%+0.75rem)] left-0 w-full rounded-2xl border border-white/10 bg-[#050505]/95 p-4 shadow-2xl backdrop-blur-xl md:hidden animate-slide-up">
          <div className="flex flex-col gap-2">
            {showArchivesLink ? (
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-neutral-300 transition-all hover:bg-white/5 hover:text-white cursor-pointer"
                onClick={() => goToPage('archives')}
              >
                <Archive size={15} />
                <span>Archives</span>
              </button>
            ) : (
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-neutral-300 transition-all hover:bg-white/5 hover:text-white cursor-pointer"
                onClick={() => goToPage('home')}
              >
                <Home size={15} />
                <span>Home</span>
              </button>
            )}

            <button
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-neutral-300 transition-all hover:bg-white/5 hover:text-white cursor-pointer"
              onClick={() => goToPage('return')}
            >
              <RotateCcw size={15} />
              <span>Return Policy</span>
            </button>

            <button
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-neutral-300 transition-all hover:bg-white/5 hover:text-white cursor-pointer"
              onClick={() => goToPage('tnc')}
            >
              <FileText size={15} />
              <span>Terms & Conditions</span>
            </button>

            {user ? (
              <>
                <button
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-neutral-300 transition-all hover:bg-white/5 hover:text-white cursor-pointer"
                  onClick={() => goToPage('profile')}
                >
                  <CircleUserRound size={15} />
                  <span>Account</span>
                </button>
                {isAdmin && (
                  <button
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-purple-400 transition-all hover:bg-purple-500/10 hover:text-purple-300 cursor-pointer"
                    onClick={() => goToPage('admin')}
                  >
                    <Shield size={15} />
                    <span>Admin</span>
                  </button>
                )}
              </>
            ) : (
              <button
                className="motion-press mt-2 flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] transition-all cursor-pointer"
                onClick={() => {
                  onLoginClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogIn size={14} />
                <span>LOGIN</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
