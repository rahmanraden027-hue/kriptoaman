import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, BookOpen, Globe2, LockKeyhole, BadgeCheck, Building2 } from 'lucide-react';

const PROFILE_IMAGE = '/images/raden-abdul-rahman-founder.jpg';

export default function Founder() {
  useEffect(() => {
    const title = 'Raden Abdul Rahman — Founder & CEO KriptoAman';
    const description = 'Profil resmi Raden Abdul Rahman, Founder & CEO KriptoAman dan CEO PT Kripto Aman Indonesia.';
    const canonicalUrl = 'https://kriptoaman.com/founder';

    const previousTitle = document.title;
    document.title = title;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    const descriptionCreated = !descriptionMeta;
    const previousDescription = descriptionMeta?.getAttribute('content') ?? null;
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute('content', description);

    let robotsMeta = document.querySelector('meta[name="robots"]');
    const robotsCreated = !robotsMeta;
    const previousRobots = robotsMeta?.getAttribute('content') ?? null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'index, follow, max-image-preview:large');

    let canonical = document.querySelector('link[rel="canonical"]');
    const canonicalCreated = !canonical;
    const previousCanonical = canonical?.getAttribute('href') ?? null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.id = 'kriptoaman-founder-schema';
    schema.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': 'https://kriptoaman.com/founder#raden-abdul-rahman',
          name: 'Raden Abdul Rahman',
          honorificSuffix: 'M.Sc.',
          url: canonicalUrl,
          image: 'https://kriptoaman.com/images/raden-abdul-rahman-founder.jpg',
          jobTitle: 'Founder & CEO KriptoAman; CEO PT Kripto Aman Indonesia',
          sameAs: ['https://radenabdulrahman.com/'],
          worksFor: { '@id': 'https://kriptoaman.com/#organization' },
          knowsAbout: ['Blockchain', 'Digital Currency', 'Digital Assets', 'Web3']
        },
        {
          '@type': 'Organization',
          '@id': 'https://kriptoaman.com/#organization',
          name: 'PT KRIPTO AMAN INDONESIA',
          alternateName: 'KriptoAman',
          url: 'https://kriptoaman.com/',
          founder: { '@id': 'https://kriptoaman.com/founder#raden-abdul-rahman' }
        }
      ]
    });
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      schema.remove();
      if (descriptionCreated) descriptionMeta.remove();
      else if (previousDescription !== null) descriptionMeta.setAttribute('content', previousDescription);
      if (robotsCreated) robotsMeta.remove();
      else if (previousRobots !== null) robotsMeta.setAttribute('content', previousRobots);
      if (canonicalCreated) canonical.remove();
      else if (previousCanonical !== null) canonical.setAttribute('href', previousCanonical);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#060d1a] text-white pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <Link to="/" className="text-sm text-sky-300 hover:underline">← Kembali ke KriptoAman</Link>
        <p className="mt-8 text-sky-300 text-xs font-bold uppercase tracking-[0.2em]">Founder & CEO</p>
        <section className="mt-3 grid lg:grid-cols-[360px_1fr] gap-6 items-stretch">
          <div className="rounded-3xl overflow-hidden border border-sky-500/20 bg-slate-900/70 min-h-[420px]">
            <img src={PROFILE_IMAGE} alt="Raden Abdul Rahman, M.Sc. — Founder & CEO KriptoAman" className="w-full h-full object-cover object-center" />
          </div>
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Raden Abdul Rahman, M.Sc.</h1>
            <p className="text-sky-300 font-semibold mt-2">Founder & CEO · KriptoAman · CEO PT Kripto Aman Indonesia</p>
            <p className="text-slate-300 leading-relaxed mt-5 max-w-3xl">Memimpin pengembangan KriptoAman dengan fokus pada keamanan informasi, transparansi data, edukasi aset digital, dan pengalaman pengguna yang profesional.</p>
            <p className="text-slate-400 leading-relaxed mt-3 max-w-3xl">KriptoAman dikembangkan sebagai platform informasi dan analitik aset digital yang membantu pengguna memahami pasar dengan pendekatan yang bertanggung jawab dan berorientasi pada keamanan.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-7">
              {[['Keamanan Informasi', Shield], ['Transparansi & Integritas', BadgeCheck], ['Edukasi & Literasi', BookOpen], ['Teknologi Digital', Globe2]].map(([label, Icon]) => (
                <div key={label} className="rounded-2xl border border-slate-700/50 bg-slate-950/40 p-4 flex items-center gap-3"><Icon className="w-5 h-5 text-sky-300"/><span className="text-sm font-semibold">{label}</span></div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="https://radenabdulrahman.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-5 py-3 text-sm font-bold text-sky-300 hover:bg-sky-500/15">Profil Resmi <ExternalLink className="w-4 h-4"/></a>
              <Link to="/LegalCorporateInformation" className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/50 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800"><Building2 className="w-4 h-4"/>Informasi Korporasi</Link>
            </div>
          </div>
        </section>
        <section className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-6"><h2 className="font-bold text-lg">Visi Kepemimpinan</h2><p className="text-slate-400 text-sm leading-relaxed mt-3">Mendorong ekosistem informasi aset digital yang aman, transparan, edukatif, dan dapat dipahami oleh beragam pengguna.</p></div>
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-6"><h2 className="font-bold text-lg flex items-center gap-2"><LockKeyhole className="w-5 h-5 text-sky-300"/>Komitmen Platform</h2><p className="text-slate-400 text-sm leading-relaxed mt-3">Rilis publik memprioritaskan pemantauan dan informasi. KriptoAman tidak meminta seed phrase atau private key pengguna.</p></div>
        </section>
      </div>
    </main>
  );
}
