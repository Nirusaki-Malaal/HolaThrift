import React from 'react';
import { MapPin } from 'lucide-react';
import type { SavedAddress } from '@/types/user';

interface SavedAddressFormProps {
  readonly address: SavedAddress;
  readonly saving: boolean;
  readonly onChange: (address: Partial<SavedAddress>) => void;
  readonly onSave: () => void;
}

export default function SavedAddressForm({ address, saving, onChange, onSave }: SavedAddressFormProps): React.JSX.Element {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#111]/40 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400">
          <MapPin size={14} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-wider text-white">Default Delivery Address</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input value={address.name} onChange={(event) => onChange({ name: event.target.value })} className="rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none focus:border-purple-500" placeholder="Full name" />
        <input value={address.email} onChange={(event) => onChange({ email: event.target.value })} className="rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none focus:border-purple-500" placeholder="Email" type="email" />
        <input value={address.phone} onChange={(event) => onChange({ phone: event.target.value.replace(/\D/g, '') })} className="rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none focus:border-purple-500" placeholder="Phone" maxLength={10} />
        <input value={address.pincode} onChange={(event) => onChange({ pincode: event.target.value.replace(/\D/g, '') })} className="rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none focus:border-purple-500" placeholder="PIN code" maxLength={6} />
      </div>

      <input value={address.address} onChange={(event) => onChange({ address: event.target.value })} className="mt-3 w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none focus:border-purple-500" placeholder="Street address" />

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <input value={address.city} onChange={(event) => onChange({ city: event.target.value })} className="rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none focus:border-purple-500" placeholder="City" />
        <input value={address.state} onChange={(event) => onChange({ state: event.target.value })} className="rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-xs text-white outline-none focus:border-purple-500" placeholder="State" />
      </div>

      <button onClick={onSave} disabled={saving} className="mt-5 rounded-xl bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-purple-500 hover:text-white disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Address'}
      </button>
    </div>
  );
}
