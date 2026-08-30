import React from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export default function WorkspaceState({
  mode = 'loading',
  title,
  body,
  actionLabel,
  onAction,
  compact = false,
}) {
  const config = {
    loading: {
      icon: Loader2,
      iconClass: 'animate-spin text-sky-300',
      boxClass: 'border-sky-400/20 bg-sky-400/10',
      defaultTitle: 'Memuat workspace',
      defaultBody: 'KriptoAman sedang menyiapkan data yang tersedia.',
    },
    error: {
      icon: AlertTriangle,
      iconClass: 'text-amber-300',
      boxClass: 'border-amber-400/20 bg-amber-400/10',
      defaultTitle: 'Data belum dapat dimuat',
      defaultBody: 'Sumber data sedang tidak tersedia. Data tersimpan tidak diubah.',
    },
    empty: {
      icon: Inbox,
      iconClass: 'text-slate-300',
      boxClass: 'border-slate-700/50 bg-slate-900/60',
      defaultTitle: 'Belum ada data',
      defaultBody: 'Workspace siap dan akan menampilkan informasi saat data tersedia.',
    },
  };

  const state = config[mode] || config.loading;
  const Icon = state.icon;

  return (
    <div className={`ka-bg flex items-center justify-center px-4 text-white ${compact ? 'min-h-48 py-6' : 'min-h-[55vh] py-10'}`} role={mode === 'error' ? 'alert' : 'status'} aria-live="polite">
      <section className="ka-surface w-full max-w-md p-5 text-center sm:p-6">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${state.boxClass}`}><Icon className={`h-6 w-6 ${state.iconClass}`} aria-hidden="true" /></div>
        <h2 className="mt-4 text-lg font-black">{title || state.defaultTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{body || state.defaultBody}</p>
        {onAction && <button type="button" onClick={onAction} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 text-sm font-bold text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"><RefreshCw className="h-4 w-4" />{actionLabel || 'Coba lagi'}</button>}
      </section>
    </div>
  );
}
