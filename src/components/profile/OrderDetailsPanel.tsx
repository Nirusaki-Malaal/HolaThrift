import React from 'react';
import { CreditCard, FileText, MapPin, Package, Truck } from 'lucide-react';
import OrderTravelProgress from './OrderTravelProgress';
import type { OrderRecord, TrackingPayload } from '@/types/order';

interface OrderDetailsPanelProps {
  readonly order: OrderRecord;
  readonly tracking?: TrackingPayload | null;
}

const formatCurrency = (amount: number): string => `₹${amount}`;

const getLineTotal = (price = 0, quantity: number): number => price * quantity;

export default function OrderDetailsPanel({ order, tracking }: OrderDetailsPanelProps): React.JSX.Element {
  const address = order.shippingAddress;
  const references = [
    ['Order Ref', order.transactionId],
    ['Cashfree Order', order.cashfreeOrderId],
    ['Payment Session', order.cashfreePaymentSessionId],
    ['Shiprocket Order', order.shiprocketOrderId],
    ['Shipment ID', order.shiprocketShipmentId],
    ['AWB', order.awbCode],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="animate-fade-in rounded-2xl border border-white/5 bg-[#0a0a0a] p-4 text-left">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/5 bg-[#050505] p-4">
          <div className="mb-4 flex items-center gap-2">
            <Package size={14} className="text-purple-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Items</h4>
          </div>
          <div className="space-y-3">
            {order.items.map((item, index) => {
              const price = Number(item.price || 0);
              return (
                <div key={`${item.productId || item.name}-${index}`} className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-black uppercase text-white">{item.name}</span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                      Qty {item.quantity} · {price > 0 ? formatCurrency(price) : 'Price synced'}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-black text-white">
                    {price > 0 ? formatCurrency(getLineTotal(price, item.quantity)) : ''}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Order Total</span>
            <span className="text-base font-black text-white">{formatCurrency(order.total)}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-white/5 bg-[#050505] p-4">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-purple-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Delivery</h4>
          </div>
          {address ? (
            <div className="space-y-2 text-xs text-neutral-400">
              <p className="font-bold text-white">{address.name}</p>
              <p>{address.address}</p>
              <p>{address.city}, {address.state} {address.pincode}</p>
              <p>{address.phone}</p>
              <p className="break-all">{address.email}</p>
            </div>
          ) : (
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Delivery address is syncing</p>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/5 bg-[#050505] p-4">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard size={14} className="text-emerald-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Payment</h4>
          </div>
          <div className="grid grid-cols-1 gap-2 font-mono text-[9px] uppercase tracking-widest text-neutral-500">
            <span>Provider: <span className="text-neutral-300">{order.paymentProvider || 'Cashfree'}</span></span>
            <span>Status: <span className="text-emerald-400">{order.paymentStatus || order.cashfreeOrderStatus || 'Paid'}</span></span>
            <span>Placed: <span className="text-neutral-300">{new Date(order.createdAt).toLocaleString()}</span></span>
            {order.invoiceUrl && (
              <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-purple-300 hover:text-white">
                <FileText size={12} /> Invoice JPG
              </a>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/5 bg-[#050505] p-4">
          <div className="mb-4 flex items-center gap-2">
            <Truck size={14} className="text-purple-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Shipping</h4>
          </div>
          <div className="grid grid-cols-1 gap-2 font-mono text-[9px] uppercase tracking-widest text-neutral-500">
            <span>Courier: <span className="text-neutral-300">{order.courierName || 'Shiprocket'}</span></span>
            <span>Status: <span className="text-purple-400">{order.shippingStatus || order.lastTrackingStatus || 'Processing'}</span></span>
            {order.estimatedDelivery && <span>ETA: <span className="text-neutral-300">{order.estimatedDelivery}</span></span>}
          </div>
        </section>
      </div>

      <div className="mt-4">
        <OrderTravelProgress order={order} tracking={tracking} />
      </div>

      {references.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/5 bg-[#050505] p-4">
          <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-white">References</h4>
          <div className="grid grid-cols-1 gap-2 font-mono text-[8px] uppercase tracking-widest text-neutral-500 md:grid-cols-2">
            {references.map(([label, value]) => (
              <span key={label} className="break-all">
                {label}: <span className="text-neutral-300">{value}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
