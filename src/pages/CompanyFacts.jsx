import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, UserRound, MapPin, ShieldCheck, ExternalLink, Mail } from 'lucide-react';

export default function CompanyFacts() {
  useEffect(() => {
    const title = 'PT Kripto Aman Indonesia — Company Facts | KriptoAman';
    const description = 'Fakta resmi PT Kripto Aman Indonesia: identitas perusahaan, brand KriptoAman, kepemimpinan, corporate office, ruang lingkup platform, dan kanal verifikasi resmi.';
    const canonicalUrl = 'https://kriptoaman.com/company';

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
    schema.id = 'company-facts-schema';
    schema.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://kriptoaman.com/company#webpage',
          url: canonicalUrl,
          name: 'PT Kripto Aman Indonesia — Company Facts',
          description,
          isPartOf: { '@id': 'https://kriptoaman.com/#website' },
          about: { '@id': 'https://kriptoaman.com/#organization' },
          mainEntity: { '@id': 'https://kriptoaman.com/#organization' },
          inLanguage: 'id-ID'
        },
        {
          '@type': 'Organization',
          '@id': 'https://kriptoaman.com/#organization',
          name: 'PT KRIPTO AMAN INDONESIA',
          legalName: 'PT KRIPTO AMAN INDONESIA',
          alternateName: 'KriptoAman',
          url: 'https://kriptoaman.com/',
          logo: {
            '@type': 'ImageObject',
            url: 'https://kriptoaman.com/icons/kriptoaman-512.png',
            contentUrl: 'https://kriptoaman.com/icons/kriptoaman-512.png',
            width: 512,
            height: 512,
            caption: 'PT KRIPTO AMAN INDONESIA logo'
          },
          image: 'https://kriptoaman.com/icons/kriptoaman-512.png',
          email: 'hello@kriptoaman.com',
          founder: { '@id': 'https://kriptoaman.com/founder#raden-abdul-rahman' },
          sameAs: [
            'https://x.com/KriptoAman',
            'https://www.tiktok.com/@kriptoamanofficial',
            'https://youtube.com/@kriptoamanofficial'
          ],
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Soho Capital – Podomoro City, 25th Floor, Unit 2508, Jl. Letjen S. Parman Kav. 28',
            addressLocality: 'Jakarta Barat',
            addressRegion: 'DKI Jakarta',
            postalCode: '11470',
            addressCountry: 'ID'
          }
        },
        {
          '@type': 'Person',
          '@id': 'https://kriptoaman.com/founder#raden-abdul-rahman',
          name: 'Raden Abdul Rahman',
          honorificSuffix: 'M.Sc.',
          jobTitle: 'Founder & CEO KriptoAman',
          url: 'https://kriptoaman.com/founder',
          worksFor: { '@id': 'https://kriptoaman.com/#organization' },
          sameAs: ['https://radenabdulrahman.com/']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'KriptoAman', item: 'https://kriptoaman.com/' },
            { '@type': 'ListItem', position: 2, name: 'Company Facts', item: canonicalUrl }
          ]
        }
      ]
    });
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      if (descriptionCreated) descriptionMeta.remove();
      else if (previousDescription !== null) descriptionMeta.setAttribute('content', previousDescription);
      if (robotsCreated) robotsMeta.remove();
      else if (previousRobots !== null) robotsMeta.setAttribute('content', previousRobots);
      if (canonicalCreated) canonical.remove();
      else if (previousCanonical !== null) canonical.setAttribute('href', previousCanonical);
      schema.remove();
    };
  }, []);

  const facts = [
    ['Nama legal', 'PT KRIPTO AMAN INDONESIA'],
    ['Brand', 'KriptoAman'],
    ['Negara', 'Republik Indonesia'],
    ['Platform', 'Informasi, pemantauan, edukasi, verifikasi berbasis sumber publik, dan analisis risiko indikatif aset digital'],
    ['Kepemimpinan publik', 'Raden Abdul Rahman, M.Sc. — Founder & CEO KriptoAman'],
    ['Email resmi', 'hello@kriptoaman.com']
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Link to="/" className="text-sm text-blue-500 hover:underline">← Kembali ke KriptoAman</Link>

        <header className="mt-8 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Official Company Facts</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight">PT Kripto Aman Indonesia</h1>
          <p className="mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Halaman ringkas ini menyatukan fakta publik utama mengenai PT Kripto Aman Indonesia dan KriptoAman agar identitas perusahaan, brand, kepemimpinan, alamat korporasi, ruang lingkup platform, dan kanal verifikasi dapat dipahami secara konsisten.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border bg-card overflow-hidden" aria-labelledby="facts-heading">
          <div className="p-6 border-b"><Building2 className="w-6 h-6 text-blue-500" /><h2 id="facts-heading" className="mt-3 text-xl font-bold">Company Facts</h2></div>
          <dl className="divide-y">
            {facts.map(([label, value]) => (
              <div key={label} className="grid sm:grid-cols-[180px_1fr] gap-2 sm:gap-6 p-5">
                <dt className="text-sm font-semibold">{label}</dt>
                <dd className="text-sm text-muted-foreground leading-relaxed">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <article className="rounded-2xl border p-6 bg-card">
            <UserRound className="w-6 h-6 text-blue-500" />
            <h2 className="mt-4 text-lg font-bold">Founder & CEO</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Raden Abdul Rahman, M.Sc. tercantum sebagai Founder & CEO KriptoAman dalam profil publik resmi.</p>
            <Link to="/founder" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-500 hover:underline">Buka profil Founder <ExternalLink className="w-4 h-4" /></Link>
          </article>

          <article className="rounded-2xl border p-6 bg-card">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h2 className="mt-4 text-lg font-bold">Corporate Office</h2>
            <address className="mt-3 not-italic text-sm text-muted-foreground leading-relaxed">Soho Capital – Podomoro City, 25th Floor, Unit 2508<br />Jl. Letjen S. Parman Kav. 28<br />Tanjung Duren Selatan, Grogol Petamburan<br />Jakarta Barat, DKI Jakarta 11470 · Indonesia</address>
          </article>

          <article className="rounded-2xl border p-6 bg-card">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <h2 className="mt-4 text-lg font-bold">Ruang Lingkup</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">KriptoAman berfokus pada informasi, pemantauan, edukasi, verifikasi berbasis sumber publik, dan analisis risiko indikatif. Platform tidak menyatakan jaminan keamanan, harga, keuntungan, likuiditas, atau keberhasilan listing aset.</p>
          </article>

          <article className="rounded-2xl border p-6 bg-card">
            <Mail className="w-6 h-6 text-blue-500" />
            <h2 className="mt-4 text-lg font-bold">Kanal Resmi</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Gunakan halaman legal dan kanal resmi KriptoAman untuk memverifikasi informasi korporasi yang dipublikasikan.</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-500">
              <Link to="/LegalCorporateInformation" className="hover:underline">Legal & Corporate</Link>
              <a href="mailto:hello@kriptoaman.com" className="hover:underline">Email resmi</a>
            </div>
          </article>
        </div>

        <p className="mt-8 text-xs text-muted-foreground leading-relaxed">Terakhir diperbarui: 30 Agustus 2026. Halaman ini hanya memuat informasi publik yang dimaksudkan sebagai ringkasan identitas korporasi; dokumen resmi tetap menjadi sumber utama untuk fakta hukum yang memerlukan verifikasi formal.</p>
      </section>
    </main>
  );
}
