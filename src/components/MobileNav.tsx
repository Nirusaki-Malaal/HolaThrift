import React from 'react';
import { Home, Archive, CircleUserRound, Shield, LogIn } from 'lucide-react';
import type { UserSession } from '@/types/user';

interface MobileNavProps {
  readonly activePage: string;
  readonly setActivePage: (page: string) => void;
  readonly user: UserSession | null;
  readonly isAdmin: boolean;
  readonly onLoginClick: () => void;
}

interface NavTabProps {
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly tone?: 'default' | 'admin';
}

function NavTab({ label, icon, isActive, onClick, tone = 'default' }: NavTabProps): React.JSX.Element {
  const activeClass = isActive
    ? tone === 'admin'
      ? 'text-purple-400'
      : 'text-white'
    : 'text-neutral-500';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors duration-200 cursor-pointer ${activeClass}`}
    >
      <span className="relative">
        {icon}
        {isActive && (
          <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-3.5 rounded-full ${tone === 'admin' ? 'bg-purple-400' : 'bg-white'}`} />
        )}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-0.5">{label}</span>
    </button>
  );
}

export default function MobileNav({ activePage, setActivePage, user, isAdmin, onLoginClick }: MobileNavProps): React.JSX.Element {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/5 bg-[#050505]/90 backdrop-blur-xl md:hidden safe-area-bottom">
      <div className="flex items-stretch h-[3.75rem]">
        <NavTab
          label="Home"
          icon={<Home size={19} />}
          isActive={activePage === 'home'}
          onClick={() => setActivePage('home')}
        />
        <NavTab
          label="Archives"
          icon={<Archive size={19} />}
          isActive={activePage === 'archives'}
          onClick={() => setActivePage('archives')}
        />
        {user ? (
          <>
            <NavTab
              label="Account"
              icon={<CircleUserRound size={19} />}
              isActive={activePage === 'profile'}
              onClick={() => setActivePage('profile')}
            />
            {isAdmin && (
              <NavTab
                label="Admin"
                icon={<Shield size={19} />}
                isActive={activePage === 'admin'}
                onClick={() => setActivePage('admin')}
                tone="admin"
              />
            )}
          </>
        ) : (
          <NavTab
            label="Login"
            icon={<LogIn size={19} />}
            isActive={false}
            onClick={onLoginClick}
          />
        )}
      </div>
    </nav>
  );
}
