import { useEffect } from 'react';
import { Link } from 'react-router-dom';

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

  return <main className="min-h-screen bg-slate-950 text-white">
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-sm font-bold uppercase tracking-[.22em] text-sky-400">PT Kripto Aman Indonesia</p>
      <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">KriptoAman Research</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Technical research and evidence-oriented publications on blockchain infrastructure, digital-asset intelligence, security, reliability, and transparent network readiness.</p>
      <div className="mt-10 flex flex-wrap gap-3"><a href="#publications" className="rounded-xl bg-sky-600 px-5 py-3 font-bold">Explore Research</a><Link to="/research/kam-mainnet-architecture" className="rounded-xl border border-slate-700 px-5 py-3 font-bold">Latest Technical Paper</Link></div>
    </section>
    <section id="publications" className="mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-3xl border border-sky-500/20 bg-slate-900 p-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-400">Featured Research · 2026</p>
        <h2 className="mt-3 text-3xl font-black">KAM Mainnet: Architecture, Security and Public Readiness Framework</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">A technical overview of KAM network identity, public infrastructure, security controls, observability and the evidence framework used to evaluate readiness. Publication does not itself constitute a public-mainnet launch declaration.</p>
        <Link to="/research/kam-mainnet-architecture" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-slate-950">Read Paper</Link>
      </div>
      <h2 className="mt-16 text-2xl font-black">Research Areas</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">{['Blockchain Infrastructure','Digital Asset Intelligence','Security & Reliability','Market Data','Web3 Systems','Risk Analysis'].map(x=><div key={x} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 font-semibold">{x}</div>)}</div>
      <div className="mt-16 border-t border-slate-800 pt-8 text-sm leading-6 text-slate-400">KriptoAman Research is a corporate technical-publication program of PT Kripto Aman Indonesia. Publications are not represented as peer-reviewed academic journal articles unless explicitly stated and independently verifiable.</div>
    </section>
  </main>;
}
