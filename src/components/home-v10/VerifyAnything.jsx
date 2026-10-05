import React, { useState } from 'react';
import { Blocks, FileSearch, Search, ShieldCheck, WalletCards } from 'lucide-react';

const TYPES = [
  [ShieldCheck, 'Token'],
  [FileSearch, 'Contract'],
  [WalletCards, 'Wallet'],
  [Search, 'Transaction'],
  [Blocks, 'Block'],
];

export default function VerifyAnything() {
  const [query, setQuery] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    if (/^0x[a-fA-F0-9]{64}$/.test(value)) {
      window.location.assign(`https://explorer.kriptoaman.com/tx/${value}`);
      return;
    }
    if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
      window.location.assign(`/asset-passport/${value}`);
      return;
    }
    if (/^\d+$/.test(value)) {
      window.location.assign(`https://explorer.kriptoaman.com/block/${value}`);
      return;
    }
    window.location.assign(`/Market?search=${encodeURIComponent(value)}`);
  };

  return (
    <section className="rounded-[28px] border border-violet-400/15 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,.11),transparent_40%),#050c16] p-5 sm:p-6">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-300">VERIFY ANYTHING</p>
      <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/20 p-2">
        <Search className="ml-2 h-4 w-4 shrink-0 text-cyan-300" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Token / Contract / Wallet / Transaction / Block"
          className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-600"
          aria-label="Verify token, contract, wallet, transaction or block"
        />
        <button type="submit" className="min-h-11 rounded-xl bg-cyan-400 px-4 text-[10px] font-black text-[#021018]">VERIFY</button>
      </form>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {TYPES.map(([Icon, label]) => (
          <div key={label} className="grid min-h-16 place-items-center rounded-xl border border-white/[0.05] bg-white/[0.02] px-1 text-center">
            <Icon className="h-4 w-4 text-slate-400" />
            <span className="text-[8px] font-black text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
