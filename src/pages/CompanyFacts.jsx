import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, Landmark, Mail, MapPin, ShieldCheck, UserRound } from 'lucide-react';

export default function CompanyFacts() {
  useEffect(() => {
    const title = 'PT Kripto Aman Indonesia — Corporate Profile | KriptoAman';
    const description = 'Profil korporasi PT Kripto Aman Indonesia: identitas perusahaan, kepemimpinan, ruang lingkup teknologi, governance, corporate office, dan kanal resmi.';
    const canonicalUrl = 'https://kriptoaman.com/company';
    const previousTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    const previous = meta?.getAttribute('content') ?? null;
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    const canonicalCreated = !canonical;
    const previousCanonical = canonical?.getAttribute('href') ?? null;
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', canonicalUrl);

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.id = 'company-facts-schema';
    schema.text = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Organization', '@id': 'https://kriptoaman.com/#organization',
      name: 'PT KRIPTO AMAN INDONESIA', legalName: 'PT KRIPTO AMAN INDONESIA', alternateName: 'KriptoAman', url: 'https://kriptoaman.com/',
      logo: 'https://kriptoaman.com/icons/kriptoaman-512.png', email: 'hello@kriptoaman.com',
      founder: { '@id': 'https://kriptoaman.com/founder#raden-abdul-rahman' },
      sameAs: ['https://x.com/KriptoAman','https://www.tiktok.com/@kriptoamanofficial','https://youtube.com/@kriptoamanofficial'],
      address: { '@type':'PostalAddress', streetAddress:'Soho Capital – Podomoro City, 25th Floor, Unit 2508, Jl. Letjen S. Parman Kav. 28', addressLocality:'Jakarta Barat', addressRegion:'DKI Jakarta', postalCode:'11470', addressCountry:'ID' }
    });
    document.head.appendChild(schema);
    return () => { document.title = previousTitle; schema.remove(); if (created) meta.remove(); else if (previous !== null) meta.setAttribute('content', previous); if (canonicalCreated) canonical.remove(); else if (previousCanonical !== null) canonical.setAttribute('href', previousCanonical); };
  }, []);

  const facts = [
    ['Legal entity', 'PT KRIPTO AMAN INDONESIA'],
    ['Technology brand', 'KriptoAman'],
    ['Jurisdiction', 'Republik Indonesia'],
    ['Leadership', 'Raden Abdul Rahman, M.Sc. — Founder & CEO KriptoAman'],
    ['Primary scope', 'Digital asset intelligence, monitoring, education, public-source verification, and indicative risk analysis'],
    ['Official contact', 'hello@kriptoaman.com']
  ];

  return (
    <main className="min-h-screen bg-[#f5f4f0] text-[#111827] pb-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-7 pt-8">
        <nav className="flex items-center justify-between border-b border-black/10 pb-6">
          <Link to="/" className="text-sm font-semibold">KriptoAman</Link>
          <div className="flex gap-5 text-xs uppercase tracking-[0.15em] text-slate-500"><Link to="/founder" className="hover:text-slate-900">Leadership</Link><Link to="/LegalCorporateInformation" className="hover:text-slate-900">Legal</Link></div>
        </nav>

        <header className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 py-14 sm:py-20 border-b border-black/10">
          <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Corporate Profile</p><h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-[-0.045em] leading-[1.02]">PT Kripto Aman Indonesia</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">Perusahaan teknologi di balik KriptoAman, dengan fokus pada pengembangan produk digital, informasi aset digital, serta inisiatif blockchain yang dibangun melalui proses yang terukur.</p></div>
          <div className="lg:border-l lg:border-black/10 lg:pl-10 flex items-end"><p className="text-sm leading-7 text-slate-500">Identitas korporasi disajikan terpisah dari produk dan profil eksekutif agar pengguna, mitra, media, dan pemangku kepentingan dapat memahami peran masing-masing secara jelas.</p></div>
        </header>

        <section className="grid lg:grid-cols-[0.7fr_1.3fr] gap-8 py-12 border-b border-black/10">
          <div><Landmark className="w-6 h-6"/><h2 className="mt-4 text-2xl font-semibold">Institutional identity</h2><p className="mt-3 text-sm leading-6 text-slate-500">Ringkasan fakta publik. Dokumen resmi tetap menjadi sumber utama untuk fakta hukum yang memerlukan verifikasi formal.</p></div>
          <dl className="border-t border-black/10">{facts.map(([label,value]) => <div key={label} className="grid sm:grid-cols-[170px_1fr] gap-2 py-4 border-b border-black/10"><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt><dd className="text-sm leading-6 text-slate-800">{value}</dd></div>)}</dl>
        </section>

        <section className="py-12 border-b border-black/10"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Corporate Architecture</p><div className="mt-6 grid md:grid-cols-3 gap-4">
          <Link to="/founder" className="rounded-2xl border border-black/10 bg-white/50 p-6 hover:bg-white"><UserRound className="w-5 h-5"/><h3 className="mt-5 font-semibold">Executive Leadership</h3><p className="mt-2 text-sm leading-6 text-slate-500">Raden Abdul Rahman sebagai Founder & CEO, dengan profil profesional yang terpisah dari komunikasi produk.</p></Link>
          <Link to="/" className="rounded-2xl border border-black/10 bg-white/50 p-6 hover:bg-white"><Building2 className="w-5 h-5"/><h3 className="mt-5 font-semibold">KriptoAman</h3><p className="mt-2 text-sm leading-6 text-slate-500">Lapisan produk: market intelligence, monitoring, edukasi, risk intelligence, dan pengalaman pengguna.</p></Link>
          <Link to="/KAM" className="rounded-2xl border border-black/10 bg-white/50 p-6 hover:bg-white"><ShieldCheck className="w-5 h-5"/><h3 className="mt-5 font-semibold">Technology & Research</h3><p className="mt-2 text-sm leading-6 text-slate-500">KAM Network, explorer, developer documentation, dan research ditampilkan sesuai status dan evidence yang dapat diverifikasi.</p></Link>
        </div></section>

        <section className="grid md:grid-cols-2 gap-4 py-12">
          <article className="rounded-2xl border border-black/10 bg-white/50 p-6"><MapPin className="w-5 h-5"/><h2 className="mt-5 font-semibold">Corporate Office</h2><address className="mt-3 not-italic text-sm leading-7 text-slate-500">Soho Capital – Podomoro City, 25th Floor, Unit 2508<br/>Jl. Letjen S. Parman Kav. 28<br/>Tanjung Duren Selatan, Grogol Petamburan<br/>Jakarta Barat, DKI Jakarta 11470 · Indonesia</address></article>
          <article className="rounded-2xl border border-black/10 bg-white/50 p-6"><Mail className="w-5 h-5"/><h2 className="mt-5 font-semibold">Official & Verification Channels</h2><p className="mt-3 text-sm leading-7 text-slate-500">Gunakan kanal resmi untuk informasi perusahaan, legal, dan verifikasi publik. Status regulasi, jaringan, listing, atau layanan pihak ketiga hanya dinyatakan setelah dapat diverifikasi.</p><div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold"><Link to="/LegalCorporateInformation" className="inline-flex items-center gap-1 hover:underline">Legal & Corporate <ArrowUpRight className="w-4 h-4"/></Link><a href="mailto:hello@kriptoaman.com" className="hover:underline">hello@kriptoaman.com</a></div></article>
        </section>

        <p className="text-xs leading-6 text-slate-500">Corporate profile · diperbarui 1 September 2026. KriptoAman berfokus pada informasi, monitoring, edukasi, verifikasi berbasis sumber publik, dan analisis risiko indikatif; halaman ini tidak menyatakan jaminan harga, keuntungan, likuiditas, listing, atau persetujuan regulator.</p>
      </div>
    </main>
  );
}
