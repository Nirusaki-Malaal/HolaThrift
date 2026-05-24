import React, { useState, useEffect } from 'react';
import { User, Shield, Package, Pencil, X, Check, Eye, EyeOff, Mail } from 'lucide-react';
import { getCookie } from '@/utils/cookies';

interface ProfileProps {
  readonly user: { email: string; phone: string; name?: string } | null;
  readonly onLogout: () => void;
  readonly onUserUpdate?: (user: any) => void;
  readonly onToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function Profile({ user, onLogout, onUserUpdate, onToast }: ProfileProps): React.JSX.Element {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'account' | 'orders'>('account');

  const [editingField, setEditingField] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>(user?.name || '');
  const [phoneInput, setPhoneInput] = useState<string>(user?.phone || '');
  const [emailInput, setEmailInput] = useState<string>('');
  const [emailOtp, setEmailOtp] = useState<string>('');
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');

  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmPass, setConfirmPass] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);

  const headers = { Authorization: `Bearer ${getCookie('auth_token')}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    const fetchHistory = async (): Promise<void> => {
      const token = getCookie('auth_token');
      if (!token) return;
      try {
        const res = await fetch('/api/orders/history', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setOrders(await res.json());
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchHistory();
  }, []);

  const cancelEdit = () => {
    setEditingField(null);
    setNameInput(user?.name || '');
    setPhoneInput(user?.phone || '');
    setEmailInput('');
    setEmailOtp('');
    setEmailStep('input');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  const saveName = async () => {
    if (!nameInput.trim()) { onToast?.('error', 'Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user/name', { method: 'PUT', headers, body: JSON.stringify({ name: nameInput.trim() }) });
      const data = await res.json();
      if (res.ok) { onToast?.('success', 'Name updated'); onUserUpdate?.({ ...user, name: data.name }); cancelEdit(); }
      else onToast?.('error', data.error);
    } catch { onToast?.('error', 'Failed to update'); } finally { setSaving(false); }
  };

  const savePhone = async () => {
    if (!phoneInput.trim()) { onToast?.('error', 'Phone cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user/phone', { method: 'PUT', headers, body: JSON.stringify({ phone: phoneInput.trim() }) });
      const data = await res.json();
      if (res.ok) { onToast?.('success', 'Phone updated'); onUserUpdate?.({ ...user, phone: data.phone }); cancelEdit(); }
      else onToast?.('error', data.error);
    } catch { onToast?.('error', 'Failed to update'); } finally { setSaving(false); }
  };

  const initiateEmailChange = async () => {
    if (!emailInput.trim()) { onToast?.('error', 'Enter new email'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user/email', { method: 'PUT', headers, body: JSON.stringify({ newEmail: emailInput.trim() }) });
      const data = await res.json();
      if (res.ok) { onToast?.('success', 'Verification code sent'); setEmailStep('verify'); }
      else onToast?.('error', data.error);
    } catch { onToast?.('error', 'Failed to send code'); } finally { setSaving(false); }
  };

  const verifyEmailChange = async () => {
    if (emailOtp.length !== 6) { onToast?.('error', 'Enter 6-digit code'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user/verify-email-change', { method: 'POST', headers, body: JSON.stringify({ otp: emailOtp }) });
      const data = await res.json();
      if (res.ok) { onToast?.('success', 'Email updated'); onUserUpdate?.({ ...user, email: data.email }); cancelEdit(); }
      else onToast?.('error', data.error);
    } catch { onToast?.('error', 'Verification failed'); } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!currentPass || !newPass) { onToast?.('error', 'Fill all password fields'); return; }
    if (newPass.length < 8) { onToast?.('error', 'Minimum 8 characters'); return; }
    if (newPass !== confirmPass) { onToast?.('error', 'Passwords don\'t match'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user/password', { method: 'PUT', headers, body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }) });
      const data = await res.json();
      if (res.ok) { onToast?.('success', 'Password updated'); cancelEdit(); }
      else onToast?.('error', data.error);
    } catch { onToast?.('error', 'Failed to update'); } finally { setSaving(false); }
  };

  const initials = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex-grow max-w-4xl mx-auto px-6 md:px-12 pt-28 pb-12 w-full animate-fade-in relative z-10 text-left">
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-2xl font-black shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
            {user?.name || 'Your Account'}
          </h1>
          <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest mt-1">
            {user?.email}
          </p>
        </div>
      </div>

      <div className="flex bg-[#050505] p-1 rounded-xl border border-white/5 mb-8 max-w-xs">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'account' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
        >
          Orders
        </button>
      </div>

      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="bg-[#111]/40 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <User size={14} />
              </div>
              <h3 className="text-white font-black text-xs uppercase tracking-wider">Personal Info</h3>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex-1 min-w-0">
                  <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest block mb-1">Display Name</span>
                  {editingField === 'name' ? (
                    <div className="flex items-center gap-2">
                      <input value={nameInput} onChange={e => setNameInput(e.target.value)} className="bg-[#050505] px-3 py-2 rounded-lg border border-white/10 text-white text-xs outline-none focus:border-purple-500 flex-1" placeholder="Your name" />
                      <button onClick={saveName} disabled={saving} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check size={16} /></button>
                      <button onClick={cancelEdit} className="text-neutral-500 hover:text-white cursor-pointer"><X size={16} /></button>
                    </div>
                  ) : (
                    <span className="text-white font-bold text-xs block truncate">{user?.name || 'Not set'}</span>
                  )}
                </div>
                {editingField !== 'name' && (
                  <button onClick={() => { cancelEdit(); setEditingField('name'); setNameInput(user?.name || ''); }} className="text-neutral-500 hover:text-purple-400 cursor-pointer ml-4"><Pencil size={14} /></button>
                )}
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex-1 min-w-0">
                  <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest block mb-1">Email Address</span>
                  {editingField === 'email' ? (
                    emailStep === 'input' ? (
                      <div className="flex items-center gap-2">
                        <input value={emailInput} onChange={e => setEmailInput(e.target.value)} className="bg-[#050505] px-3 py-2 rounded-lg border border-white/10 text-white text-xs outline-none focus:border-purple-500 flex-1" placeholder="new@email.com" type="email" />
                        <button onClick={initiateEmailChange} disabled={saving} className="text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase"><Mail size={14} /> Send</button>
                        <button onClick={cancelEdit} className="text-neutral-500 hover:text-white cursor-pointer"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))} maxLength={6} className="bg-[#050505] px-3 py-2 rounded-lg border border-white/10 text-white text-xs outline-none focus:border-purple-500 w-28 text-center font-mono tracking-widest" placeholder="000000" />
                        <button onClick={verifyEmailChange} disabled={saving} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check size={16} /></button>
                        <button onClick={cancelEdit} className="text-neutral-500 hover:text-white cursor-pointer"><X size={16} /></button>
                      </div>
                    )
                  ) : (
                    <span className="text-white font-bold text-xs block truncate">{user?.email}</span>
                  )}
                </div>
                {editingField !== 'email' && (
                  <button onClick={() => { cancelEdit(); setEditingField('email'); }} className="text-neutral-500 hover:text-purple-400 cursor-pointer ml-4"><Pencil size={14} /></button>
                )}
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex-1 min-w-0">
                  <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest block mb-1">Phone Number</span>
                  {editingField === 'phone' ? (
                    <div className="flex items-center gap-2">
                      <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="bg-[#050505] px-3 py-2 rounded-lg border border-white/10 text-white text-xs outline-none focus:border-purple-500 flex-1" placeholder="+91 XXXXX XXXXX" />
                      <button onClick={savePhone} disabled={saving} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check size={16} /></button>
                      <button onClick={cancelEdit} className="text-neutral-500 hover:text-white cursor-pointer"><X size={16} /></button>
                    </div>
                  ) : (
                    <span className="text-white font-bold text-xs block">{user?.phone || 'Not provided'}</span>
                  )}
                </div>
                {editingField !== 'phone' && (
                  <button onClick={() => { cancelEdit(); setEditingField('phone'); setPhoneInput(user?.phone || ''); }} className="text-neutral-500 hover:text-purple-400 cursor-pointer ml-4"><Pencil size={14} /></button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#111]/40 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Shield size={14} />
              </div>
              <h3 className="text-white font-black text-xs uppercase tracking-wider">Security</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-[9px] uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span>2-Step SMTP Verified</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500 font-mono text-[9px] uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-600"></div>
                <span>Session Active</span>
              </div>
            </div>

            {editingField === 'password' ? (
              <div className="space-y-3 border-t border-white/5 pt-4">
                <div className="relative">
                  <input type={showCurrentPass ? 'text' : 'password'} value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/10 text-white text-xs outline-none focus:border-purple-500 pr-10" placeholder="Current password" />
                  <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-3 text-neutral-500 hover:text-white cursor-pointer">
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showNewPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/10 text-white text-xs outline-none focus:border-purple-500 pr-10" placeholder="New password (min 8 chars)" />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-3 text-neutral-500 hover:text-white cursor-pointer">
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showConfirmPass ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full bg-[#050505] px-4 py-3 rounded-xl border border-white/10 text-white text-xs outline-none focus:border-purple-500 pr-10" placeholder="Confirm new password" />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-3 text-neutral-500 hover:text-white cursor-pointer">
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={savePassword} disabled={saving} className="px-5 py-2.5 bg-white text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all cursor-pointer">
                    {saving ? 'Saving...' : 'Update Password'}
                  </button>
                  <button onClick={cancelEdit} className="px-5 py-2.5 bg-white/5 border border-white/10 text-neutral-400 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:text-white transition-all cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { cancelEdit(); setEditingField('password'); }}
                className="text-purple-400 hover:text-purple-300 font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-colors border-t border-white/5 pt-4 block w-full text-left"
              >
                Change Password →
              </button>
            )}

            <div className="mt-6 pt-4 border-t border-white/5">
              <button onClick={onLogout} className="text-neutral-600 hover:text-red-400 font-bold text-[10px] transition-colors cursor-pointer uppercase tracking-widest">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-[#111]/40 border border-white/5 rounded-3xl p-6 min-h-[300px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Package size={14} />
            </div>
            <div>
              <h3 className="text-white font-black text-xs uppercase tracking-wider">Order History</h3>
              <span className="text-neutral-500 font-mono text-[9px] uppercase tracking-widest">{orders.length} orders</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/5 rounded-2xl">
              <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest mb-2">No orders yet</span>
              <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest">Your purchase history will appear here</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {orders.map((order) => (
                <div key={order._id} className="bg-[#050505] border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:border-white/10 transition-colors">
                  <div>
                    <span className="text-neutral-500 font-mono text-[9px] uppercase tracking-widest block mb-1">
                      {order.transactionId} · {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <div className="text-white font-bold text-xs uppercase truncate max-w-xs">
                      {order.items.map((it: any) => `${it.name} (x${it.quantity})`).join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-black text-sm block">₹{order.total}</span>
                    <span className="text-emerald-400 font-mono text-[8px] font-bold uppercase tracking-widest">COMPLETED</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
