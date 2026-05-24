import React, { useState, useEffect } from 'react';
import { User, Shield, Package } from 'lucide-react';
import { getCookie } from '@/utils/cookies';

interface ProfileProps {
  readonly user: { email: string; phone: string } | null;
  readonly onLogout: () => void;
}

export default function Profile({ user, onLogout }: ProfileProps): React.JSX.Element {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async (): Promise<void> => {
      const token = getCookie('auth_token');
      if (!token) return;
      try {
        const res = await fetch('/api/orders/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="flex-grow max-w-4xl mx-auto px-6 md:px-12 pt-32 pb-20 w-full animate-fade-in relative z-10 text-left">
      <div className="border-b border-white/5 pb-8 mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
          My Account
        </h1>
        <p className="text-neutral-500 font-mono text-xs mt-2 uppercase tracking-widest">
          View your profile & transaction history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[#111]/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-wider">
                  Personal Details
                </h3>
                <span className="text-neutral-500 font-mono text-[9px] uppercase tracking-widest">
                  Verified Member
                </span>
              </div>
            </div>

            <div className="space-y-4 font-mono text-[10px] uppercase tracking-widest text-neutral-400 leading-relaxed">
              <div>
                <span className="text-neutral-600 block text-[9px]">Email Address</span>
                <span className="text-white font-bold block truncate">{user?.email}</span>
              </div>
              <div>
                <span className="text-neutral-600 block text-[9px]">Phone Number</span>
                <span className="text-white font-bold block">{user?.phone || 'Not Provided'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111]/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-wider">
                  Security Log
                </h3>
                <span className="text-neutral-500 font-mono text-[9px] uppercase tracking-widest">
                  Status: Protected
                </span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-[9px] uppercase tracking-widest text-neutral-400 leading-relaxed">
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span>2-Step SMTP Verified</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-600"></div>
                <span>Session: Active</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <button
                onClick={onLogout}
                className="text-neutral-500 hover:text-red-400 font-bold transition-colors cursor-pointer text-[10px] font-sans hover:underline focus:outline-none bg-transparent border-none p-0"
              >
                Logout from current device
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-[#111]/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden h-full min-h-[300px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-wider">
                  Order Archives
                </h3>
                <span className="text-neutral-500 font-mono text-[9px] uppercase tracking-widest">
                  History of collections
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
                  Retrieving your transaction history...
                </span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/5 rounded-2xl">
                <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest mb-2">
                  No orders found in your archives
                </span>
                <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-widest">
                  Unlock drops to populate history
                </span>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-[#050505] border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:border-white/10 transition-colors"
                  >
                    <div>
                      <span className="text-neutral-500 font-mono text-[9px] uppercase tracking-widest block mb-1">
                        ID: {order.transactionId} // {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <div className="text-white font-bold text-xs uppercase truncate max-w-xs">
                        {order.items.map((it: any) => `${it.name} (x${it.quantity})`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-black text-sm block">₹{order.total}</span>
                      <span className="text-emerald-400 font-mono text-[8px] font-bold uppercase tracking-widest">
                        COMPLETED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
