import React, { useState } from 'react';
import { Ban, Edit2, FileText, IndianRupee, Mail, MapPin, Phone, Save, Truck, X } from 'lucide-react';
import type { OrderAdminUpdate, OrderRecord } from '@/types/order';

interface AdminOrdersTableProps {
  readonly orders: OrderRecord[];
  readonly savingId: string;
  readonly onUpdate: (id: string, values: OrderAdminUpdate) => Promise<void> | void;
}

const orderStatusOptions = ['completed', 'processing', 'on-hold', 'cancelled'];
const paymentStatusOptions = ['PAID', 'PENDING', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'];

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPaymentStatus = (order: OrderRecord): string => {
  return order.paymentStatus || order.cashfreeOrderStatus || 'PENDING';
};

const getShippingStatus = (order: OrderRecord): string => {
  return order.shippingStatus || order.lastTrackingStatus || 'Pending Shipment';
};

const getStatusClass = (value: string): string => {
  const normalized = value.toLowerCase();
  if (normalized.includes('cancel') || normalized.includes('fail')) return 'border-red-500/20 bg-red-500/10 text-red-400';
  if (normalized.includes('refund') || normalized.includes('hold') || normalized.includes('pending')) return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  if (normalized.includes('paid') || normalized.includes('complete')) return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
  return 'border-purple-500/20 bg-purple-500/10 text-purple-300';
};

const createEmptyUpdateValues = (): OrderAdminUpdate => ({
  status: 'completed',
  paymentStatus: 'PENDING',
  shippingStatus: 'Pending Shipment',
  courierName: '',
  awbCode: '',
  estimatedDelivery: '',
  adminNote: '',
  cancellationReason: '',
});

const createUpdateValues = (order: OrderRecord, overrides: Partial<OrderAdminUpdate> = {}): OrderAdminUpdate => ({
  ...createEmptyUpdateValues(),
  status: order.status || 'completed',
  paymentStatus: getPaymentStatus(order),
  shippingStatus: getShippingStatus(order),
  courierName: order.courierName || '',
  awbCode: order.awbCode || '',
  estimatedDelivery: order.estimatedDelivery || '',
  adminNote: order.adminNote || '',
  cancellationReason: order.cancellationReason || '',
  ...overrides,
});

export default function AdminOrdersTable({ orders, savingId, onUpdate }: AdminOrdersTableProps): React.JSX.Element {
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [values, setValues] = useState<OrderAdminUpdate>(createEmptyUpdateValues);

  const openEditor = (order: OrderRecord, overrides: Partial<OrderAdminUpdate> = {}): void => {
    setEditingOrder(order);
    setValues(createUpdateValues(order, overrides));
  };

  const submitUpdate = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!editingOrder) return;
    try {
      await onUpdate(editingOrder._id, values);
      setEditingOrder(null);
    } catch {
      return;
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-white/5 bg-[#111]/40 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1320px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                <th className="p-5">Order</th>
                <th className="p-5">Customer</th>
                <th className="p-5">Items</th>
                <th className="p-5">Total</th>
                <th className="p-5">Payment</th>
                <th className="p-5">Shipping</th>
                <th className="p-5">References</th>
                <th className="p-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[10px] uppercase tracking-widest text-neutral-300">
              {orders.map((order) => {
                const customerEmail = order.shippingAddress?.email || order.userEmail || '';
                const paymentStatus = getPaymentStatus(order);
                const shippingStatus = getShippingStatus(order);
                return (
                  <tr key={order._id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="p-5 align-top">
                      <span className="block font-sans text-xs font-black text-white">{formatDate(order.createdAt)}</span>
                      <span className="mt-1 block font-mono text-[9px] text-neutral-500">{order.transactionId}</span>
                      {order.status && (
                        <span className={`mt-3 inline-flex rounded-md border px-2.5 py-1 font-mono text-[8px] font-black ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[260px] p-5 align-top">
                      <span className="block font-sans text-xs font-black text-white">{order.shippingAddress?.name || 'Customer'}</span>
                      <span className="mt-2 flex items-center gap-2 font-mono text-[9px] text-neutral-500">
                        <Mail size={11} /> {customerEmail || 'No email'}
                      </span>
                      <span className="mt-1 flex items-center gap-2 font-mono text-[9px] text-neutral-500">
                        <Phone size={11} /> {order.shippingAddress?.phone || 'No phone'}
                      </span>
                      <span className="mt-1 flex items-center gap-2 font-mono text-[9px] leading-relaxed text-neutral-500">
                        <MapPin size={11} className="shrink-0" /> {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode].filter(Boolean).join(', ') || 'No address'}
                      </span>
                    </td>
                    <td className="max-w-[260px] p-5 align-top">
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={`${order._id}-${item.productId || item.name}-${index}`} className="font-mono text-[9px] leading-relaxed text-neutral-400">
                            <span className="text-white">{item.name}</span>
                            <span className="text-neutral-600"> x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-5 align-top font-sans text-sm font-black text-white">
                      <span className="inline-flex items-center gap-1">
                        <IndianRupee size={13} /> {order.total}
                      </span>
                    </td>
                    <td className="p-5 align-top">
                      <span className={`inline-flex rounded-md border px-2.5 py-1 font-mono text-[8px] font-black ${getStatusClass(paymentStatus)}`}>
                        {paymentStatus}
                      </span>
                      <span className="mt-2 block font-mono text-[8px] text-neutral-500">{order.paymentProvider || 'Cashfree'}</span>
                    </td>
                    <td className="max-w-[220px] p-5 align-top">
                      <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[8px] font-black ${getStatusClass(shippingStatus)}`}>
                        <Truck size={11} /> {shippingStatus}
                      </span>
                      {order.courierName && <span className="mt-2 block font-mono text-[8px] text-neutral-500">{order.courierName}</span>}
                      {order.awbCode && <span className="mt-1 block font-mono text-[8px] text-neutral-500">AWB {order.awbCode}</span>}
                      {order.cancellationReason && <span className="mt-2 block font-mono text-[8px] leading-relaxed text-red-300">{order.cancellationReason}</span>}
                    </td>
                    <td className="max-w-[220px] p-5 align-top font-mono text-[8px] leading-relaxed text-neutral-500">
                      {order.cashfreeOrderId && <span className="block">Cashfree {order.cashfreeOrderId}</span>}
                      {order.shiprocketOrderId && <span className="block">Shiprocket {order.shiprocketOrderId}</span>}
                      {order.shiprocketShipmentId && <span className="block">Shipment {order.shiprocketShipmentId}</span>}
                      {order.invoiceUrl && (
                        <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-purple-300 hover:text-white">
                          <FileText size={10} /> Invoice JPG
                        </a>
                      )}
                    </td>
                    <td className="p-5 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditor(order)}
                          disabled={Boolean(savingId)}
                          className="rounded-lg border border-white/5 bg-white/5 p-2 text-neutral-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Edit order ${order.transactionId}`}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditor(order, { status: 'cancelled', shippingStatus: 'Cancelled' })}
                          disabled={Boolean(savingId) || order.status === 'cancelled'}
                          className="rounded-lg border border-red-500/10 bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Cancel order ${order.transactionId}`}
                        >
                          <Ban size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingOrder(null)} aria-label="Close order editor"></button>
          <form onSubmit={submitUpdate} className="motion-modal relative w-full max-w-2xl rounded-lg border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_0_80px_rgba(168,85,247,0.3)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Order Control</h3>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-neutral-500">{editingOrder.transactionId}</p>
              </div>
              <button type="button" onClick={() => setEditingOrder(null)} className="rounded-lg border border-white/5 bg-white/5 p-2 text-neutral-400 transition-colors hover:text-white" aria-label="Close order editor">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">
                Order status
                <select
                  value={values.status}
                  onChange={(event) => setValues((currentValues) => ({ ...currentValues, status: event.target.value }))}
                  className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
                >
                  {orderStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">
                Payment status
                <select
                  value={values.paymentStatus}
                  onChange={(event) => setValues((currentValues) => ({ ...currentValues, paymentStatus: event.target.value }))}
                  className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
                >
                  {paymentStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <input
                type="text"
                placeholder="Shipping status"
                value={values.shippingStatus}
                onChange={(event) => setValues((currentValues) => ({ ...currentValues, shippingStatus: event.target.value }))}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Courier name"
                value={values.courierName}
                onChange={(event) => setValues((currentValues) => ({ ...currentValues, courierName: event.target.value }))}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="AWB code"
                value={values.awbCode}
                onChange={(event) => setValues((currentValues) => ({ ...currentValues, awbCode: event.target.value }))}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Estimated delivery"
                value={values.estimatedDelivery}
                onChange={(event) => setValues((currentValues) => ({ ...currentValues, estimatedDelivery: event.target.value }))}
                className="w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
              />
            </div>

            <textarea
              placeholder="Cancellation reason"
              value={values.cancellationReason}
              required={values.status === 'cancelled'}
              onChange={(event) => setValues((currentValues) => ({ ...currentValues, cancellationReason: event.target.value }))}
              className="mt-4 min-h-24 w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
            />
            <textarea
              placeholder="Admin note"
              value={values.adminNote}
              onChange={(event) => setValues((currentValues) => ({ ...currentValues, adminNote: event.target.value }))}
              className="mt-4 min-h-24 w-full rounded-lg border border-white/5 bg-[#050505] px-4 py-3 text-xs text-white outline-none transition-colors focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={savingId === editingOrder._id}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {savingId === editingOrder._id ? 'Saving Order' : 'Save Order'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
