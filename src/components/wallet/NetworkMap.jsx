import React, { useState } from 'react';
import { ExternalLink, ArrowRight, Link2 } from 'lucide-react';

const NETWORKS = [
  {
    id: 'ethereum', name: 'Ethereum', color: '#627EEA', layer: 'L1',
    children: [
      { id: 'arbitrum', name: 'Arbitrum One',  color: '#28A0F0', layer: 'L2', type: 'Optimistic Rollup', bridgeUrl: 'https://bridge.arbitrum.io', coinId: 'ARB', tps: '~40,000', fee: '$0.01–0.10' },
      { id: 'optimism', name: 'Optimism',      color: '#FF0420', layer: 'L2', type: 'Optimistic Rollup', bridgeUrl: 'https://app.optimism.io/bridge', coinId: 'OP', tps: '~2,000', fee: '$0.01–0.10' },
      { id: 'base',     name: 'Base',          color: '#0052FF', layer: 'L2', type: 'Optimistic Rollup', bridgeUrl: 'https://bridge.base.org', coinId: 'BASE', tps: '~2,000', fee: '$0.01–0.05' },
    ],
  },
  {
    id: 'bnb', name: 'BNB Chain', color: '#F0B90B', layer: 'L1', coinId: 'BNB',
    note: 'EVM Compatible · ~3s finality',
    children: [],
  },
  {
    id: 'polygon', name: 'Polygon', color: '#8247E5', layer: 'L1', coinId: 'MATIC',
    note: 'EVM Compatible · PoS sidechain',
    children: [],
  },
  {
    id: 'avalanche', name: 'Avalanche', color: '#E84142', layer: 'L1', coinId: 'AVAX',
    note: 'C-Chain EVM · sub-2s finality',
    children: [],
  },
  {
    id: 'fantom', name: 'Fantom', color: '#1969FF', layer: 'L1', coinId: 'FTM',
    note: 'EVM Compatible · DAG consensus',
    children: [],
  },
  {
    id: 'solana', name: 'Solana', color: '#9945FF', layer: 'L1', coinId: 'SOL',
    note: 'Non-EVM · 65,000 TPS',
    children: [],
  },
  {
    id: 'bitcoin', name: 'Bitcoin', color: '#F7931A', layer: 'L1', coinId: 'BTC',
    note: 'PoW · ~10 min blocks',
    children: [],
  },
];

// Cross-chain bridge connections
const BRIDGES = [
  { from: 'ethereum', to: 'bnb',       name: 'Multichain / Stargate',   url: 'https://stargate.finance' },
  { from: 'ethereum', to: 'polygon',   name: 'Polygon Bridge',          url: 'https://wallet.polygon.technology/bridge' },
  { from: 'ethereum', to: 'avalanche', name: 'Avalanche Bridge',        url: 'https://bridge.avax.network' },
  { from: 'ethereum', to: 'fantom',    name: 'Multichain',              url: 'https://multichain.org' },
  { from: 'ethereum', to: 'solana',    name: 'Wormhole',                url: 'https://wormhole.com' },
];

function NetworkCard({ net, isSelected, onClick }) {
  return (
    <div
      onClick={() => onClick(net)}
      className={`cursor-pointer rounded-xl border p-3 transition-all ${isSelected ? 'border-opacity-100 ring-1' : 'border-slate-700/40 hover:border-slate-600'}`}
      style={isSelected ? { borderColor: net.color, ringColor: net.color, background: net.color + '11' } : { background: 'rgba(30,41,59,0.5)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: net.color }}>
            {net.name[0]}
          </div>
          <span className="text-white text-xs font-semibold">{net.name}</span>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: net.color + '22', color: net.color }}>
          {net.layer}
        </span>
      </div>
      {net.note && <p className="text-slate-500 text-xs">{net.note}</p>}
      {net.children.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {net.children.map(c => (
            <span key={c.id} className="text-xs px-1.5 py-0.5 rounded-md border" style={{ borderColor: c.color + '44', color: c.color, background: c.color + '11' }}>
              {c.name.split(' ')[0]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function L2Card({ l2 }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: l2.color }}>{l2.name[0]}</div>
          <span className="text-white text-xs font-semibold">{l2.name}</span>
          <span className="text-xs px-1 py-0.5 rounded text-xs font-medium" style={{ background: l2.color + '22', color: l2.color }}>L2</span>
        </div>
        <a href={l2.bridgeUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs flex items-center gap-1 text-slate-400 hover:text-white border border-slate-700 rounded-lg px-2 py-0.5 transition-colors"
          onClick={e => e.stopPropagation()}>
          Bridge <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div><div className="text-slate-500">Tipe</div><div className="text-slate-300 font-medium">{l2.type.split(' ')[0]}</div></div>
        <div><div className="text-slate-500">TPS</div><div className="text-slate-300 font-medium">{l2.tps}</div></div>
        <div><div className="text-slate-500">Gas</div><div className="text-green-400 font-medium">{l2.fee}</div></div>
      </div>
    </div>
  );
}

export default function NetworkMap() {
  const [selected, setSelected] = useState(null);

  const handleClick = (net) => setSelected(selected?.id === net.id ? null : net);
  const bridgesForSelected = selected ? BRIDGES.filter(b => b.from === selected.id || b.to === selected.id) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-slate-400" />
        <h2 className="text-white font-semibold text-sm">Peta Jaringan</h2>
        <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">Multi-chain</span>
      </div>

      <p className="text-slate-500 text-xs">Klik jaringan untuk melihat L2, bridge, dan koneksi antar rantai.</p>

      <div className="grid grid-cols-2 gap-2">
        {NETWORKS.map(net => (
          <NetworkCard key={net.id} net={net} isSelected={selected?.id === net.id} onClick={handleClick} />
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: selected.color }}>
              {selected.name[0]}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{selected.name}</div>
              <div className="text-slate-500 text-xs">{selected.note || selected.layer}</div>
            </div>
          </div>

          {/* L2 children */}
          {selected.children.length > 0 && (
            <div className="space-y-2">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> Layer 2 di atas {selected.name}
              </div>
              {selected.children.map(l2 => <L2Card key={l2.id} l2={l2} />)}
            </div>
          )}

          {/* Bridges */}
          {bridgesForSelected.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Bridge Tersedia
              </div>
              {bridgesForSelected.map((b, i) => {
                const other = b.from === selected.id ? b.to : b.from;
                const otherNet = NETWORKS.find(n => n.id === other);
                return (
                  <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-300">{selected.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-300">{otherNet?.name || other}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>{b.name}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}