import React, { useEffect, useState } from 'react';
import { DATA_STATE } from '@/lib/dataState';
import { ExternalLink } from 'lucide-react';
import DataProvenanceBar from './DataProvenanceBar';

const REFRESH_MS = 30000;

export default function ZevaryqLiveStrip() {
  const [network, setNetwork] = useState(null);
  const [state, setState] = useState(DATA_STATE.CHECKING);

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
        if (active) {
          const verified = response.ok && payload?.live === true && payload?.verified === true;
          setNetwork(verified ? payload : null);
          setState(verified ? DATA_STATE.VERIFIED : DATA_STATE.UNAVAILABLE);
        }
      } catch {
        if (active) {
          setNetwork(null);
          setState(DATA_STATE.UNAVAILABLE);
        }
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
    <section className="rounded-2xl border border-amber-400/10 bg-[#050c16] px-4 py-2.5 text-[10px]">
      <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1">
      <b className="text-amber-300">ZEVARYQ</b>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        ZEVARYQ network identity: {network ? 'verified' : 'unavailable'}.
      </span>
      <span className={network ? 'text-emerald-300' : 'text-slate-400'}>● {network ? DATA_STATE.VERIFIED : DATA_STATE.UNAVAILABLE}</span>
      <span className="text-slate-400">|</span>
      <span className="font-black text-white">{Number.isFinite(block) ? '#' + block.toLocaleString('en-US') : '—'}</span>
      <span className="text-slate-400">|</span>
      <span className={synced ? 'text-emerald-300' : 'text-slate-400'}>{synced ? DATA_STATE.SYNCED : '—'}</span>
      <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" aria-label="Open ZEVARYQ Explorer in a new tab" className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-black text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">
        Explorer <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
      </div>
      <DataProvenanceBar
        state={state}
        source={network ? 'ZEVARYQ Network Status · rpc.kriptoaman.com' : 'ZEVARYQ network source unavailable'}
        timestamp={network?.checkedAt}
        ageMs={network?.checkedAt ? Math.max(0, Date.now() - new Date(network.checkedAt).getTime()) : null}
        label="NETWORK PROOF"
      />
    </section>
  );
}
