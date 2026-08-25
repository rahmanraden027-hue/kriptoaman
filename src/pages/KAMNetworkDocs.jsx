import React from 'react';
import { ExternalLink, Network, Server, ShieldCheck, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';

const rows = [
  ['Network name', 'KriptoAman Mainnet Candidate'],
  ['Native asset', 'KAM'],
  ['Decimals', '18'],
  ['Chain ID', '22028'],
  ['Hex Chain ID', '0x560c'],
  ['RPC', 'https://rpc.kriptoaman.com'],
  ['Explorer', 'https://explorer.kriptoaman.com'],
  ['Consensus target', 'QBFT'],
  ['Validator target', '4 production validators'],
  ['EVM compatibility', 'Yes'],
];

function Card({ icon: Icon, title, children }) {
  return <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-sky-300" /><h2 className="font-bold text-white">{title}</h2></div><div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">{children}</div></section>;
}

export default function KAMNetworkDocs() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[28px] border border-sky-400/20 bg-sky-500/5 p-6 sm:p-8">
          <div className="flex items-center gap-3"><KriptoAmanLogo size={44} /><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">Official Network Documentation</p><h1 className="mt-1 text-3xl font-black">KAM Network</h1></div></div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">Canonical public documentation for KAM network identity, wallet metadata, public endpoints, security posture, and third-party registry references. The network remains labeled <strong>mainnet-candidate-not-public</strong> until the production promotion gate is fully satisfied.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
          {rows.map(([label, value]) => <div key={label} className="grid gap-1 border-b border-slate-800 px-5 py-4 last:border-b-0 sm:grid-cols-[180px_1fr]"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><span className="break-all text-sm font-semibold text-slate-200">{value}</span></div>)}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Card icon={ShieldCheck} title="Public RPC security posture">
            <p>The public RPC gateway is intended for restricted, read-oriented JSON-RPC access. Sensitive administrative and node-management namespaces including admin, debug, personal, and QBFT management methods are not intended to be exposed publicly.</p>
            <Link to="/RPCPrivacyPolicy" className="inline-flex items-center gap-1 font-semibold text-sky-300">RPC Privacy Policy <ExternalLink className="h-3 w-3" /></Link>
          </Card>
          <Card icon={Server} title="Readiness and transparency">
            <p>Public readiness requires correct Chain ID, continuous block production, RPC/explorer alignment, four-validator evidence, backup/restore validation, uptime/latency monitoring, and a final Chain ID collision check.</p>
            <Link to="/KAMNetwork" className="inline-flex items-center gap-1 font-semibold text-sky-300">Live Network Status <ExternalLink className="h-3 w-3" /></Link>
          </Card>
          <Card icon={WalletCards} title="Wallet metadata">
            <p>Wallets that support EVM custom networks may use Chain ID 22028, KAM as the native currency, the official RPC endpoint, and the official explorer. Manual custom-network support does not itself mean a wallet has officially listed KAM.</p>
          </Card>
          <Card icon={Network} title="Registry references">
            <p>Third-party registry submissions are reviewed independently by their maintainers. KriptoAman does not treat an open pull request or a manually added custom network as an accepted public listing.</p>
            <div className="flex flex-col gap-1"><a className="inline-flex items-center gap-1 font-semibold text-sky-300" href="https://github.com/DefiLlama/chainlist/pull/3089" target="_blank" rel="noreferrer">DefiLlama Chainlist PR #3089 <ExternalLink className="h-3 w-3" /></a><a className="inline-flex items-center gap-1 font-semibold text-sky-300" href="https://github.com/ethereum-lists/chains/pull/8639" target="_blank" rel="noreferrer">ethereum-lists/chains PR #8639 <ExternalLink className="h-3 w-3" /></a></div>
          </Card>
        </div>

        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
          <strong>Status notice:</strong> this documentation publishes verifiable network metadata and endpoints, but does not by itself declare final public-mainnet activation, exchange listing, market value, regulatory approval, custody, staking, or token-sale availability.
        </section>

        <div className="flex flex-wrap gap-3 text-xs"><Link to="/PrivacyPolicy" className="text-sky-300">General Privacy Policy</Link><Link to="/RPCPrivacyPolicy" className="text-sky-300">RPC Privacy Policy</Link><a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="text-sky-300">Explorer</a></div>
      </div>
    </main>
  );
}
