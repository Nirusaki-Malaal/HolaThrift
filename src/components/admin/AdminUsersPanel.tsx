import React, { useMemo, useState } from 'react';
import { Edit2, Search, ShieldCheck, Trash2, UserRound } from 'lucide-react';

export interface AdminUserRecord {
  _id: string;
  email: string;
  phone: string;
  name?: string;
  createdAt?: string;
  isAdmin?: boolean;
  wishlistCount?: number;
  orderCount?: number;
  totalSpend?: number;
  lastOrderAt?: string | null;
  defaultAddress?: {
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
}

export interface AdminUserUpdate {
  name: string;
  email: string;
  phone: string;
}

interface AdminUsersPanelProps {
  readonly users: AdminUserRecord[];
  readonly loading: boolean;
  readonly savingId: string;
  readonly onUpdate: (id: string, values: AdminUserUpdate) => void;
  readonly onDelete: (id: string) => void;
}

const formatDate = (value?: string | null): string => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AdminUsersPanel({ users, loading, savingId, onUpdate, onDelete }: AdminUsersPanelProps): React.JSX.Element {
  const [query, setQuery] = useState<string>('');
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [formValues, setFormValues] = useState<AdminUserUpdate>({ name: '', email: '', phone: '' });

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((user) => {
      return [user.name, user.email, user.phone, user.defaultAddress?.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [query, users]);

  const openEdit = (user: AdminUserRecord): void => {
    setEditingUser(user);
    setFormValues({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  };

  const submitEdit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!editingUser) return;
    onUpdate(editingUser._id, formValues);
    setEditingUser(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-white/5 bg-[#111]/20">
        <span className="text-center text-[10px] font-mono uppercase tracking-widest text-neutral-500 animate-pulse">
          Retrieving user control records
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-4 text-neutral-500" size={15} />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-lg border border-white/5 bg-[#050505] py-3.5 pl-11 pr-4 text-xs text-white outline-none transition-colors focus:border-purple-500"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-white/5 bg-[#111]/40 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                <th className="p-5">User</th>
                <th className="p-5">Phone</th>
                <th className="p-5">Location</th>
                <th className="p-5">Orders</th>
                <th className="p-5">Saved</th>
                <th className="p-5">Joined</th>
                <th className="p-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[10px] uppercase tracking-widest text-neutral-300">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="max-w-[260px] p-5">
                    <span className="flex items-center gap-2 font-sans text-xs font-black text-white">
                      <UserRound size={14} className="text-purple-300" />
                      {user.name || 'Unnamed User'}
                      {user.isAdmin && <ShieldCheck size={13} className="text-emerald-400" />}
                    </span>
                    <span className="mt-1 block break-all font-mono text-[9px] text-neutral-500">{user.email}</span>
                  </td>
                  <td className="p-5 font-mono text-[9px] text-neutral-400">{user.phone || 'No phone'}</td>
                  <td className="p-5 font-mono text-[9px] text-neutral-400">
                    {[user.defaultAddress?.city, user.defaultAddress?.state, user.defaultAddress?.pincode].filter(Boolean).join(', ') || 'No address'}
                  </td>
                  <td className="p-5">
                    <span className="block font-sans text-sm font-black text-white">{user.orderCount || 0}</span>
                    <span className="font-mono text-[8px] text-neutral-500">INR {Number(user.totalSpend || 0).toLocaleString('en-IN')}</span>
                  </td>
                  <td className="p-5 font-mono text-[9px] text-neutral-400">{user.wishlistCount || 0} Items</td>
                  <td className="p-5 font-mono text-[9px] text-neutral-400">
                    <span className="block">{formatDate(user.createdAt)}</span>
                    <span className="mt-1 block text-neutral-600">Last {formatDate(user.lastOrderAt)}</span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        disabled={Boolean(savingId)}
                        className="rounded-lg border border-white/5 bg-white/5 p-2 text-neutral-300 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
                        aria-label={`Edit ${user.email}`}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(user._id)}
                        disabled={Boolean(savingId) || user.isAdmin}
                        className="rounded-lg border border-red-500/10 bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Delete ${user.email}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingUser(null)} aria-label="Close user editor"></button>
          <form onSubmit={submitEdit} className="motion-modal relative w-full max-w-md rounded-lg border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_0_80px_rgba(168,85,247,0.3)]">
            <h3 className="mb-5 text-lg font-black uppercase tracking-tight text-white">Edit User</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={formValues.name}
                onChange={(event) => setFormValues((values) => ({ ...values, name: event.target.value }))}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={formValues.email}
                onChange={(event) => setFormValues((values) => ({ ...values, email: event.target.value }))}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
              <input
                required
                type="tel"
                placeholder="Phone"
                value={formValues.phone}
                onChange={(event) => setFormValues((values) => ({ ...values, phone: event.target.value.replace(/\D/g, '') }))}
                maxLength={10}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={Boolean(savingId)}
                className="w-full rounded-lg bg-white py-3.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-neutral-200 disabled:opacity-50"
              >
                {savingId ? 'Saving User' : 'Save User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
