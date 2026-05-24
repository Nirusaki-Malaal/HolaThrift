import React from 'react';
import { Mail, Send } from 'lucide-react';

export interface AdminEmailUser {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  createdAt?: string;
}

export interface AdminEmailPayload {
  target: 'all' | 'user';
  email: string;
  subject: string;
  message: string;
}

interface AdminEmailPanelProps {
  readonly users: AdminEmailUser[];
  readonly loading: boolean;
  readonly sending: boolean;
  readonly result: string;
  readonly values: AdminEmailPayload;
  readonly onChange: (values: Partial<AdminEmailPayload>) => void;
  readonly onSubmit: (event: React.FormEvent) => void;
}

export default function AdminEmailPanel({
  users,
  loading,
  sending,
  result,
  values,
  onChange,
  onSubmit,
}: AdminEmailPanelProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-white/5 bg-[#111]/40 p-5 shadow-[0_0_50px_rgba(0,0,0,0.3)] sm:p-6">
      <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300">
          <Mail size={17} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Custom Emails</h2>
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">
            {loading ? 'Loading users' : `${users.length} users available`}
          </span>
        </div>
      </div>

      {result && (
        <div className="mb-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
          {result}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="admin-email-target" className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Audience</label>
            <select
              id="admin-email-target"
              value={values.target}
              onChange={(event) => onChange({ target: event.target.value as AdminEmailPayload['target'] })}
              className="w-full cursor-pointer rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
            >
              <option value="all">All Users</option>
              <option value="user">Individual User</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-email-recipient" className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Recipient</label>
            <select
              id="admin-email-recipient"
              value={values.email}
              onChange={(event) => onChange({ email: event.target.value })}
              disabled={values.target === 'all' || loading}
              className="w-full cursor-pointer rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user._id || user.email} value={user.email}>
                  {user.name ? `${user.name} - ${user.email}` : user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="admin-email-subject" className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Subject</label>
          <input
            id="admin-email-subject"
            required
            type="text"
            value={values.subject}
            onChange={(event) => onChange({ subject: event.target.value })}
            placeholder="New drop announcement"
            className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
          />
        </div>

        <div>
          <label htmlFor="admin-email-message" className="mb-2 block text-[8px] font-mono uppercase tracking-widest text-neutral-500">Message</label>
          <textarea
            id="admin-email-message"
            required
            value={values.message}
            onChange={(event) => onChange({ message: event.target.value })}
            placeholder="Write the email body"
            className="h-44 w-full resize-none rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs leading-relaxed text-white outline-none transition-colors focus:border-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={sending || loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-purple-500 px-5 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={14} />
          <span>{sending ? 'Sending Emails' : 'Send Email'}</span>
        </button>
      </form>
    </div>
  );
}
