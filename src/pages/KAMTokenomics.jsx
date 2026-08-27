import React, { useEffect } from 'react';
import { ExternalLink, LockKeyhole, Network, PieChart, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';

const allocations = [
  ['Ecosystem & Network Development', '30%', '300,000,000 KAM'],
  ['Community & Adoption', '20%', '200,000,000 KAM'],
  ['Validator / Network Incentives', '15%', '150,000,000 KAM'],
  ['Treasury / Foundation', '15%', '150,000,000 KAM'],
  ['Team & Contributors', '10%', '100,000,000 KAM'],
  ['Liquidity & Market Development', '7%', '70,000,000 KAM'],
  ['Strategic Partnerships', '3%', '30,000,000 KAM'],
];

function Card({ icon: Icon, title, children }) {
  return <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-sky-300" /><h2 className="font-bold text-white">{title}</h2></div><div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">{children}</div></section>;
}

export default function KAMTokenomics() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'KAM Tokenomics & Roadmap | KriptoAman';

    let description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute('content') || '';
    if (!description) {
      description = document.createElement('meta');
      description.setAttribute('name', 'description');
      document.head.appendChild(description);
    }
    description.setAttribute('content', 'Canonical KAM tokenomics, supply model, allocation, vesting, KriptoAman Mainnet identity, and strategic KAM roadmap.');

    let canonical = document.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute('href') || '';
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://kriptoaman.com/KAMTokenomics');

    return () => {
      document.title = previousTitle;
      if (previousDescription) description?.setAttribute('content', previousDescription);
      if (previousCanonical) canonical?.setAttribute('href', previousCanonical);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pb-40 pt-6 text-white sm:pb-28">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="overflow-hidden rounded-[28px] border border-sky-400/20 bg-sky-500/5 p-5 sm:p-8">
          <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-4">
            <KriptoAmanLogo size={44} textSize="text-base sm:text-lg" className="max-w-full shrink-0" />
            <div className="min-w-0 max-w-full">
              <p className="break-words text-[10px] font-black uppercase tracking-[0.15em] text-sky-300 sm:tracking-[0.18em]">KAM ECONOMIC DOCUMENTATION</p>
              <h1 className="mt-1 max-w-full break-words text-[clamp(1.85rem,9vw,3rem)] font-black leading-[1.05] tracking-tight">KAM Tokenomics v1</h1>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">Canonical public presentation of the approved KAM economic baseline. This page does not change genesis or chain state and does not declare a commercial mainnet launch, exchange listing, guaranteed liquidity, or guaranteed price.</p>
          <div className="mt-4 inline-flex max-w-full rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[10px] font-bold leading-5 text-amber-200 sm:rounded-full sm:text-[11px]">PRE-COMMERCIAL LAUNCH · SUPPLY REQUIRES FINAL ON-CHAIN RECONCILIATION</div>
          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <Link to="/KAMGlobalRoadmap" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-sky-600 px-4 text-center text-sm font-black text-white hover:bg-sky-500 sm:w-auto">View KAM Strategic Roadmap</Link>
            <Link to="/KAMNetworkDocs" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-950/50 px-4 text-center text-sm font-bold text-slate-200 hover:border-sky-400/40 sm:w-auto">Network Documentation</Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[['Maximum supply','1,000,000,000 KAM'],['Target initial circulating','50,000,000 KAM'],['Initial circulating target','5%'],['Decimals','18']].map(([label,value]) => <div key={label} className="min-w-0 rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 break-words text-xl font-black text-white">{value}</p></div>)}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
          <div className="border-b border-slate-800 px-5 py-4"><div className="flex items-center gap-2"><PieChart className="h-5 w-5 text-sky-300"/><h2 className="font-bold">Allocation v1</h2></div></div>
          {allocations.map(([name,pct,amount]) => <div key={name} className="grid gap-1 border-b border-slate-800 px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_80px_180px]"><span className="text-sm font-semibold text-slate-200">{name}</span><span className="text-sm font-black text-sky-300">{pct}</span><span className="text-sm text-slate-400 sm:text-right">{amount}</span></div>)}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Card icon={LockKeyhole} title="Vesting & release principles">
            <p><strong>Team & Contributors:</strong> 12-month cliff followed by 36-month linear vesting.</p>
            <p><strong>Strategic Partnerships:</strong> milestone- or time-based vesting with transparent release schedules.</p>
            <p>Treasury, ecosystem, community and validator reserves are not automatically circulating merely because they exist in an allocation wallet.</p>
          </Card>
          <Card icon={ShieldCheck} title="Circulating-supply methodology">
            <p>Only unlocked, transferable KAM that is genuinely available to the public market should be classified as circulating.</p>
            <p>Before tracked market-data listing, circulating supply should be reconciled against identifiable on-chain balances and documented lock or vesting conditions.</p>
          </Card>
          <Card icon={TrendingUp} title="US$29 reference scenario">
            <p><strong>US$29/KAM is an indicative valuation scenario only.</strong> It is not current market price, not a guaranteed listing price, and not an investment promise.</p>
            <p>At the 50,000,000 KAM circulating target, US$29 would mathematically imply a hypothetical circulating market capitalization of <strong>US$1.45B</strong>. At the 1,000,000,000 maximum-supply baseline, the hypothetical FDV would be <strong>US$29B</strong>.</p>
          </Card>
          <Card icon={Network} title="Network identity">
            <p>KAM is the native asset of the KriptoAman network. Chain ID: <strong>22028 / 0x560c</strong>. Decimals: <strong>18</strong>.</p>
            <Link to="/KAMNetworkDocs" className="inline-flex items-center gap-1 font-semibold text-sky-300">Network Documentation <ExternalLink className="h-3 w-3" /></Link>
          </Card>
        </div>

        <section className="rounded-2xl border border-sky-400/20 bg-sky-500/5 p-5 text-sm leading-6 text-slate-200">
          <strong>KAM Roadmap:</strong> the strategic roadmap tracks infrastructure, utility, wallet/registry access, transparent liquidity, adoption, global integrations, governance, and eventual market-based price discovery. <Link to="/KAMGlobalRoadmap" className="font-bold text-sky-300">Open the KAM Global Roadmap →</Link>
        </section>

        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
          <strong>Verification notice:</strong> maximum supply, circulating supply and allocation data must match final production genesis/on-chain evidence before being represented to CoinGecko, CoinMarketCap, exchanges, wallets, or other third parties as verified supply data. This page must never be used to fabricate price, volume, liquidity, exchange relationships, or market activity.
        </section>

        <div className="flex flex-wrap gap-3 text-xs"><Link to="/KAMGlobalRoadmap" className="text-sky-300">KAM Roadmap</Link><Link to="/KAMNetworkDocs" className="text-sky-300">Network Docs</Link><Link to="/KAMNetwork" className="text-sky-300">Network Status</Link><a href="https://github.com/rahmanraden027-hue/kriptoaman/blob/main/docs/KAM_TOKENOMICS_V1.md" target="_blank" rel="noreferrer" className="text-sky-300">Canonical Tokenomics Document</a></div>
      </div>
    </main>
  );
}
