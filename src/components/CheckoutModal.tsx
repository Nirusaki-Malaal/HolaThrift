import React, { useEffect, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { getCookie } from '@/utils/cookies';
import type { SavedAddress, UserSession } from '@/types/user';

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: '_modal' }) => Promise<{ error?: { message?: string } } | undefined>;
    };
  }
}

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutModalProps {
  readonly isOpen: boolean;
  readonly total: number;
  readonly items: CheckoutItem[];
  readonly onClose: () => void;
  readonly onPaymentSuccess: () => void;
  readonly onToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  readonly user: UserSession | null;
}

export default function CheckoutModal({
  isOpen,
  total,
  items,
  onClose,
  onPaymentSuccess,
  onToast,
  user,
}: CheckoutModalProps): React.JSX.Element | null {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [saveAddress, setSaveAddress] = useState<boolean>(true);

  const [step, setStep] = useState<'address' | 'processing' | 'success'>('address');
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [cashfreeMode, setCashfreeMode] = useState<'sandbox' | 'production'>('production');
  const [orderReference, setOrderReference] = useState('');
  const [reservationExpiresAt, setReservationExpiresAt] = useState('');
  const [deliveryCheck, setDeliveryCheck] = useState<{ serviceable: boolean; courierName: string; estimatedDays: string } | null>(null);
  const [checkingDelivery, setCheckingDelivery] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const resetTimer = window.setTimeout(() => {
      setName(user?.name || '');
      setPhone(user?.phone || '');
      setEmail(user?.email || '');
      setAddress('');
      setCity('');
      setStateName('');
      setPincode('');
      setSaveAddress(true);
      setStep('address');
      setError('');
      setOrderReference('');
      setReservationExpiresAt('');
      setDeliveryCheck(null);
    }, 0);

    const loadSavedAddress = async (): Promise<void> => {
      const token = getCookie('auth_token');
      if (!token) return;

      try {
        const res = await fetch('/api/user/address', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data: SavedAddress | null = await res.json();
        if (!data) return;
        setName(data.name || user?.name || '');
        setPhone(data.phone || user?.phone || '');
        setEmail(data.email || user?.email || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setStateName(data.state || '');
        setPincode(data.pincode || '');
      } catch (err) {
        console.error(err);
      }
    };

    const addressTimer = window.setTimeout(() => {
      loadSavedAddress();
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(addressTimer);
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen || pincode.length !== 6) {
      const timer = window.setTimeout(() => {
        setDeliveryCheck(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setCheckingDelivery(true);
      try {
        const res = await fetch(`/api/orders/serviceability/${pincode}`);
        if (!res.ok) {
          setDeliveryCheck(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setDeliveryCheck(data);
      } catch {
        if (!cancelled) setDeliveryCheck(null);
      } finally {
        if (!cancelled) setCheckingDelivery(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isOpen, pincode]);

  if (!isOpen) return null;

  const loadCashfreeScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Cashfree) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
      document.body.appendChild(script);
    });
  };

  const handlePay = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (pincode.replace(/\D/g, '').length < 6) {
      setError('Please enter a valid 6-digit PIN code');
      return;
    }
    if (deliveryCheck && !deliveryCheck.serviceable) {
      setError('Shiprocket does not currently mark this PIN code as serviceable');
      return;
    }

    const shippingAddress = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
    };

    setStep('processing');
    setStage('Securing product reservation...');
    setProgress(20);

    const token = getCookie('auth_token');
    if (!token) {
      setError('Authentication required. Please log in.');
      setStep('address');
      return;
    }

    try {
      if (saveAddress) {
        await fetch('/api/user/address', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(shippingAddress),
        });
      }

      const res = await fetch('/api/orders/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          total,
          shippingAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Product reservation failed');
        setStep('address');
        return;
      }

      const { paymentSessionId, cashfreeOrderId } = data;
      const reservedItems = Array.isArray(data.items) ? data.items : items;
      const mode = data.cashfreeMode === 'sandbox' ? 'sandbox' : 'production';
      setCashfreeMode(mode);
      setOrderReference(cashfreeOrderId);
      setReservationExpiresAt(data.reservationExpiresAt || '');

      setStage('Loading secure payment portal...');
      setProgress(50);
      await loadCashfreeScript();

      if (!window.Cashfree) throw new Error('Cashfree SDK is not available');
      const cashfree = window.Cashfree({ mode });

      setStage('Completing checkout session...');
      setProgress(80);

      const checkoutResult = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      });

      if (checkoutResult?.error) {
        setError(checkoutResult.error.message || 'Payment was not completed');
        setStep('address');
        return;
      }

      setStage('Verifying payment confirmation...');
      setProgress(90);

      const verifyRes = await fetch('/api/orders/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cashfreeOrderId,
          shippingAddress,
          items: reservedItems,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error || 'Payment verification failed');
        setStep('address');
        return;
      }

      setProgress(100);
      setStep('success');
      onToast?.('success', 'Order placed successfully!');
      onPaymentSuccess();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Payment initiation failed');
      setStep('address');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={step === 'processing' ? undefined : onClose}></div>

      <div className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(168,85,247,0.3)] text-left animate-fade-in-up my-8">
        {step === 'address' && (
          <>
            <div className="text-center mb-6">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                SHIPPING DETAILS
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-3">
                Delivery Address
              </h2>
              <p className="text-neutral-400 text-xs mt-1 font-mono uppercase tracking-widest">
                Amount Due: <span className="text-white font-sans font-bold">₹{total}</span>
              </p>
              <p className="text-neutral-600 text-[9px] mt-2 font-mono uppercase tracking-widest">
                Cashfree secure checkout · Shiprocket delivery
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handlePay}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="FULL NAME"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050505] px-4 py-3.5 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                />
                <input
                  required
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] px-4 py-3.5 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  type="tel"
                  placeholder="10-DIGIT PHONE"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  className="w-full bg-[#050505] px-4 py-3.5 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                />
                <input
                  required
                  type="text"
                  placeholder="6-DIGIT PINCODE"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className="w-full bg-[#050505] px-4 py-3.5 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {(checkingDelivery || deliveryCheck) && (
                <div className={`rounded-xl border px-4 py-3 text-[10px] font-mono uppercase tracking-widest ${
                  deliveryCheck?.serviceable
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : deliveryCheck
                      ? 'border-red-500/20 bg-red-500/10 text-red-400'
                      : 'border-white/5 bg-[#050505] text-neutral-500'
                }`}>
                  {checkingDelivery
                    ? 'Checking Shiprocket serviceability...'
                    : deliveryCheck?.serviceable
                      ? `Serviceable via ${deliveryCheck.courierName || 'Shiprocket'}${deliveryCheck.estimatedDays ? ` · ETA ${deliveryCheck.estimatedDays}` : ''}`
                      : 'Shiprocket serviceability could not be confirmed'}
                </div>
              )}

              <input
                required
                type="text"
                placeholder="STREET ADDRESS"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#050505] px-4 py-3.5 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="CITY"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#050505] px-4 py-3.5 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                />
                <input
                  required
                  type="text"
                  placeholder="STATE"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full bg-[#050505] px-4 py-3.5 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#050505] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                  className="h-4 w-4 accent-purple-500"
                />
                <span>Save as default delivery address</span>
              </label>

              <button
                type="submit"
                className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer mt-6"
              >
                PROCEED TO PAY ₹{total}
              </button>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Processing Checkout
            </h3>

            <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden my-6 border border-white/5">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <p className="text-purple-400 font-mono text-[10px] uppercase tracking-widest animate-pulse leading-relaxed">
              {stage}
            </p>
            <div className="mt-5 space-y-1 font-mono text-[9px] uppercase tracking-widest text-neutral-500">
              {orderReference && <p>Order Ref: <span className="text-neutral-300">{orderReference}</span></p>}
              <p>Cashfree Mode: <span className="text-neutral-300">{cashfreeMode}</span></p>
              {reservationExpiresAt && <p>Reservation Held Until: <span className="text-neutral-300">{new Date(reservationExpiresAt).toLocaleTimeString()}</span></p>}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Check size={28} className="text-emerald-400" />
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
              Order Placed
            </h2>
            <p className="text-neutral-400 text-xs font-mono uppercase tracking-widest leading-relaxed mb-8">
              Your payment has been successfully authorized.
            </p>

            <div className="bg-[#050505] p-6 rounded-3xl border border-white/5 text-left space-y-3 font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-8 leading-relaxed">
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className="text-emerald-400 font-bold">SUCCESSFUL</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid</span>
                <span className="text-white font-bold font-sans text-xs">₹{total}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Service</span>
                <span className="text-purple-400 font-bold">SHIPROCKET</span>
              </div>
              {orderReference && (
                <div className="flex justify-between gap-4">
                  <span>Order Ref</span>
                  <span className="text-white font-bold normal-case">{orderReference}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Back to Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
