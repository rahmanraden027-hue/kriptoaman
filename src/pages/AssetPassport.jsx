import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, BadgeCheck, Blocks, Code2, ExternalLink, Fingerprint, ShieldAlert, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const short = value => value ? `${String(value).slice(0, 10)}…${String(value).slice(-8)}` : '—';

function Field({ label, value, mono = false }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className={`mt-2 break-all text-sm font-bold text-slate-100 ${mono ? 'font-mono' : ''}`}>{value ?? 'UNAVAILABLE'}</p></div>;
}

export default function AssetPassport() {
  const { address } = useParams();
  const validAddress = ADDRESS_RE.test(address || '');
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;
    if (!validAddress) { setState({ loading: false, data: null, error: 'Invalid ZEVARYQ contract address' }); return undefined; }
    const load = async () => {
      try {
        const response = await fetch('/api/zvq-token-intelligence', { headers: { Accept: 'application/json' }, cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || payload?.status !== 'live') throw new Error(payload?.message || 'Asset evidence unavailable');
        const candidate = (payload?.radar?.candidates || []).find(item => String(item?.address || '').toLowerCase() === address.toLowerCase());
        if (!candidate) throw new Error('Contract is not present in the current verified Radar window');
        if (active) setState({ loading: false, data: candidate, error: null });
      } catch (error) {
        if (active) setState({ loading: false, data: null, error: error?.message || 'Asset evidence unavailable' });
      }
    };
    load();
    return () => { active = false; };
  }, [address, validAddress]);

  const token = state.data;
  const passport = token?.assetPassport || {};
  const dna = token?.launchDna || {};
  const discovery = token?.qoryvexDiscovery || {};
  const verified = token?.type === 'ERC20_METADATA_PROVEN';
  const explorer = useMemo(() => validAddress ? `https://explorer.kriptoaman.com/address/${address}` : null, [address, validAddress]);

  return <main className="min-h-screen bg-[#020611] px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-6xl">
      <Link to="/qoryvex/discovery" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300"><ArrowLeft className="h-4 w-4" /> Back to New Token Radar</Link>
      <div className="mt-5 rounded-[30px] border border-cyan-400/15 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.12),transparent_30%),#06101b] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">KRIPTOAMAN ASSET PASSPORT · ZEVARYQ</p><h1 className="mt-2 text-3xl font-black">{passport.symbol || 'Contract Evidence'}</h1><p className="mt-1 text-sm text-slate-400">{passport.name || 'Metadata not proven'}</p></div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black ${verified ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/25 bg-amber-400/10 text-amber-300'}`}><BadgeCheck className="h-4 w-4" />{verified ? '4/4 METADATA PROVEN' : 'PARTIAL ON-CHAIN EVIDENCE'}</span>
        </div>

        {state.loading ? <p className="mt-8 text-sm text-slate-400">Verifying first-party chain evidence…</p> : state.error ? <div className="mt-8 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-5"><ShieldAlert className="h-5 w-5 text-amber-300" /><p className="mt-2 text-sm font-bold">{state.error}</p><p className="mt-1 text-xs text-slate-500">No cached or synthetic passport is substituted when current first-party evidence is absent.</p></div> : <>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Contract" value={token.address} mono /><Field label="Creator" value={token.creator} mono /><Field label="Creation block" value={Number(token.blockNumber).toLocaleString('en-US')} /><Field label="Confirmations" value={`${token.confirmations}/${token.confirmationDepth}`} />
            <Field label="Decimals" value={passport.decimals} /><Field label="Total supply · raw" value={passport.totalSupplyRaw} mono /><Field label="Bytecode" value={Number.isFinite(Number(passport.bytecodeBytes)) ? `${passport.bytecodeBytes} bytes` : null} /><Field label="Evidence fields" value={`${passport.metadataFieldsProven ?? 0}/4`} />
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <section className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-4"><h2 className="flex items-center gap-2 text-xs font-black text-cyan-300"><Blocks className="h-4 w-4" /> Provenance</h2><p className="mt-3 text-xs leading-6 text-slate-400">First-party JSON-RPC · Chain 22028<br/>Block hash <span className="font-mono text-slate-300">{short(passport?.provenance?.blockHash)}</span><br/>Creation tx <span className="font-mono text-slate-300">{short(token.creationTxHash)}</span><br/>Finality {token.confirmationState}</p></section>
            <section className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.035] p-4"><h2 className="flex items-center gap-2 text-xs font-black text-violet-300"><Fingerprint className="h-4 w-4" /> Launch DNA</h2><p className="mt-3 text-xs leading-6 text-slate-400">Freshness {dna.freshnessBand || 'UNAVAILABLE'}<br/>Age {dna.ageBlocks ?? '—'} blocks<br/>Metadata {dna.metadataFieldsProven ?? 0}/4<br/>Profile is descriptive, not a safety score.</p></section>
            <section className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] p-4"><h2 className="flex items-center gap-2 text-xs font-black text-amber-300"><Activity className="h-4 w-4" /> QoryVEx Gate</h2><p className="mt-3 text-xs leading-6 text-slate-400">Discovery {discovery.state || 'UNAVAILABLE'}<br/>Pool {discovery.poolEvidence || 'UNAVAILABLE'}<br/>Liquidity {discovery.liquidityEvidence || 'UNAVAILABLE'}<br/>Execution {discovery.executionState || 'DISABLED'}</p></section>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {explorer && <a href={explorer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200">Contract Explorer <ExternalLink className="h-3.5 w-3.5" /></a>}
            {token.creationTxHash && <a href={`https://explorer.kriptoaman.com/tx/${token.creationTxHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-slate-300">Creation Transaction <ExternalLink className="h-3.5 w-3.5" /></a>}
            <a href={`https://explorer.kriptoaman.com/block/${token.blockNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-slate-300">Creation Block <ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        </>}
      </div>
      <p className="mt-4 text-center text-[10px] leading-5 text-slate-600">Asset Passport records observable on-chain evidence. It is not an audit, listing approval, endorsement, investment recommendation, or guarantee of contract safety.</p>
    </div>
  </main>;
}
