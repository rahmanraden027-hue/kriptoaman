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
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        ZEVARYQ network status: {network ? 'live and verified' : 'unavailable'}.
      </span>
      <span className={network ? 'text-emerald-300' : 'text-slate-400'}>● {network ? 'LIVE' : 'UNAVAILABLE'}</span>
      <span className="text-slate-400">|</span>
      <span className="font-black text-white">{Number.isFinite(block) ? '#' + block.toLocaleString('en-US') : '—'}</span>
      <span className="text-slate-400">|</span>
      <span className={synced ? 'text-emerald-300' : 'text-slate-400'}>{synced ? 'SYNCED' : '—'}</span>
      <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" aria-label="Open ZEVARYQ Explorer in a new tab" className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-black text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">
        Explorer <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </section>
  );
}
