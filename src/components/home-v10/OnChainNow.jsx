import React, { useEffect, useState } from 'react';
import { ArrowRight, Boxes, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const REFRESH_MS = 15000;

export default function OnChainNow() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    let timer;
    const load = async () => {
      try {
        const response = await fetch('/api/zvq-token-intelligence', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();
        if (active) setData(response.ok && payload?.status === 'live' ? payload : null);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) timer = window.setTimeout(load, REFRESH_MS);
      }
    };
    load();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const metrics = [
    ['Block', Number.isFinite(Number(data?.head?.number)) ? '#' + Number(data.head.number).toLocaleString('en-US') : '—'],
    ['Contracts', data?.radar?.contractCreationsObserved ?? '—'],
    ['Metadata', data?.radar?.tokenMetadataProven ?? '—'],
  ];

  return (
    <section className="rounded-[26px] border border-amber-400/10 bg-[#050c16] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-amber-300"><Radio className="h-3.5 w-3.5" /> ON-CHAIN NOW</p>
          <h2 className="mt-1 text-lg font-black text-white">ZEVARYQ discovery</h2>
        </div>
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
            <p className="truncate text-sm font-black text-white">{value}</p>
            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <Link to="/QoryVExDiscovery" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-300">
        Open discovery <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
