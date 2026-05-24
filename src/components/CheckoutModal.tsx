import React, { useState } from 'react';
import { CreditCard, Check, AlertCircle } from 'lucide-react';

interface CheckoutModalProps {
  readonly isOpen: boolean;
  readonly total: number;
  readonly onClose: () => void;
  readonly onPaymentSuccess: (transactionId: string) => void;
}

export default function CheckoutModal({ isOpen, total, onClose, onPaymentSuccess }: CheckoutModalProps): React.JSX.Element | null {
  const [method, setMethod] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [stage, setStage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const runSimulation = async (): Promise<void> => {
    setStep('processing');
    setError('');

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    setStage('Connecting to secure banking network...');
    setProgress(15);
    await delay(1200);

    setStage('Verifying card credentials & daily limits...');
    setProgress(45);
    await delay(1500);

    setStage('Authorizing transaction amount...');
    setProgress(75);
    await delay(1200);

    setStage('Generating order hash & confirmation...');
    setProgress(100);
    await delay(800);

    const transactionId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    onPaymentSuccess(transactionId);
    setStep('success');
  };

  const handlePay = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit card number');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setError('Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (cardCvv.length < 3) {
        setError('Please enter a valid CVV');
        return;
      }
    } else {
      if (!upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. name@upi)');
        return;
      }
    }

    await runSimulation();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={step === 'processing' ? undefined : onClose}></div>

      <div className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(168,85,247,0.3)] text-left animate-fade-in-up">
        {step === 'details' && (
          <>
            <div className="text-center mb-8">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                SECURE CHECKOUT
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-3">
                Select Payment
              </h2>
              <p className="text-neutral-400 text-xs mt-1 font-mono uppercase tracking-widest">
                Amount Due: <span className="text-white font-sans font-bold">₹{total}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex bg-[#050505] p-1.5 rounded-2xl border border-white/5 mb-6">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                  method === 'card' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Card Payment
              </button>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                  method === 'upi' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
                }`}
              >
                UPI Transfer
              </button>
            </div>

            <form className="space-y-4" onSubmit={handlePay}>
              {method === 'card' ? (
                <>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-4 text-neutral-500" size={16} />
                    <input
                      required
                      type="text"
                      maxLength={19}
                      placeholder="CARD NUMBER"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                      className="w-full bg-[#050505] pl-12 pr-4 py-4 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      required
                      type="text"
                      maxLength={5}
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
                        setCardExpiry(val);
                      }}
                      className="w-full bg-[#050505] px-4 py-4 rounded-xl border border-white/5 text-white text-xs font-mono text-center outline-none focus:border-purple-500 transition-colors"
                    />
                    <input
                      required
                      type="password"
                      maxLength={3}
                      placeholder="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#050505] px-4 py-4 rounded-xl border border-white/5 text-white text-xs font-mono text-center outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </>
              ) : (
                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="ENTER UPI ID (e.g. name@upi)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-[#050505] px-4 py-4 rounded-xl border border-white/5 text-white text-xs font-mono uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer mt-6"
              >
                PAY NOW ₹{total}
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
              Verifying Payment
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
                <span>Gateway Type</span>
                <span className="text-white">{method}</span>
              </div>
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
