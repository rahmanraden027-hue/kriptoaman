import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BadgeCheck, Boxes, Database, ExternalLink, Fingerprint, Radio, Search, ShieldAlert } from 'lucide-react';

const REFRESH_MS = 10000;
const short = value => value ? `${String(value).slice(0, 8)}…${String(value).slice(-6)}` : '—';

function TruthBadge({ children, tone = 'sky' }) {
  const tones = {
    sky: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
    slate: 'border-white/10 bg-white/[0.04] text-slate-300',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${tones[tone] || tones.slate}`}>{children}</span>;
}

function TokenCard({ token }) {
  const passport = token?.assetPassport || {};
  const dna = token?.launchDna || {};
  const discovery = token?.qoryvexDiscovery || {};

  return (
    <article className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black text-white">{passport.symbol || 'Contract'}</h3>
            {token?.type === 'ERC20_METADATA_PROVEN'
              ? <TruthBadge tone="emerald">4/4 metadata proven</TruthBadge>
              : <TruthBadge tone="amber">contract only</TruthBadge>}
            <TruthBadge tone={token?.confirmationState === 'confirmed' ? 'emerald' : 'amber'}>
              {token?.confirmationState === 'confirmed' ? '12+ block confirmed' : 'early confirmation'}
            </TruthBadge>
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-slate-300">{passport.name || 'Unnamed on-chain contract'}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-500" title={token?.address}>{short(token?.address)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-sky-200">#{Number(token?.blockNumber || 0).toLocaleString('en-US')}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">{dna.freshnessBand || 'OBSERVED'}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Confirmations', Number.isFinite(Number(token?.confirmations)) ? `${token.confirmations}/${token.confirmationDepth ?? 12}` : '—'],
          ['Decimals', passport.decimals ?? '—'],
          ['Bytecode', Number.isFinite(Number(passport.bytecodeBytes)) ? `${passport.bytecodeBytes} B` : '—'],
          ['Evidence', `${passport.metadataFieldsProven ?? 0}/4 fields`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.05] bg-[#07111d]/75 px-3 py-2.5">
            <p className="truncate text-xs font-black text-white">{value}</p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <section className="rounded-2xl border border-sky-400/10 bg-sky-400/[0.035] p-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-sky-300">
            <BadgeCheck className="h-3.5 w-3.5" /> Asset Passport
          </div>
          <div className="mt-2 space-y-1 text-[10px] leading-5 text-slate-400">
            <p>Creator <span className="font-mono text-slate-300">{short(token?.creator)}</span></p>
            <p>Tx <span className="font-mono text-slate-300">{short(token?.creationTxHash)}</span></p>
            <p>Supply <span className="break-all text-slate-300">{passport.totalSupplyRaw ?? 'unavailable'}</span></p>
            <p>Block hash <span className="font-mono text-slate-300">{short(passport?.provenance?.blockHash)}</span></p>
            <p>Source <span className="text-slate-300">KriptoAman first-party RPC</span></p>
            <div className="flex flex-wrap gap-2 pt-1">
              {token?.address && <Link to={`/asset-passport/${token.address}`} className="inline-flex items-center gap-1 font-black text-emerald-300 hover:text-emerald-200">Asset Passport <BadgeCheck className="h-3 w-3" /></Link>}
              {token?.address && <a href={`https://explorer.kriptoaman.com/address/${token.address}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">Contract <ExternalLink className="h-3 w-3" /></a>}
              {token?.creationTxHash && <a href={`https://explorer.kriptoaman.com/tx/${token.creationTxHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">Creation tx <ExternalLink className="h-3 w-3" /></a>}
              {Number.isFinite(Number(token?.blockNumber)) && <a href={`https://explorer.kriptoaman.com/block/${Number(token.blockNumber)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">Block <ExternalLink className="h-3 w-3" /></a>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.035] p-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-violet-300">
            <Fingerprint className="h-3.5 w-3.5" /> Launch DNA
          </div>
          <div className="mt-2 space-y-1 text-[10px] leading-5 text-slate-400">
            <p>Freshness <span className="text-slate-300">{dna.freshnessBand || '—'}</span></p>
            <p>Finality <span className="text-slate-300">{dna.confirmationState || token?.confirmationState || '—'}</span></p>
            <p>Metadata proof <span className="text-slate-300">{dna.metadataFieldsProven ?? 0}/4</span></p>
            <p>Supply declared <span className="text-slate-300">{dna.declaredSupplyPresent ? 'yes' : 'not proven'}</span></p>
            <p className="text-slate-500">Descriptive profile only — not a safety score.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] p-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-300">
            <Search className="h-3.5 w-3.5" /> QoryVEx Discovery
          </div>
          <div className="mt-2 space-y-1 text-[10px] leading-5 text-slate-400">
            <p>State <span className="text-slate-300">{discovery.state || '—'}</span></p>
            <p>Pool evidence <span className="text-slate-300">{discovery.poolEvidence || 'UNAVAILABLE'}</span></p>
            <p>Liquidity <span className="text-slate-300">{discovery.liquidityEvidence || 'UNAVAILABLE'}</span></p>
            <p>Execution <span className="text-amber-200">{discovery.executionState || 'DISABLED'}</span></p>
          </div>
        </section>
      </div>
    </article>
  );
}

export default function NewTokenRadar({ expanded = false }) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

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
        if (!response.ok || payload?.status !== 'live') throw new Error(payload?.message || 'Token radar unavailable');
        if (active) setState({ loading: false, data: payload, error: null });
      } catch (error) {
        if (active) setState(previous => ({ loading: false, data: previous.data, error: error?.message || 'Unavailable' }));
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

  const { data, loading, error } = state;
  const ageMs = data?.observedAt ? Math.max(0, Date.now() - Number(data.observedAt)) : null;
  const live = !error && ageMs != null && ageMs < REFRESH_MS * 2;
  const candidates = useMemo(() => Array.isArray(data?.radar?.candidates) ? data.radar.candidates : [], [data]);
  const visible = expanded ? candidates.slice(0, 12) : candidates.slice(0, 4);

  return (
    <section className="rounded-[28px] border border-cyan-400/15 bg-[#06101b]/90 p-4 shadow-[0_24px_70px_-50px_rgba(34,211,238,.5)] sm:p-5" aria-label="Genesis Radar and QoryVEx Discovery">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">
            <Radio className="h-3.5 w-3.5" /> GENESIS RADAR · FIRST-PARTY
          </p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Asset Passport → Launch DNA → QoryVEx Discovery</h2>
          <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-400">
            Contract creation is detected from ZEVARYQ chain data, then verified against its receipt, canonical block hash, deployed bytecode, and all four ERC-20 metadata fields at the creation block. A discovered contract is never treated as a listing, audit, liquidity proof, or endorsement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TruthBadge tone={live ? 'emerald' : data ? 'amber' : 'slate'}>
            {loading ? 'connecting' : live ? 'first-party live' : data ? 'last verified' : 'unavailable'}
          </TruthBadge>
          <TruthBadge>{data?.provenance?.transport || 'JSON-RPC'}</TruthBadge>
          <TruthBadge>{data?.provenance?.finality || 'confirmation-aware'}</TruthBadge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [Boxes, 'Head', Number.isFinite(Number(data?.head?.number)) ? Number(data.head.number).toLocaleString('en-US') : '—'],
          [Activity, 'Creations', data?.radar?.contractCreationsObserved ?? '—'],
          [BadgeCheck, 'Metadata Proven', data?.radar?.tokenMetadataProven ?? '—'],
          [Database, 'Request Latency', Number.isFinite(Number(data?.latencyMs)) ? `${data.latencyMs} ms` : '—'],
        ].map(([Icon, label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
            <Icon className="h-4 w-4 text-cyan-300" />
            <p className="mt-2 truncate text-sm font-black text-white">{value}</p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {visible.map(token => <TokenCard key={token.address || token.creationTxHash} token={token} />)}
        {!loading && !visible.length && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
            <ShieldAlert className="mx-auto h-5 w-5 text-slate-500" />
            <p className="mt-2 text-sm font-black text-slate-200">{error ? 'Radar temporarily unavailable' : 'No contract candidates in the scanned block window'}</p>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              KriptoAman does not synthesize token discoveries when first-party evidence is absent.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 text-[9px] leading-4 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>Chain ID 22028</span>
          <span>Observed, not finalized</span>
          <span>External market provider: none</span>
          <span>Pool/liquidity execution gate: closed until verified</span>
        </div>
        {!expanded && (
          <a href="/qoryvex/discovery" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200 hover:bg-cyan-400/15">
            Open QoryVEx Discovery
          </a>
        )}
      </div>
    </section>
  );
}
