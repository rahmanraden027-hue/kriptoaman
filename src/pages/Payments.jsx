import React, { useMemo, useState } from 'react';
import { CreditCard, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';

const PURPOSES = [
  { id: 'premium', label: 'KriptoAman Premium' },
  { id: 'report', label: 'Laporan & riset' },
  { id: 'service', label: 'Layanan KriptoAman' },
];

export default function Payments() {
  const [amount, setAmount] = useState('50000');
  const [purpose, setPurpose] = useState('service');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numericAmount = useMemo(() => Number(String(amount).replace(/\D/g, '')), [amount]);

  const startPayment = async () => {
    setError('');
    if (!Number.isFinite(numericAmount) || numericAmount < 1000) {
      setError('Nominal pembayaran minimal Rp1.000.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount, purpose, customer: { email } }),
      });
      const data = await res.json();
      if (!res.ok || !data?.checkoutUrl) throw new Error(data?.error || 'PAYMENT_CREATE_FAILED');
      window.location.assign(data.checkoutUrl);
    } catch {
      setError('Checkout belum dapat dibuat. Pastikan kanal pembayaran resmi sudah diaktifkan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-lg space-y-5 px-4 pt-5">
        <header className="flex items-center justify-between">
          <KriptoAmanLogo size={42} showText textSize="text-sm" />
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">PEMBAYARAN RESMI</span>
        </header>

        <section className="ka-surface p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold">Checkout KriptoAman</h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">Untuk pembayaran layanan KriptoAman dalam rupiah. Halaman ini tidak digunakan untuk membeli atau menjual aset kripto.</p>
            </div>
          </div>

          <label className="mb-1 block text-xs font-semibold text-slate-300">Keperluan</label>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm">
            {PURPOSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <label className="mb-1 block text-xs font-semibold text-slate-300">Nominal (IDR)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm" />

          <label className="mb-1 block text-xs font-semibold text-slate-300">Email bukti pembayaran</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="nama@email.com" className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm" />

          {error && <p className="mb-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}

          <button onClick={startPayment} disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold hover:bg-blue-500 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {loading ? 'Membuat checkout…' : 'Lanjut ke pembayaran resmi'}
          </button>
        </section>

        <section className="ka-surface flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-xs leading-relaxed text-slate-400">Secret key payment gateway tidak disimpan di aplikasi. Status pembayaran hanya boleh dikonfirmasi oleh callback server yang terverifikasi.</p>
        </section>
      </div>
    </div>
  );
}
