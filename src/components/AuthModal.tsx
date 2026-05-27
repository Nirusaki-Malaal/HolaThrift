import React, { useState } from 'react';
import { X, Smartphone, Mail, ShieldCheck } from 'lucide-react';
import { AUTH_COOKIE_DAYS } from '@/constants/auth';
import { setCookie } from '@/utils/cookies';
import { getResponseError, readJson } from '@/utils/http';
import type { UserSession } from '@/types/user';

interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (user: UserSession) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps): React.JSX.Element | null {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleReset = (): void => {
    setStep('form');
    setEmail('');
    setPhone('');
    setOtp('');
    setError('');
  };

  const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (step === 'form') {
      if (mode === 'signup') {
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone }),
          });

          const data = await readJson<{ error?: string }>(response);
          if (!response.ok) {
            setError(getResponseError(data, 'Oops! We could not send your verification code. Please check your details.'));
            setLoading(false);
            return;
          }

          setStep('verify');
        } catch {
          setError('We had trouble connecting to our system. Please try again in a few seconds!');
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const data = await readJson<{ error?: string; requiresOtp?: boolean; token: string; user: UserSession }>(response);
          if (!response.ok) {
            setError(getResponseError(data, 'This email is not registered. Please sign up first!'));
            setLoading(false);
            return;
          }

          if (data.requiresOtp) {
            setStep('verify');
          } else {
            setCookie('auth_token', data.token, AUTH_COOKIE_DAYS);
            onSuccess(data.user);
            handleReset();
            onClose();
          }
        } catch {
          setError('We had trouble connecting to our system. Please try again in a few seconds!');
        } finally {
          setLoading(false);
        }
      }
      return;
    }


    const url = mode === 'login' ? '/api/auth/verify-login' : '/api/auth/verify-signup';
    const payload = { email, otp };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await readJson<{ error?: string; token: string; user: UserSession }>(response);
      if (!response.ok) {
        setError(getResponseError(data, 'Incorrect security code. Please try again!'));
        setLoading(false);
        return;
      }

      setCookie('auth_token', data.token, AUTH_COOKIE_DAYS);
      onSuccess(data.user);
      handleReset();
      onClose();
    } catch {
      setError('Connection failed. Let us try that again!');
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
      
      <div className="motion-modal relative bg-[#111] border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-left">
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
                  mode === 'login' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-neutral-400 hover:text-white'
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
                  mode === 'signup' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {mode === 'login' ? "Let's sign you in 👋" : 'Join the Hola Thrift family ✨'}
              </h2>
              <p className="text-neutral-400 text-xs mt-2 font-mono uppercase tracking-widest leading-relaxed">
                {mode === 'login'
                  ? 'Welcome back! Ready to explore the archives?'
                  : 'Unlock curated vintage items and exclusive releases'}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center mb-8">
            <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <ShieldCheck size={28} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Check your email 📬
            </h2>
            <p className="text-neutral-400 text-xs mt-2 font-sans leading-relaxed">
              {mode === 'login'
                ? 'To keep your account extra secure, we have sent a 6-digit login code to:'
                : 'To complete your registration, we have sent a 6-digit verification code to:'}
              <br />
              <span className="text-white font-bold font-mono text-sm block mt-1">{email}</span>
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
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] pl-12 pr-4 py-4 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {mode === 'signup' && (
                <div className="relative">
                  <Smartphone className="absolute left-4 top-4 text-neutral-500" size={16} />
                  <input
                    required
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#050505] pl-12 pr-4 py-4 rounded-xl border border-white/5 text-white text-xs outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="motion-press w-full py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Get Login Code' : 'Get my verification code'}
              </button>

              <div className="text-center mt-6 pt-6 border-t border-white/5">
                <p className="text-neutral-400 text-xs font-sans">
                  {mode === 'login' ? 'New to Hola Thrift?' : 'Already have an account?'}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setError('');
                    }}
                    className="text-white font-bold hover:underline cursor-pointer focus:outline-none ml-1.5 bg-transparent border-none p-0 inline"
                  >
                    {mode === 'login' ? 'Create an account' : 'Sign in'}
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <input
                  required
                  autoFocus
                  maxLength={6}
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#050505] py-4 rounded-xl border border-white/5 text-white text-center text-sm font-mono tracking-[0.4em] font-black outline-none focus:border-purple-500 transition-colors placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="motion-press w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-xl uppercase text-xs tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.35)] cursor-pointer"
              >
                {loading ? 'Verifying...' : mode === 'login' ? 'Verify & Sign In' : 'Verify & Complete Signup'}
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
