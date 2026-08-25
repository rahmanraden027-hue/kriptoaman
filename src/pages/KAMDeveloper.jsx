import React from 'react';
import { Code2, Copy, ExternalLink, Network, ShieldCheck, WalletCards } from 'lucide-react';

const NETWORK = {
  name: 'KriptoAman Mainnet Candidate',
  chainId: 22028,
  chainIdHex: '0x560c',
  symbol: 'KAM',
  decimals: 18,
  rpc: 'https://rpc.kriptoaman.com',
  explorer: 'https://explorer.kriptoaman.com',
};

const RPC_EXAMPLES = [
  ['Chain ID', `curl -s ${NETWORK.rpc} -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'`],
  ['Latest block', `curl -s ${NETWORK.rpc} -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'`],
];

export default function KAMDeveloper() {
  const copy = async (value) => navigator.clipboard?.writeText(String(value));
  return (
    <main className="ka-bg min-h-screen px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="ka-command-hero p-6 sm:p-8">
          <p className="ka-command-kicker">KAM DEVELOPER PORTAL</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Build on KriptoAman Network</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Quick-start metadata, JSON-RPC examples, wallet onboarding, explorer access, and production-safety guidance for EVM-compatible development.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200"><ShieldCheck className="h-4 w-4" /> mainnet-candidate-not-public</div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[['Chain ID', `${NETWORK.chainId} · ${NETWORK.chainIdHex}`, Network], ['Native currency', `${NETWORK.symbol} · ${NETWORK.decimals} decimals`, WalletCards], ['Execution model', 'EVM-compatible JSON-RPC', Code2]].map(([title, value, Icon]) => (
            <div key={title} className="ka-command-panel p-5"><Icon className="h-5 w-5 text-sky-300" /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-600">{title}</p><p className="mt-1 text-sm font-bold text-slate-200">{value}</p></div>
          ))}
        </section>

        <section className="ka-command-panel p-5 sm:p-6">
          <h2 className="text-lg font-black">Network metadata</h2>
          <div className="mt-4 divide-y divide-slate-800/80 rounded-2xl border border-slate-800/80">
            {[['Network', NETWORK.name], ['RPC', NETWORK.rpc], ['Chain ID', NETWORK.chainId], ['Currency', NETWORK.symbol], ['Explorer', NETWORK.explorer]].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-4 py-3"><div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-200">{value}</p></div><button onClick={() => copy(value)} className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white" aria-label={`Copy ${label}`}><Copy className="h-4 w-4" /></button></div>
            ))}
          </div>
        </section>

        <section className="ka-command-panel p-5 sm:p-6">
          <h2 className="text-lg font-black">JSON-RPC quick start</h2>
          <div className="mt-4 space-y-4">{RPC_EXAMPLES.map(([label, code]) => <div key={label}><p className="mb-2 text-xs font-bold text-slate-400">{label}</p><div className="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-4 pr-12"><code className="block overflow-x-auto whitespace-pre text-[11px] leading-5 text-emerald-200">{code}</code><button onClick={() => copy(code)} className="absolute right-3 top-3 rounded-lg border border-slate-800 p-2 text-slate-500 hover:text-white"><Copy className="h-3.5 w-3.5" /></button></div></div>)}</div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <a href="/KAMNetwork" className="ka-command-panel p-5 transition hover:border-sky-400/30"><WalletCards className="h-5 w-5 text-sky-300" /><h2 className="mt-3 font-black">Add to Wallet</h2><p className="mt-1 text-xs leading-5 text-slate-500">Open the official network page for wallet_addEthereumChain onboarding and live RPC checks.</p></a>
          <a href={NETWORK.explorer} target="_blank" rel="noreferrer" className="ka-command-panel p-5 transition hover:border-emerald-400/30"><ExternalLink className="h-5 w-5 text-emerald-300" /><h2 className="mt-3 font-black">Explorer</h2><p className="mt-1 text-xs leading-5 text-slate-500">Inspect blocks, transactions, addresses, and live network activity.</p></a>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-[10px] leading-relaxed text-slate-600">Production guidance: never expose validator admin/debug/personal/qbft namespaces publicly, never embed private keys or signing secrets in client applications, and treat browser-side probes as convenience telemetry rather than validator or backup evidence.</section>
      </div>
    </main>
  );
}
