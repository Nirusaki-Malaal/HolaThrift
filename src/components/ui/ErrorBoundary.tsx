import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error(error);
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="w-full max-w-md rounded-lg border border-red-500/20 bg-[#111]/80 p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.12)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-400">
            <AlertTriangle size={22} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-xs font-mono uppercase leading-relaxed tracking-widest text-neutral-500">
            The storefront hit an unexpected error. Refreshing usually gets you back safely.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="motion-press mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-neutral-200"
          >
            <RotateCcw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </main>
    );
  }
}
