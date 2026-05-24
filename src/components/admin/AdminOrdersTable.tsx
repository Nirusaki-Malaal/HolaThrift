import React from 'react';
import { IndianRupee, Mail, MapPin, Phone, Truck } from 'lucide-react';
import type { OrderRecord } from '@/types/order';

interface AdminOrdersTableProps {
  readonly orders: OrderRecord[];
}

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
  return order.paymentStatus || order.cashfreeOrderStatus || order.status || 'Pending';
};

const getShippingStatus = (order: OrderRecord): string => {
  return order.lastTrackingStatus || order.shippingStatus || 'Pending Shipment';
};

export default function AdminOrdersTable({ orders }: AdminOrdersTableProps): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-lg border border-white/5 bg-[#111]/40 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-widest text-neutral-500">
              <th className="p-5">Order</th>
              <th className="p-5">Customer</th>
              <th className="p-5">Items</th>
              <th className="p-5">Total</th>
              <th className="p-5">Payment</th>
              <th className="p-5">Shipping</th>
              <th className="p-5">References</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-[10px] uppercase tracking-widest text-neutral-300">
            {orders.map((order) => {
              const customerEmail = order.shippingAddress?.email || order.userEmail || '';
              return (
                <tr key={order._id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="p-5 align-top">
                    <span className="block font-sans text-xs font-black text-white">{formatDate(order.createdAt)}</span>
                    <span className="mt-1 block font-mono text-[9px] text-neutral-500">{order.transactionId}</span>
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
                    <span className="inline-flex rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[8px] font-black text-emerald-400">
                      {getPaymentStatus(order)}
                    </span>
                    <span className="mt-2 block font-mono text-[8px] text-neutral-500">{order.paymentProvider || 'Cashfree'}</span>
                  </td>
                  <td className="max-w-[220px] p-5 align-top">
                    <span className="inline-flex items-center gap-2 rounded-md border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 font-mono text-[8px] font-black text-purple-300">
                      <Truck size={11} /> {getShippingStatus(order)}
                    </span>
                    {order.courierName && <span className="mt-2 block font-mono text-[8px] text-neutral-500">{order.courierName}</span>}
                    {order.awbCode && <span className="mt-1 block font-mono text-[8px] text-neutral-500">AWB {order.awbCode}</span>}
                  </td>
                  <td className="max-w-[220px] p-5 align-top font-mono text-[8px] leading-relaxed text-neutral-500">
                    {order.cashfreeOrderId && <span className="block">Cashfree {order.cashfreeOrderId}</span>}
                    {order.shiprocketOrderId && <span className="block">Shiprocket {order.shiprocketOrderId}</span>}
                    {order.shiprocketShipmentId && <span className="block">Shipment {order.shiprocketShipmentId}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
