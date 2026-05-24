import React, { useState } from 'react';
import { Sparkles, User, Menu, X, Sun, Moon } from 'lucide-react';
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
}

export default function Header({ setActivePage, onLoginClick, user, isAdmin, theme, onThemeToggle }: HeaderProps): React.JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const nextThemeLabel = theme === 'light' ? 'dark' : 'light';

  return (
    <nav className="motion-navbar fixed top-0 left-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => setActivePage('home')}>
        <div className="bg-white text-black p-1.5 rounded-lg group-hover:rotate-12 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          <Sparkles size={18} className="fill-current" />
        </div>
        <span className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic">
          HOLA<span className="text-purple-500">THRIFT</span>
        </span>
      </div>

      <div className="hidden md:flex items-center space-x-6">
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label={`Switch to ${nextThemeLabel} mode`}
          className="motion-press flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition-all hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] cursor-pointer"
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {user ? (
          <>
            <button
              onClick={() => setActivePage('archives')}
              className="motion-lift text-neutral-400 hover:text-white text-xs font-black uppercase tracking-widest cursor-pointer transition-colors"
            >
              ARCHIVES
            </button>
            <button
              onClick={() => setActivePage('profile')}
              className="motion-lift text-neutral-400 hover:text-white text-xs font-black uppercase tracking-widest cursor-pointer transition-colors"
            >
              MY ACCOUNT
            </button>
            {isAdmin && (
              <button
                onClick={() => setActivePage('admin')}
                className="motion-lift text-purple-400 hover:text-purple-300 text-xs font-black uppercase tracking-widest cursor-pointer transition-colors"
              >
                ADMIN PANEL
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onLoginClick}
            className="motion-lift motion-press flex items-center space-x-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest text-neutral-300 hover:text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 cursor-pointer"
          >
            <User size={14} />
            <span>LOGIN</span>
          </button>
        )}
      </div>

      <div className="flex md:hidden items-center gap-2">
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label={`Switch to ${nextThemeLabel} mode`}
          className="motion-press flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition-all hover:text-white cursor-pointer"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#050505]/95 backdrop-blur-lg border-b border-white/5 flex flex-col p-6 space-y-4 md:hidden animate-slide-up shadow-2xl">
          <button
            className="text-neutral-400 hover:text-white font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors text-left cursor-pointer"
            onClick={() => {
              setActivePage('home');
              setIsMobileMenuOpen(false);
            }}
          >
            Archive
          </button>
          <button
            className="text-neutral-400 hover:text-white font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors text-left cursor-pointer"
            onClick={() => {
              setActivePage('return');
              setIsMobileMenuOpen(false);
            }}
          >
            Return Policy
          </button>
          <button
            className="text-neutral-400 hover:text-white font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors text-left cursor-pointer"
            onClick={() => {
              setActivePage('tnc');
              setIsMobileMenuOpen(false);
            }}
          >
            Terms & Conditions
          </button>
          
          {user ? (
            <>
              <button
                className="text-neutral-400 hover:text-white font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors text-left cursor-pointer"
                onClick={() => {
                  setActivePage('archives');
                  setIsMobileMenuOpen(false);
                }}
              >
                Archives
              </button>
              <button
                className="text-neutral-400 hover:text-white font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors text-left cursor-pointer"
                onClick={() => {
                  setActivePage('profile');
                  setIsMobileMenuOpen(false);
                }}
              >
                My Account
              </button>
              {isAdmin && (
                <button
                  className="text-purple-400 hover:text-purple-300 font-bold text-xs tracking-widest uppercase py-2.5 border-b border-white/5 transition-colors text-left cursor-pointer"
                  onClick={() => {
                    setActivePage('admin');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Admin Panel
                </button>
              )}
            </>
          ) : (
            <button
              className="flex items-center justify-center space-x-2 bg-white text-black py-3.5 rounded-xl font-black text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer"
              onClick={() => {
                onLoginClick();
                setIsMobileMenuOpen(false);
              }}
            >
              <User size={14} />
              <span>LOGIN</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
