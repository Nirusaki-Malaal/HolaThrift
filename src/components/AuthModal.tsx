import React, { useState } from 'react';
import { X, Smartphone, Mail, Lock } from 'lucide-react';

interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (user: { email: string; phone: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps): React.JSX.Element | null {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload = mode === 'signup' ? { email, phone, password } : { email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      localStorage.setItem('auth_token', data.token);
      onSuccess(data.user);
      onClose();
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (): void => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setEmail('');
    setPhone('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#111] border border-white/10 w-full max-w-md rounded-[2rem] p-8 animate-fade-in-up shadow-[0_0_50px_rgba(168,85,247,0.25)] text-left">
        <button onClick={onClose} className="absolute top-6 right-6 text-neutral-500 hover:text-white cursor-pointer transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
            <Smartphone size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {mode === 'login' ? 'Login' : 'Signup'}
          </h2>
          <p className="text-neutral-400 text-xs mt-2 font-mono uppercase tracking-widest">
            {mode === 'login' ? 'Establish secure link' : 'Register your access keys'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-6 text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-neutral-500" size={16} />
            <input
              required
              autoFocus
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
            {loading ? 'Processing...' : mode === 'login' ? 'Authenticate' : 'Establish Keys'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-mono uppercase tracking-widest">
          <button onClick={handleModeSwitch} className="text-neutral-500 hover:text-white transition-colors cursor-pointer">
            {mode === 'login' ? 'Create new credentials' : 'Use existing credentials'}
          </button>
        </div>
      </div>
    </div>
  );
}
