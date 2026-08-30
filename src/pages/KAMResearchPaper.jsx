import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const TITLE = 'KAM Mainnet Architecture, Security & Public Readiness | KriptoAman Research';
const DESCRIPTION = 'Technical paper from KriptoAman Research documenting KAM Mainnet architecture, network identity, security controls, RPC and explorer integrity, reliability, and evidence-oriented public-readiness methodology.';
const CANONICAL = 'https://kriptoaman.com/research/kam-mainnet-architecture';

function upsertMeta(selector, attrs) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    document.head.appendChild(node);
  }
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
}

const sections = [
['Abstract','This paper documents an evidence-oriented framework for describing and evaluating KAM Mainnet infrastructure. It separates observable technical facts from readiness conclusions and avoids treating publication, metadata submissions, or isolated successful probes as proof of final public-mainnet readiness.'],
['1. Network Identity','KAM uses an EVM-compatible network identity with Chain ID 22028 (0x560c). Network identity must remain consistent across RPC responses, explorer configuration, documentation and ecosystem metadata. A final collision review remains part of readiness governance.'],
['2. Architecture','The target architecture separates validator responsibilities, public RPC access, explorer services and operational monitoring. Production-readiness assessment should verify persistent infrastructure and distinct failure domains rather than infer resilience from configuration alone.'],
['3. Security Model','Public endpoints should expose only the namespaces required for normal network interaction. Administrative, debugging, personal and consensus-management interfaces should remain unavailable from public RPC surfaces. Security evidence must be repeatable and time-stamped.'],
['4. RPC and Explorer Integrity','RPC and explorer observations should agree within defined operational tolerances. Block progression, chain identity, endpoint health and explorer alignment are evaluated together; a responsive endpoint alone is insufficient evidence of network health.'],
['5. Monitoring and Reliability','Readiness evidence is evaluated over consecutive UTC hourly buckets. Each required hour must contain valid ready=true evidence. Missing evidence or a material regression breaks the consecutive streak rather than being silently interpolated.'],
['6. Validator and Recovery Evidence','Validator topology and backup/restore procedures are independent readiness dimensions. Evidence should demonstrate persistent production deployment, appropriate failure-domain separation and a tested recovery path before final promotion.'],
['7. Public Readiness Methodology','A valid hourly observation requires the expected Chain ID, advancing blocks, healthy and aligned RPC/explorer behavior, blocked sensitive namespaces, valid evidence artifacts and no material security or reliability regression. Twenty-four consecutive valid hourly buckets are an evidence threshold, not by themselves a launch declaration.'],
['8. Current Status and Limitations','This publication intentionally does not declare KAM Mainnet finally public or universally listed. Readiness and ecosystem-listing status can change and should be verified against current operational evidence and official registries. Manual wallet configuration must not be described as an official third-party listing.'],
['9. Governance Principle','KriptoAman applies a transparency-first approach: claims should follow evidence. Technical milestones, market availability, wallet support and registry inclusion are separate states and should be communicated separately.'],
['Conclusion','The framework is designed to make KAM readiness claims reproducible, conservative and auditable. Future revisions should cite dated evidence and clearly distinguish architecture targets, observed state, external registry status and final governance decisions.']
];

export default function KAMResearchPaper(){
 useEffect(()=>{
  document.title = TITLE;
  upsertMeta('meta[name="description"]', { name: 'description', content: DESCRIPTION });
  upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: TITLE });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: DESCRIPTION });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'article' });
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
  script.dataset.kriptoamanResearch = 'kam-mainnet-architecture';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${CANONICAL}#article`,
    url: CANONICAL,
    headline: 'KAM Mainnet: Architecture, Security and Public Readiness Framework',
    description: DESCRIPTION,
    datePublished: '2026-08-30',
    dateModified: '2026-08-30',
    version: '1.0',
    isPartOf: { '@id': 'https://kriptoaman.com/research#research' },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://kriptoaman.com/#organization',
      name: 'PT Kripto Aman Indonesia',
      url: 'https://kriptoaman.com/'
    },
    about: [
      { '@type': 'Thing', name: 'KAM Mainnet' },
      { '@type': 'Thing', name: 'Blockchain Infrastructure' },
      { '@type': 'Thing', name: 'Blockchain Security' }
    ],
    keywords: ['KAM Mainnet','blockchain architecture','public readiness','RPC security','network reliability']
  });
  document.head.appendChild(script);
  return () => script.remove();
 },[]);
 return <main className="min-h-screen bg-slate-950 text-white"><article className="mx-auto max-w-4xl px-6 py-16">
  <Link to="/research" className="text-sm font-bold text-sky-400">← KriptoAman Research</Link>
  <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-sky-400">Technical Paper · Version 1.0 · 2026</p>
  <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">KAM Mainnet: Architecture, Security and Public Readiness Framework</h1>
  <p className="mt-5 text-slate-400">Publisher: PT Kripto Aman Indonesia · KriptoAman Research</p>
  <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm leading-6 text-amber-100">Status note: this technical publication is documentation, not a declaration that every final public-mainnet, exchange, wallet, registry, validator or ecosystem-listing requirement has been completed.</div>
  <div className="mt-12 space-y-12">{sections.map(([h,p])=><section key={h}><h2 className="text-2xl font-black">{h}</h2><p className="mt-4 leading-8 text-slate-300">{p}</p></section>)}</div>
  <section className="mt-14 border-t border-slate-800 pt-8"><h2 className="text-xl font-black">Reference endpoints</h2><p className="mt-4 leading-7 text-slate-400">Official project website: kriptoaman.com · Public RPC: rpc.kriptoaman.com · Explorer: explorer.kriptoaman.com. Endpoint availability and network status should be independently re-verified when cited.</p></section>
 </article></main>;
}