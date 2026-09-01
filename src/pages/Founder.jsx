import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Building2, Layers3, ShieldCheck } from 'lucide-react';

const PROFILE_IMAGE = '/images/raden-abdul-rahman-founder.jpg';

export default function Founder() {
  useEffect(() => {
    const title = 'Raden Abdul Rahman — Founder & CEO KriptoAman';
    const description = 'Profil resmi Raden Abdul Rahman, Founder & CEO KriptoAman dan CEO PT Kripto Aman Indonesia, dengan fokus pada strategi produk digital, pengalaman pengguna, pengembangan bisnis, blockchain, dan aset digital.';
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
      '@type': 'Person',
      '@id': `${canonicalUrl}#raden-abdul-rahman`,
      name: 'Raden Abdul Rahman',
      honorificSuffix: 'M.Sc.',
      url: canonicalUrl,
      image: 'https://kriptoaman.com/images/raden-abdul-rahman-founder.jpg',
      jobTitle: 'Founder & CEO KriptoAman; CEO PT Kripto Aman Indonesia',
      sameAs: ['https://radenabdulrahman.com/'],
      worksFor: { '@id': 'https://kriptoaman.com/#organization' },
      knowsAbout: ['Digital Product Strategy', 'User Experience', 'Business Development', 'Blockchain', 'Digital Assets']
    });
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      schema.remove();
      if (descriptionCreated) descriptionMeta.remove();
      else if (previousDescription !== null) descriptionMeta.setAttribute('content', previousDescription);
      if (canonicalCreated) canonical.remove();
      else if (previousCanonical !== null) canonical.setAttribute('href', previousCanonical);
    };
  }, []);

  const focus = [
    ['Digital Product Strategy', 'Arah produk, prioritas, dan pengembangan yang berangkat dari tujuan yang jelas.'],
    ['User Experience', 'Pengalaman digital yang ringkas, dapat dipahami, dan konsisten lintas perangkat.'],
    ['Business Development', 'Pengembangan organisasi dan peluang kolaborasi yang relevan dengan produk.'],
    ['Blockchain & Digital Assets', 'Inisiatif teknologi dan riset yang dibangun melalui proses terukur dan bukti yang dapat diperiksa.']
  ];

  return (
    <main className="min-h-screen bg-[#05080d] text-white pb-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-7 pt-8">
        <nav className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white">KriptoAman</Link>
          <div className="flex gap-5 text-xs uppercase tracking-[0.16em] text-slate-500">
            <Link to="/company" className="hover:text-slate-200">Company</Link>
            <Link to="/research" className="hover:text-slate-200">Research</Link>
          </div>
        </nav>

        <section className="grid lg:grid-cols-[0.86fr_1.14fr] gap-10 lg:gap-16 items-center py-14 sm:py-20">
          <div className="relative max-w-md">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-sky-400/5 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 aspect-[4/5]">
              <img src={PROFILE_IMAGE} alt="Raden Abdul Rahman, Founder & CEO KriptoAman" className="h-full w-full object-cover object-center" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Executive Profile</p>
            <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-[-0.04em] leading-[1.02]">Raden Abdul Rahman<span className="block mt-2 text-xl sm:text-2xl font-normal text-slate-400 tracking-normal">Founder & CEO · KriptoAman</span></h1>
            <p className="mt-7 max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-300">Membangun produk digital, infrastruktur blockchain, dan pengalaman teknologi dengan pendekatan yang terukur, faktual, dan berorientasi pada pengguna.</p>
            <p className="mt-5 max-w-2xl text-sm sm:text-base leading-7 text-slate-500">Raden Abdul Rahman adalah Founder & CEO KriptoAman serta memimpin PT Kripto Aman Indonesia. Fokus profesionalnya mencakup strategi produk digital, pengalaman pengguna, pengembangan bisnis, serta inisiatif blockchain dan aset digital. Pendekatannya menempatkan tujuan yang jelas, komunikasi faktual, dan proses pengembangan terukur sebagai dasar setiap pekerjaan.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="https://radenabdulrahman.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200">Official profile <ArrowUpRight className="w-4 h-4" /></a>
              <Link to="/company" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"><Building2 className="w-4 h-4" /> PT Kripto Aman Indonesia</Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-12">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-8">
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Professional Focus</p><h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">Leadership through clarity and execution.</h2></div>
            <div className="grid sm:grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
              {focus.map(([title, body]) => <article key={title} className="bg-[#080d14] p-6"><h3 className="font-semibold text-slate-100">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{body}</p></article>)}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 border-t border-white/10 pt-12">
          <Link to="/company" className="group rounded-2xl border border-white/10 p-6 hover:bg-white/[0.03]"><Building2 className="w-5 h-5 text-sky-300"/><h2 className="mt-5 font-semibold">Corporate Leadership</h2><p className="mt-2 text-sm leading-6 text-slate-500">Identitas institusi, ruang lingkup, governance, dan kanal resmi PT Kripto Aman Indonesia.</p></Link>
          <Link to="/KAM" className="group rounded-2xl border border-white/10 p-6 hover:bg-white/[0.03]"><Layers3 className="w-5 h-5 text-sky-300"/><h2 className="mt-5 font-semibold">Selected Work</h2><p className="mt-2 text-sm leading-6 text-slate-500">KriptoAman, KAM Network, explorer, dan pengembangan teknologi yang dapat diperiksa melalui sumber resmi.</p></Link>
          <Link to="/research" className="group rounded-2xl border border-white/10 p-6 hover:bg-white/[0.03]"><BookOpen className="w-5 h-5 text-sky-300"/><h2 className="mt-5 font-semibold">Research & Publications</h2><p className="mt-2 text-sm leading-6 text-slate-500">Dokumentasi teknis dan publikasi berbasis evidence tanpa memperluas klaim di luar status yang dapat diverifikasi.</p></Link>
        </section>

        <div className="mt-12 flex items-start gap-3 rounded-2xl border border-white/10 p-5 text-xs leading-6 text-slate-500"><ShieldCheck className="mt-0.5 w-4 h-4 shrink-0 text-slate-400"/><p>Profil ini memisahkan identitas eksekutif, korporasi, dan produk. Status jaringan, regulasi, listing, dan publikasi hanya ditampilkan sesuai bukti yang tersedia pada kanal resmi.</p></div>
      </div>
    </main>
  );
}
