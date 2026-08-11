import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, Globe2, Lock, Network, Radar, ShieldCheck } from 'lucide-react';
import GlobalLandingStyles from '@/components/landing/GlobalLandingStyles';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const features = [
  [Radar, 'Live market monitoring', 'Track prices and market movements from connected public data providers.'],
  [ShieldCheck, 'Transaction verification', 'Review blockchain transaction status through supported explorers.'],
  [BarChart3, 'Indicative risk insights', 'See transparent indicators designed to support independent research.'],
  [Lock, 'Read-only by design', 'Public monitoring features do not require custody of private keys or seed phrases.'],
];

const networks = ['Bitcoin', 'Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum', 'Base', 'Solana', 'TRON'];

export default function EnglishLanding() {
  return (
    <div className="ka-landing min-h-screen overflow-x-hidden">
      <GlobalLandingStyles />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06101c]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <Link to="/en" className="flex items-center gap-2" aria-label="KriptoAman English home">
            <KriptoAmanLogo size={30} showText={false} animate={false} />
            <span className="text-sm font-extrabold tracking-[0.16em]"><span className="ka-text">KRIPTO</span><span className="ka-blue">AMAN</span></span>
          </Link>
          <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-300 md:flex" aria-label="Primary navigation">
            <a href="#features">Features</a>
            <a href="#coverage">Coverage</a>
            <a href="#company">Company</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/" className="ka-card2 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ka-text2" hrefLang="id">
              <Globe2 className="h-3.5 w-3.5" /> ID
            </Link>
            <Link to="/login" className="ka-btn-primary inline-flex h-9 items-center justify-center px-4 text-sm">Sign in</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-16 pt-32 sm:px-6">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="ka-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide">
                <ShieldCheck className="h-3.5 w-3.5" /> DIGITAL ASSET MONITORING &amp; RISK INFORMATION
              </span>
              <h1 className="ka-sec-title mt-5 text-4xl leading-tight sm:text-5xl">Understand crypto markets with <span className="ka-blue">clearer signals</span></h1>
              <p className="ka-text2 mt-5 max-w-xl text-base leading-relaxed">
                KriptoAman is an Indonesian information platform for market monitoring, blockchain transaction verification, education, and indicative risk analysis.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/Market" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6">Explore markets <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/SystemStatus" className="ka-btn-outline inline-flex items-center justify-center px-6">System status</Link>
              </div>
              <p className="ka-text2 mt-5 text-xs">Informational service only. KriptoAman is not an exchange, custodian, broker, or investment adviser.</p>
            </div>
            <div className="ka-card ka-glow p-6 sm:p-8">
              <KriptoAmanLogo size={128} showText={false} animate />
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[['2,000+', 'market assets'], ['8', 'supported networks'], ['IDR / USD', 'display currencies'], ['24/7', 'public monitoring']].map(([value,label]) => (
                  <div key={label} className="ka-card2 p-4"><p className="ka-blue text-xl font-extrabold">{value}</p><p className="ka-text2 mt-1 text-xs">{label}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-[1200px]">
            <p className="ka-cyan text-xs font-bold uppercase tracking-widest">Capabilities</p>
            <h2 className="ka-sec-title mt-2 text-3xl">Built for transparent monitoring</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(([Icon,title,desc]) => <article key={title} className="ka-card p-5"><Icon className="ka-blue h-5 w-5" /><h3 className="ka-text mt-4 font-bold">{title}</h3><p className="ka-text2 mt-2 text-xs leading-relaxed">{desc}</p></article>)}
            </div>
          </div>
        </section>

        <section id="coverage" className="px-4 py-14 sm:px-6">
          <div className="ka-card mx-auto max-w-[1200px] p-6 sm:p-8">
            <div className="flex items-center gap-3"><Network className="ka-blue h-6 w-6" /><h2 className="ka-sec-title text-2xl">Network coverage</h2></div>
            <div className="mt-6 flex flex-wrap gap-2">{networks.map(name => <span key={name} className="ka-card2 rounded-xl px-4 py-2 text-xs font-semibold ka-text2">{name}</span>)}</div>
            <p className="ka-text2 mt-4 text-xs">Availability depends on active public explorers and data-provider connectivity.</p>
          </div>
        </section>

        <section id="company" className="px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] gap-5 lg:grid-cols-2">
            <div className="ka-card p-6">
              <p className="ka-cyan text-xs font-bold uppercase tracking-widest">Operator transparency</p>
              <h2 className="ka-sec-title mt-2 text-2xl">PT Kripto Aman Indonesia</h2>
              <div className="ka-text2 mt-5 space-y-3 text-sm">
                <p><strong className="ka-text">Jurisdiction:</strong> Republic of Indonesia</p>
                <p><strong className="ka-text">Service:</strong> crypto information, monitoring, education, and indicative risk analysis</p>
                <p><strong className="ka-text">Contact:</strong> support@kriptoaman.com</p>
              </div>
            </div>
            <div className="ka-card p-6">
              <p className="ka-cyan text-xs font-bold uppercase tracking-widest">User protection</p>
              <ul className="ka-text2 mt-4 space-y-3 text-sm">
                {['Never share a seed phrase or private key.', 'Verify blockchain data independently.', 'Crypto assets are volatile and high risk.', 'No monitoring result guarantees asset safety or profit.'].map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="ka-green mt-0.5 h-4 w-4 shrink-0" />{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-[860px]">
            <h2 className="ka-sec-title text-center text-3xl">Frequently asked questions</h2>
            <div className="mt-8 space-y-3">
              {[
                ['Does KriptoAman hold customer assets?', 'No. Public monitoring features are informational and non-custodial. Never provide a private key or seed phrase.'],
                ['Does KriptoAman guarantee transaction safety?', 'No. Verification checks blockchain status and connected public data. Users must make an independent assessment.'],
                ['Is market data real time?', 'Updates depend on provider availability and may be delayed. The source and update time are shown when available.'],
              ].map(([q,a]) => <details key={q} className="ka-card p-4"><summary className="ka-text cursor-pointer font-semibold">{q}</summary><p className="ka-text2 mt-3 text-sm leading-relaxed">{a}</p></details>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-5 sm:flex-row">
          <div><p className="ka-text font-bold">KriptoAman</p><p className="ka-text2 mt-1 text-xs">PT Kripto Aman Indonesia · Indonesia</p></div>
          <div className="flex flex-wrap gap-4 text-xs ka-text2">
            <Link to="/PrivacyPolicy">Privacy</Link><Link to="/TermsOfService">Terms</Link><Link to="/Disclaimer">Risk disclaimer</Link><Link to="/SystemStatus">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
