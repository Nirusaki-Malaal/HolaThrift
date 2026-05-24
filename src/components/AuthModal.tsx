import React, { useState } from 'react';
import { X, Smartphone, Mail, Lock, ShieldCheck } from 'lucide-react';
import { setCookie } from '@/utils/cookies';

interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (user: { email: string; phone: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps): React.JSX.Element | null {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleReset = (): void => {
    setStep('form');
    setEmail('');
    setPhone('');
    setPassword('');
    setOtp('');
    setError('');
  };

  const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup' && step === 'form') {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, phone, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Failed to send verification code');
          setLoading(false);
          return;
        }

        setStep('verify');
      } catch (err) {
        setError('Database connection error');
      } finally {
        setLoading(false);
      }
      return;
    }

    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/verify-signup';
    const payload = mode === 'login' ? { email, password } : { email, otp };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      setCookie('auth_token', data.token, 1);
      onSuccess(data.user);
      handleReset();
      onClose();
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => {
          handleReset();
          onClose();
        }}
      ></div>
      
      <div className="relative bg-[#111] border border-white/10 w-full max-w-md rounded-[2rem] p-8 animate-fade-in-up shadow-[0_0_50px_rgba(168,85,247,0.25)] text-left">
        <button
          onClick={() => {
            handleReset();
            onClose();
          }}
          className="absolute top-6 right-6 text-neutral-500 hover:text-white cursor-pointer transition-colors"
        >
          <X size={20} />
        </button>

        {step === 'form' ? (
          <>
            <div className="flex bg-[#050505] p-1.5 rounded-2xl border border-white/5 mb-8 select-none">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                  mode === 'login' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                  mode === 'signup' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {mode === 'login' ? 'Welcome Back' : 'Join the Archive'}
              </h2>
              <p className="text-neutral-400 text-xs mt-2 font-mono uppercase tracking-widest">
                {mode === 'login' ? 'Securely access your saved items' : 'Gain full access to raw drops'}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center mb-8">
            <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <ShieldCheck size={28} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Verify Email
            </h2>
            <p className="text-neutral-400 text-xs mt-2 font-mono uppercase tracking-widest leading-relaxed">
              We sent a 6-digit verification code to
              <br />
              <span className="text-white font-bold">{email}</span>
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-6 text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleFormSubmit}>
          {step === 'form' ? (
            <>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-neutral-500" size={16} />
                <input
                  required
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] pl-12 pr-4 py-4 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {mode === 'signup' && (
                <div className="relative">
                  <Smartphone className="absolute left-4 top-4 text-neutral-500" size={16} />
                  <input
                    required
                    type="tel"
                    placeholder="PHONE NUMBER"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#050505] pl-12 pr-4 py-4 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-4 top-4 text-neutral-500" size={16} />
                <input
                  required
                  type="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#050505] pl-12 pr-4 py-4 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Authenticate' : 'Send Access Code'}
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                <input
                  required
                  autoFocus
                  maxLength={6}
                  type="text"
                  placeholder="6-DIGIT CODE"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#050505] py-4 rounded-xl border border-white/5 text-white text-center text-sm font-mono tracking-[0.4em] font-black outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-xl uppercase text-xs tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.35)] cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify and Create Account'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-center text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                Go Back
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
