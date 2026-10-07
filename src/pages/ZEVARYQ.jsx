import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Blocks,
  ExternalLink,
  Gauge,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import CrossSurfaceRail from '@/components/command/CrossSurfaceRail';
import DataProvenanceBar from '@/components/home-v10/DataProvenanceBar';
import ZevaryqMark from '@/components/zevaryq-wallet/ZevaryqMark';
import useZevaryqSurface from '@/hooks/useZevaryqSurface';
import useZevaryqNetworkInspection from '@/hooks/useZevaryqNetworkInspection';
import { DATA_STATE } from '@/lib/dataState';

const EXPLORER = 'https://explorer.kriptoaman.com';

const positiveState = (state) => [DATA_STATE.LIVE, DATA_STATE.SYNCED, DATA_STATE.VERIFIED].includes(state);

const tone = (state) => positiveState(state)
  ? 'text-emerald-300'
  : [DATA_STATE.CHECKING, DATA_STATE.DELAYED, DATA_STATE.SNAPSHOT].includes(state)
    ? 'text-amber-300'
    : 'text-slate-300';

const shortHash = (value, left = 8, right = 6) => {
  const text = String(value || '');
  if (!text) return '—';
  if (text.length <= left + right + 3) return text;
  return text.slice(0, left) + '…' + text.slice(-right);
};

const formatNumber = (value) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString('en-US')
  : '—';

const formatTime = (value) => {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  return new Date(ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

function Panel({ title, kicker, children, className = '', action = null }) {
  return (
    <section className={'relative overflow-hidden rounded-[24px] border border-cyan-300/[0.10] bg-[#050c16]/96 p-4 sm:p-5 ' + className}>
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {kicker ? <p className="text-[8px] font-black uppercase tracking-[0.16em] text-cyan-300">{kicker}</p> : null}
          <h2 className="mt-1 text-base font-black text-white sm:text-lg">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, state, detail }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-300/[0.10] bg-[#06101d]/92 p-3.5">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] text-cyan-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className={'text-[8px] font-black uppercase tracking-[0.11em] ' + tone(state)}>{state}</span>
      </div>
      <b className="mt-3 block truncate text-lg font-black tracking-[-0.03em] text-white">{value}</b>
      <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.10em] text-slate-300">{label}</span>
      {detail ? <span className="mt-1 block truncate text-[8px] text-slate-500">{detail}</span> : null}
    </div>
  );
}

function SignatureNetworkGlobe({ inspection }) {
  const head = Number(inspection?.head?.number);
  const proposers = inspection?.evidence?.observedProposers?.addresses || [];
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[590px]"
      data-network-inspection-globe="signature-v1"
      aria-label="ZEVARYQ verified network topology"
    >
      <div className="absolute inset-[7%] rounded-full border border-cyan-300/20 bg-[radial-gradient(circle_at_45%_38%,rgba(34,211,238,.26),rgba(14,165,233,.09)_28%,rgba(2,6,23,.92)_67%)] shadow-[0_0_90px_rgba(14,165,233,.18),inset_0_0_80px_rgba(14,165,233,.14)]" />
      <div className="absolute inset-[13%] rounded-full border border-cyan-300/20" />
      <div className="absolute left-1/2 top-[10%] h-[80%] w-[42%] -translate-x-1/2 rounded-[50%] border border-cyan-300/14" />
      <div className="absolute left-1/2 top-[10%] h-[80%] w-[72%] -translate-x-1/2 rounded-[50%] border border-cyan-300/10" />
      <div className="absolute left-[10%] top-1/2 h-[30%] w-[80%] -translate-y-1/2 rounded-[50%] border border-amber-300/14" />
      <div className="absolute left-[10%] top-1/2 h-[58%] w-[80%] -translate-y-1/2 rounded-[50%] border border-cyan-300/10" />
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle_at_62%_32%,rgba(251,191,36,.18),transparent_12%),radial-gradient(circle_at_30%_48%,rgba(34,211,238,.22),transparent_15%),radial-gradient(circle_at_58%_68%,rgba(59,130,246,.22),transparent_14%)]" />

      {Array.from({ length: 14 }, (_, index) => {
        const angle = (index / 14) * Math.PI * 2;
        const radius = 36 + (index % 3) * 7;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * (radius * 0.72);
        return (
          <span
            key={index}
            className={'absolute h-2 w-2 rounded-full shadow-[0_0_16px_currentColor] ' + (index % 4 === 0 ? 'bg-amber-300 text-amber-300' : 'bg-cyan-300 text-cyan-300')}
            style={{ left: x + '%', top: y + '%' }}
            aria-hidden="true"
          />
        );
      })}

      <div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28px] border border-amber-300/25 bg-[#06101d]/90 shadow-[0_0_45px_rgba(251,191,36,.18)] sm:h-28 sm:w-28">
        <ZevaryqMark className="h-16 w-16 sm:h-20 sm:w-20" />
      </div>

      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 rounded-full border border-cyan-300/15 bg-[#020711]/90 px-3 py-1.5 text-center">
        <span className="block text-[8px] font-black uppercase tracking-[0.12em] text-cyan-300">Verified Head</span>
        <b className="mt-0.5 block text-xs text-white">{Number.isSafeInteger(head) ? '#' + head.toLocaleString('en-US') : '—'}</b>
      </div>

      <div className="absolute left-[3%] top-[17%] rounded-xl border border-white/[0.07] bg-[#020711]/90 px-2.5 py-2">
        <span className="block text-[7px] font-black uppercase tracking-[0.10em] text-slate-400">Observed proposers</span>
        <b className="mt-1 block text-[11px] text-white">{proposers.length || '—'}</b>
      </div>
      <div className="absolute right-[2%] top-[24%] rounded-xl border border-white/[0.07] bg-[#020711]/90 px-2.5 py-2">
        <span className="block text-[7px] font-black uppercase tracking-[0.10em] text-slate-400">Source</span>
        <b className="mt-1 block text-[9px] text-cyan-200">FIRST-PARTY RPC</b>
      </div>
    </div>
  );
}

function MiniActivityChart({ rows, valueKey, suffix = '' }) {
  const values = rows.map((row) => Number(row[valueKey])).filter(Number.isFinite);
  const max = Math.max(1, ...values);
  return (
    <div className="mt-4 flex h-36 items-end gap-2 rounded-2xl border border-white/[0.05] bg-[#020711]/65 p-3">
      {rows.length ? rows.map((row) => {
        const value = Number(row[valueKey]);
        const height = Number.isFinite(value) ? Math.max(6, (value / max) * 100) : 6;
        return (
          <div key={row.number} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[7px] font-black text-slate-500">{Number.isFinite(value) ? value.toFixed(valueKey === 'utilization' ? 1 : 0) + suffix : '—'}</span>
            <span className="w-full rounded-t-md bg-gradient-to-t from-cyan-500/55 to-cyan-300/95" style={{ height: height + '%' }} />
            <span className="truncate text-[7px] text-slate-500">#{String(row.number).slice(-4)}</span>
          </div>
        );
      }) : <div className="m-auto text-[9px] text-slate-500">Verified block series unavailable.</div>}
    </div>
  );
}

export default function ZEVARYQ() {
  const surface = useZevaryqSurface();
  const inspection = useZevaryqNetworkInspection();

  const metrics = inspection?.metrics || null;
  const evidence = inspection?.evidence || null;
  const blocks = inspection?.blocks || [];
  const validatorAddresses = evidence?.validatorSet?.available ? evidence.validatorSet.addresses || [] : [];
  const proposerAddresses = evidence?.observedProposers?.available ? evidence.observedProposers.addresses || [] : [];

  const activityRows = useMemo(() => inspection?.utilizationSeries || [], [inspection?.utilizationSeries]);
  const latestBlock = Number(inspection?.head?.number);
  const latestTxCount = Number(metrics?.latestTxCount);
  const rpcLatency = Number(metrics?.rpcIdentityLatencyMs);
  const averageBlockTime = Number(metrics?.averageBlockTimeSeconds);
  const indexedHead = Number(metrics?.indexedHead);
  const indexerLag = Number(metrics?.indexerLagBlocks);

  const cards = [
    { icon: ShieldCheck, label: 'Network Health', value: positiveState(surface?.networkState) ? 'OPERATIONAL' : surface?.networkState || 'CHECKING', state: surface?.networkState || DATA_STATE.CHECKING, detail: 'Verified first-party state' },
    { icon: Blocks, label: 'ZEVARYQ Mainnet', value: 'Chain 22028', state: DATA_STATE.VERIFIED, detail: '0x560c · ZVQ' },
    { icon: Blocks, label: 'Latest Block', value: Number.isSafeInteger(latestBlock) ? '#' + latestBlock.toLocaleString('en-US') : '—', state: inspection?.state || DATA_STATE.CHECKING, detail: Number.isFinite(latestTxCount) ? latestTxCount + ' tx in latest block' : 'Latest tx count unavailable' },
    { icon: Gauge, label: 'RPC Latency', value: Number.isFinite(rpcLatency) ? Math.round(rpcLatency) + ' ms' : '—', state: inspection?.state || DATA_STATE.CHECKING, detail: 'Identity probe' },
    { icon: Activity, label: 'Sync Status', value: surface?.syncState || DATA_STATE.CHECKING, state: surface?.syncState || DATA_STATE.CHECKING, detail: 'Canonical network-status' },
    { icon: Radio, label: 'Pending TX', value: 'NOT EXPOSED', state: DATA_STATE.UNAVAILABLE, detail: 'No synthetic mempool count' },
  ];

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_35%_-8%,rgba(14,165,233,.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(245,158,11,.055),transparent_24%),linear-gradient(#020711,#01050c)] px-3 pb-28 pt-4 text-white sm:px-5"
      data-product-surface="network"
      data-product-release="phase15f"
      data-visual-architecture="inspect-network-v1"
      data-network-data-policy="verified-first-party-only"
    >
      <div className="mx-auto max-w-[1580px] space-y-3">
        <CrossSurfaceRail current="network" />

        <section className="relative overflow-hidden rounded-[26px] border border-cyan-300/[0.11] bg-[#050c16]/94 p-4 sm:p-5">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/45 to-transparent" aria-hidden="true" />
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-3">
              <ZevaryqMark className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.17em] text-cyan-300">KRIPTOAMAN · INSPECT THE NETWORK</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">ZEVARYQ Network Intelligence</h1>
                <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-400 sm:text-xs">
                  Deep inspection untuk block flow, validator evidence, RPC health, indexer parity, dan provenance. Tidak ada node, validator, lokasi, atau transaksi sintetis.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] px-4 text-[9px] font-black uppercase tracking-[0.10em] text-amber-200">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Understand Ecosystem
              </Link>
              <a href={EXPLORER} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 text-[9px] font-black uppercase tracking-[0.10em] text-cyan-200">
                Explorer <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="ZEVARYQ inspection KPIs">
          {cards.map((card) => <MetricCard key={card.label} {...card} />)}
        </section>

        <section className="grid gap-3 xl:grid-cols-12">
          <Panel
            title="Global Network Activity"
            kicker="VERIFIED TOPOLOGY · NO INVENTED LOCATIONS"
            className="xl:col-span-5"
            action={<span className={'rounded-full border border-current/15 px-2.5 py-1 text-[8px] font-black uppercase ' + tone(inspection?.state)}>{inspection?.state}</span>}
          >
            <SignatureNetworkGlobe inspection={inspection} />
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Peer count', evidence?.peerCount?.available ? formatNumber(evidence.peerCount.count) : 'NOT EXPOSED'],
                ['Validator set', evidence?.validatorSet?.available ? formatNumber(evidence.validatorSet.count) : 'NOT EXPOSED'],
                ['Observed proposers', evidence?.observedProposers?.available ? formatNumber(evidence.observedProposers.count) : '—'],
                ['Indexer lag', Number.isFinite(indexerLag) ? indexerLag + ' blocks' : '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.022] p-2.5">
                  <b className="block text-sm text-white">{value}</b>
                  <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-3 xl:col-span-7 xl:grid-cols-2">
            <Panel title="Block Activity" kicker="RECENT VERIFIED BLOCKS">
              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <b className="text-2xl font-black text-white">{Number.isFinite(latestTxCount) ? latestTxCount : '—'}</b>
                  <span className="ml-2 text-[9px] font-black uppercase text-slate-400">TX / latest block</span>
                </div>
                <span className="text-[9px] font-black text-cyan-300">{Number.isFinite(averageBlockTime) ? averageBlockTime.toFixed(2) + 's avg block time' : 'block time unavailable'}</span>
              </div>
              <MiniActivityChart rows={activityRows} valueKey="txCount" />
            </Panel>

            <Panel title="Block Utilization" kicker="GAS USED / GAS LIMIT">
              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <b className="text-2xl font-black text-white">{activityRows.length && Number.isFinite(activityRows.at(-1)?.utilization) ? activityRows.at(-1).utilization.toFixed(1) + '%' : '—'}</b>
                  <span className="ml-2 text-[9px] font-black uppercase text-slate-400">latest utilization</span>
                </div>
                <span className="text-[9px] font-black text-emerald-300">FIRST-PARTY</span>
              </div>
              <MiniActivityChart rows={activityRows} valueKey="utilization" suffix="%" />
            </Panel>

            <Panel title="Observed Proposers" kicker="RECENT PUBLIC BLOCK EVIDENCE" className="xl:col-span-2">
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {proposerAddresses.length ? proposerAddresses.slice(0, 6).map((address, index) => (
                  <div key={address} className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-3">
                    <span className="text-[8px] font-black uppercase tracking-[0.10em] text-slate-400">Proposer {index + 1}</span>
                    <b className="mt-2 block font-mono text-[10px] text-cyan-200">{shortHash(address, 10, 8)}</b>
                    <span className="mt-2 block text-[8px] text-slate-500">Recent block proposer; not equivalent to full validator-set evidence.</span>
                  </div>
                )) : (
                  <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] p-4 text-[9px] text-amber-100">
                    Observed proposer evidence belum tersedia pada window publik saat ini.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-12">
          <Panel title="Recent Verified Blocks" kicker="JSON-RPC · FIRST-PARTY" className="xl:col-span-8">
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[9px]">
                <thead className="text-[8px] font-black uppercase tracking-[0.09em] text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Block</th>
                    <th className="px-2 py-2">Time</th>
                    <th className="px-2 py-2">TXs</th>
                    <th className="px-2 py-2">Gas used</th>
                    <th className="px-2 py-2">Confirmations</th>
                    <th className="px-2 py-2">Proposer</th>
                    <th className="px-2 py-2">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.length ? blocks.map((block) => (
                    <tr key={block.number} className="border-t border-white/[0.045] text-slate-300">
                      <td className="px-2 py-2.5 font-black text-cyan-200">#{formatNumber(block.number)}</td>
                      <td className="px-2 py-2.5">{formatTime(block.timestamp)}</td>
                      <td className="px-2 py-2.5">{formatNumber(block.txCount)}</td>
                      <td className="px-2 py-2.5">{formatNumber(block.gasUsed)}</td>
                      <td className="px-2 py-2.5">{formatNumber(block.confirmations)}</td>
                      <td className="px-2 py-2.5 font-mono">{shortHash(block.proposer)}</td>
                      <td className="px-2 py-2.5 font-mono text-slate-500">{shortHash(block.hash)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="px-2 py-10 text-center text-slate-500">Verified block table unavailable.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Network Details" kicker="CHAIN + INDEXER EVIDENCE" className="xl:col-span-4">
            <div className="mt-3 space-y-2">
              {[
                ['Network', 'ZEVARYQ Mainnet'],
                ['Chain ID', '22028 · 0x560c'],
                ['Native asset', 'ZEVARYQ (ZVQ)'],
                ['Sync', surface?.syncState || DATA_STATE.CHECKING],
                ['Average block time', Number.isFinite(averageBlockTime) ? averageBlockTime.toFixed(2) + ' s' : '—'],
                ['Indexed head', Number.isSafeInteger(indexedHead) ? '#' + indexedHead.toLocaleString('en-US') : '—'],
                ['Indexer lag', Number.isFinite(indexerLag) ? indexerLag + ' blocks' : '—'],
                ['Validator evidence', evidence?.validatorSet?.available ? evidence.validatorSet.count + ' public QBFT addresses' : 'NOT EXPOSED'],
                ['Peer count', evidence?.peerCount?.available ? formatNumber(evidence.peerCount.count) : 'NOT EXPOSED'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-white/[0.045] py-2 last:border-b-0">
                  <span className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">{label}</span>
                  <b className="max-w-[58%] text-right text-[9px] text-white">{value}</b>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <Panel title="Validator / Node Evidence" kicker="FAIL-CLOSED">
            {validatorAddresses.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {validatorAddresses.slice(0, 8).map((address, index) => (
                  <div key={address} className="rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] p-3">
                    <span className="text-[8px] font-black uppercase text-emerald-300">Validator {index + 1}</span>
                    <b className="mt-1 block font-mono text-[10px] text-white">{shortHash(address, 11, 8)}</b>
                    <span className="mt-1 block text-[8px] text-slate-500">Public QBFT RPC evidence</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] p-4">
                <b className="text-sm text-amber-200">VALIDATOR SET · NOT EXPOSED</b>
                <p className="mt-2 text-[9px] leading-4 text-slate-400">Tidak ada lokasi, nama operator, atau jumlah validator yang diinferensikan. Panel akan terisi hanya bila RPC QBFT publik mengembalikan bukti validator-set yang valid.</p>
              </div>
            )}
          </Panel>

          <Panel title="Evidence & Provenance" kicker="WHY THIS DATA CAN BE TRUSTED">
            <div className="mt-3 grid gap-2">
              <DataProvenanceBar
                state={inspection?.state || DATA_STATE.CHECKING}
                source={inspection?.provenance?.rpcEndpoint ? 'ZEVARYQ Live Blocks · rpc.kriptoaman.com' : 'ZEVARYQ live-block source unavailable'}
                timestamp={inspection?.checkedAt}
                ageMs={inspection?.ageMs}
                label="LIVE BLOCK SOURCE"
              />
              <DataProvenanceBar
                state={surface?.onChainState || DATA_STATE.CHECKING}
                source={surface?.onChain?.provenance?.endpoint ? 'ZEVARYQ Token Intelligence · first-party JSON-RPC' : 'Token intelligence source unavailable'}
                timestamp={surface?.onChainObservedAt}
                ageMs={surface?.onChainAgeMs}
                label="ON-CHAIN EVIDENCE SOURCE"
              />
            </div>
            <div className="mt-3 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.03] p-3 text-[8px] leading-4 text-slate-400">
              Node locations, exchange identities, pending-transaction counts, throughput MB/s, and validator names are intentionally not fabricated. Data appears only when first-party RPC or indexed explorer evidence proves it. Identitas RPC terverifikasi tidak dengan sendirinya menyatakan public-mainnet promotion; mainnet publik tetap mengikuti gerbang operasional produksi.
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
