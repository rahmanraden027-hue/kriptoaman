import { AlertTriangle, CheckCircle2, Loader2, RotateCw, WifiOff } from 'lucide-react';

export const compactAddress = (value) => value ? `${value.slice(0, 8)}…${value.slice(-6)}` : 'Wallet not connected';

export function StatusBadge({ state, children }) {
  const tone = state === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : state === 'loading' ? 'border-blue-400/25 bg-blue-400/10 text-blue-300' : 'border-amber-400/25 bg-amber-400/10 text-amber-300';
  const Icon = state === 'success' ? CheckCircle2 : state === 'loading' ? Loader2 : WifiOff;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${tone}`}><Icon className={`h-3 w-3 ${state === 'loading' ? 'animate-spin' : ''}`} />{children}</span>;
}

export function StatePanel({ phase, message = '', onRetry = null }) {
  if (phase === 'loading') return <div className="zv-skeleton h-28 rounded-2xl" aria-label="Loading network data" />;
  return <div role="alert" className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-[#9FB3C8]"><AlertTriangle className="mb-2 h-5 w-5 text-amber-400" /><p>{message || 'Data is currently unavailable.'}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 font-bold text-[#F2C86B]"><RotateCw className="h-4 w-4" />Retry</button>}</div>;
}

export function EmptyState({ title, body }) {
  return <div className="rounded-2xl border border-dashed border-[#1A3A59] bg-[#071522]/50 p-6 text-center"><p className="font-bold text-[#F4F7FB]">{title}</p><p className="mt-1 text-sm text-[#6F859B]">{body}</p></div>;
}
