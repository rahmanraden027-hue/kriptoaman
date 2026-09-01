import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Building2, Network, ShieldCheck } from 'lucide-react';

const TITLE = 'KriptoAman Research | Blockchain & Digital Asset Research';
const DESCRIPTION = 'KriptoAman Research by PT Kripto Aman Indonesia publishes evidence-oriented technical research on blockchain infrastructure, digital-asset intelligence, security, reliability, and network readiness.';
const CANONICAL = 'https://kriptoaman.com/research';

function upsertMeta(selector, attrs) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    document.head.appendChild(node);
  }
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
}

export default function Research() {
  useEffect(() => {
    document.title = TITLE;
    upsertMeta('meta[name="description"]', { name: 'description', content: DESCRIPTION });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: TITLE });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: DESCRIPTION });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: CANONICAL });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', CANONICAL);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.kriptoamanResearch = 'center';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${CANONICAL}#research`,
      url: CANONICAL,
      name: 'KriptoAman Research',
      description: DESCRIPTION,
      isPartOf: { '@id': 'https://kriptoaman.com/#website' },
      about: [
        { '@type': 'Thing', name: 'Blockchain Infrastructure' },
        { '@type': 'Thing', name: 'Digital Asset Intelligence' },
        { '@type': 'Thing', name: 'Blockchain Security' }
      ],
      publisher: {
        '@type': 'Organization',
        '@id': 'https://kriptoaman.com/#organization',
        name: 'PT Kripto Aman Indonesia',
        url: 'https://kriptoaman.com/'
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [{
          '@type': 'ListItem',
          position: 1,
          url: 'https://kriptoaman.com/research/kam-mainnet-architecture',
          name: 'KAM Mainnet: Architecture, Security and Public Readiness Framework'
        }]
      }
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  const areas = ['Blockchain Infrastructure', 'Digital Asset Intelligence', 'Security & Reliability', 'Market Data', 'Web3 Systems', 'Risk Analysis'];

  return (
    <main className="min-h-screen bg-[#05080d] text-white pb-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-7 pt-8">
        <nav className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white">KriptoAman</Link>
          <div className="flex flex-wrap justify-end gap-x-5 gap-y-2 text-xs uppercase tracking-[0.15em] text-slate-500">
            <Link to="/founder" className="hover:text-slate-200">Leadership</Link>
            <Link to="/company" className="hover:text-slate-200">Company</Link>
            <Link to="/SystemStatus" className="hover:text-slate-200">System Status</Link>
          </div>
        </nav>

        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 py-14 sm:py-20 border-b border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Research & Documentation</p>
            <h1 className="mt-5 max-w-4xl text-4xl sm:text-6xl font-semibold tracking-[-0.045em] leading-[1.02]">KriptoAman Research</h1>
            <p className="mt-7 max-w-3xl text-lg sm:text-xl leading-8 text-slate-300">Evidence-oriented technical publications on blockchain infrastructure, digital-asset intelligence, security, reliability, and measurable network readiness.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#publications" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200">Explore Research <BookOpen className="w-4 h-4" /></a>
              <Link to="/research/kam-mainnet-architecture" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5">Latest Technical Paper <ArrowUpRight className="w-4 h-4" /></Link>
            </div>
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-10 flex items-end">
            <p className="text-sm leading-7 text-slate-500">Research is presented as a technical publication layer, separate from product marketing. Documentation, endpoint availability, and readiness evidence are described only within the scope supported by verifiable sources.</p>
          </div>
        </section>

        <section id="publications" className="py-12 border-b border-white/10">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Featured Research · 2026</p>
          <article className="mt-6 rounded-3xl border border-sky-400/20 bg-[#080d14] p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sky-300"><Network className="w-5 h-5" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">KAM Network</span></div>
            <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">KAM Mainnet: Architecture, Security and Public Readiness Framework</h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">A technical overview of KAM network identity, public infrastructure, security controls, observability, and the evidence framework used to evaluate readiness. Publication does not itself constitute a public-mainnet launch declaration.</p>
            <Link to="/research/kam-mainnet-architecture" className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5">Read Paper <ArrowUpRight className="w-4 h-4" /></Link>
          </article>
        </section>

        <section className="py-12 border-b border-white/10">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Research Areas</p>
          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => <div key={area} className="bg-[#080d14] p-5 text-sm font-semibold text-slate-200">{area}</div>)}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 py-12">
          <Link to="/company" className="rounded-2xl border border-white/10 p-6 hover:bg-white/[0.03]"><Building2 className="w-5 h-5 text-sky-300"/><h3 className="mt-5 font-semibold">Corporate Context</h3><p className="mt-2 text-sm leading-6 text-slate-500">PT Kripto Aman Indonesia provides the institutional context for the research program.</p></Link>
          <Link to="/founder" className="rounded-2xl border border-white/10 p-6 hover:bg-white/[0.03]"><BookOpen className="w-5 h-5 text-sky-300"/><h3 className="mt-5 font-semibold">Executive Profile</h3><p className="mt-2 text-sm leading-6 text-slate-500">Leadership identity remains separate from technical publication claims and product status.</p></Link>
          <Link to="/SystemStatus" className="rounded-2xl border border-white/10 p-6 hover:bg-white/[0.03]"><ShieldCheck className="w-5 h-5 text-sky-300"/><h3 className="mt-5 font-semibold">Operational Evidence</h3><p className="mt-2 text-sm leading-6 text-slate-500">Public system status provides operational context independent from publication language.</p></Link>
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-white/10 p-5 text-xs leading-6 text-slate-500"><ShieldCheck className="mt-0.5 w-4 h-4 shrink-0 text-slate-400"/><p>KriptoAman Research is a corporate technical-publication program of PT Kripto Aman Indonesia. Publications are not represented as peer-reviewed academic journal articles, regulatory approvals, third-party listings, or launch declarations unless explicitly stated and independently verifiable.</p></div>
      </div>
    </main>
  );
}
