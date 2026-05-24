import React from 'react';
import { MapPinned } from 'lucide-react';
import type { OrderRecord, TrackingPayload, TrackingScan } from '@/types/order';

interface OrderTravelProgressProps {
  readonly order: OrderRecord;
  readonly tracking?: TrackingPayload | null;
}

interface ProgressStep {
  label: string;
  detail: string;
}

const steps: ProgressStep[] = [
  { label: 'Ordered', detail: 'Payment captured' },
  { label: 'Packed', detail: 'Ready for pickup' },
  { label: 'Picked', detail: 'With courier' },
  { label: 'Transit', detail: 'Moving hubs' },
  { label: 'Delivery', detail: 'Out for delivery' },
  { label: 'Delivered', detail: 'Completed' },
];

const getStatusText = (order: OrderRecord, tracking?: TrackingPayload | null): string => {
  return tracking?.currentStatus || order.lastTrackingStatus || order.shippingStatus || order.status || 'Processing';
};

const getProgressIndex = (statusText: string, scans: TrackingScan[]): number => {
  const haystack = `${statusText} ${scans.map((scan) => scan.activity).join(' ')}`.toLowerCase();
  if (haystack.includes('delivered')) return 5;
  if (haystack.includes('out for delivery') || haystack.includes('ofd')) return 4;
  if (haystack.includes('transit') || haystack.includes('hub') || haystack.includes('reached')) return 3;
  if (haystack.includes('picked') || haystack.includes('shipped') || haystack.includes('dispatch')) return 2;
  if (haystack.includes('manifest') || haystack.includes('packed') || haystack.includes('created')) return 1;
  return 0;
};

const getLatestScan = (scans: TrackingScan[]): TrackingScan | null => {
  return scans[0] || null;
};

export default function OrderTravelProgress({ order, tracking }: OrderTravelProgressProps): React.JSX.Element {
  const scans = tracking?.scans || [];
  const statusText = getStatusText(order, tracking);
  const activeIndex = getProgressIndex(statusText, scans);
  const progress = Math.round((activeIndex / (steps.length - 1)) * 100);
  const latestScan = getLatestScan(scans);

  return (
    <section className="rounded-2xl border border-white/5 bg-[#050505] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPinned size={14} className="text-purple-400" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Travel Progress</h4>
        </div>
        <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-purple-400">
          {progress}%
        </span>
      </div>

      <div className="relative mb-5 h-2 rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {steps.map((step, index) => {
          const isDone = index <= activeIndex;
          return (
            <div key={step.label} className="min-w-0">
              <div className={`mb-2 h-3 w-3 rounded-full border ${isDone ? 'border-purple-300 bg-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.55)]' : 'border-white/10 bg-white/5'}`}></div>
              <span className={`block text-[9px] font-black uppercase tracking-widest ${isDone ? 'text-white' : 'text-neutral-600'}`}>{step.label}</span>
              <span className="mt-1 block text-[8px] uppercase tracking-widest text-neutral-500">{step.detail}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-[#0a0a0a] p-3 font-mono text-[9px] uppercase tracking-widest text-neutral-500">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>Status: <span className="text-purple-400">{statusText}</span></span>
          {(tracking?.estimatedDelivery || order.estimatedDelivery) && (
            <span>ETA: <span className="text-neutral-300">{tracking?.estimatedDelivery || order.estimatedDelivery}</span></span>
          )}
        </div>
        {latestScan && (
          <div className="mt-3 border-t border-white/5 pt-3 normal-case tracking-normal text-neutral-400">
            <span className="font-bold text-white">{latestScan.activity}</span>
            <span> · {latestScan.location}</span>
            <span> · {latestScan.date}</span>
          </div>
        )}
      </div>
    </section>
  );
}
