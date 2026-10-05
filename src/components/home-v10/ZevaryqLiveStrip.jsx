import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

const REFRESH_MS = 30000;

export default function ZevaryqLiveStrip() {
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    let active = true;
    let timer;
    const load = async () => {
      try {
        const response = await fetch('/api/kam/network-status', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();
        if (active) setNetwork(response.ok && payload?.live === true && payload?.verified === true ? payload : null);
      } catch {
        if (active) setNetwork(null);
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

  const block = Number(network?.blockNumber);
  const synced = String(network?.syncStatus || '').toUpperCase() === 'SYNCED';

  return (
    <section className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-amber-400/10 bg-[#050c16] px-4 py-2.5 text-[10px]">
      <b className="text-amber-300">ZEVARYQ</b>
      <span className={network ? 'text-emerald-300' : 'text-slate-500'}>● {network ? 'LIVE' : 'UNAVAILABLE'}</span>
      <span className="text-slate-500">|</span>
      <span className="font-black text-white">{Number.isFinite(block) ? '#' + block.toLocaleString('en-US') : '—'}</span>
      <span className="text-slate-500">|</span>
      <span className={synced ? 'text-emerald-300' : 'text-slate-500'}>{synced ? 'SYNCED' : '—'}</span>
      <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 font-black text-cyan-300">
        Explorer <ExternalLink className="h-3 w-3" />
      </a>
    </section>
  );
}
