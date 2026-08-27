import React, { useEffect } from 'react';
import { ArrowLeft, CalendarDays, Globe2, Network, ShieldCheck, Sparkles } from 'lucide-react';

const ARTICLE_URL = 'https://kriptoaman.com/news/kam-campaign-2026';
const ARTICLE_TITLE = 'KriptoAman Memulai Kampanye Global KAM: Technology, Transparency & Verifiable Progress';
const ARTICLE_DESCRIPTION = 'Kampanye KAM 2026 berfokus pada teknologi, transparansi Tokenomics v1, governance, kesiapan jaringan, dan milestone yang dapat diverifikasi.';

const allocations = [
  ['Ecosystem & Development', '35%'],
  ['Treasury & Strategic Reserve', '20%'],
  ['Liquidity & Market Infrastructure', '15%'],
  ['Team & Contributors', '15%'],
  ['Community & Adoption', '10%'],
  ['Strategic Partnerships', '5%'],
];

function upsertMeta(selector, attrs) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    document.head.appendChild(node);
  }
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
}

export default function KAMCampaignNews() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${ARTICLE_TITLE} | KriptoAman News`;

    upsertMeta('meta[name="description"]', { name: 'description', content: ARTICLE_DESCRIPTION });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: ARTICLE_TITLE });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: ARTICLE_DESCRIPTION });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'article' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: ARTICLE_URL });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: ARTICLE_TITLE });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: ARTICLE_DESCRIPTION });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', ARTICLE_URL);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.kriptoamanNews = 'kam-campaign-2026';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: ARTICLE_TITLE,
      description: ARTICLE_DESCRIPTION,
      datePublished: '2026-08-27T00:00:00+07:00',
      dateModified: '2026-08-27T00:00:00+07:00',
      mainEntityOfPage: ARTICLE_URL,
      publisher: {
        '@type': 'Organization',
        name: 'KriptoAman',
        url: 'https://kriptoaman.com',
      },
    });
    document.head.appendChild(script);

    return () => {
      document.title = previousTitle;
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <a href="/KAM" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200">
          <ArrowLeft className="h-4 w-4" /> Kembali ke halaman KAM
        </a>

        <article className="mt-6 overflow-hidden rounded-[30px] border border-sky-400/20 bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/40 shadow-2xl shadow-sky-950/20">
          <header className="border-b border-white/10 p-6 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-300">
              <Sparkles className="h-4 w-4" /> KriptoAman News
            </div>
            <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">{ARTICLE_TITLE}</h1>
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
              Kampanye KAM 2026 berfokus pada edukasi teknologi, transparansi tokenomics, kesiapan jaringan, dan milestone yang dapat diverifikasi—bukan pada janji harga atau keuntungan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><CalendarDays className="h-4 w-4" /> 27 Agustus 2026</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><Globe2 className="h-4 w-4" /> Kampanye Global</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><ShieldCheck className="h-4 w-4" /> Transparency First</span>
            </div>
          </header>

          <div className="space-y-8 p-6 sm:p-10">
            <section>
              <h2 className="text-xl font-black sm:text-2xl">Membangun kredibilitas melalui bukti</h2>
              <p className="mt-3 leading-7 text-slate-300">
                KriptoAman mengarahkan kampanye KAM pada pendekatan yang terukur: memperkenalkan fungsi ekosistem, struktur ekonomi, governance, kesiapan developer, serta bukti teknis jaringan secara bertahap. Setiap milestone dipisahkan menjadi status verified, in verification, atau planned agar komunikasi publik tetap faktual dan mudah diperiksa.
              </p>
            </section>

            <section className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Network className="h-6 w-6 text-sky-300" />
                <h2 className="text-xl font-black">KAM Tokenomics v1</h2>
              </div>
              <p className="mt-3 leading-7 text-slate-300">
                Total supply KAM tetap 1.000.000.000 KAM dengan 18 decimals. Struktur ini merupakan baseline ekonomi proyek dan tidak berubah mengikuti tren pasar harian.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {allocations.map(([name, pct]) => (
                  <div key={name} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
                    <span className="text-sm text-slate-300">{name}</span>
                    <span className="font-black text-sky-300">{pct}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black sm:text-2xl">Fokus kampanye 2026</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  ['Technology First', 'Menjelaskan arsitektur jaringan, developer ecosystem, wallet integration, RPC, explorer, dan monitoring berdasarkan bukti aktual.'],
                  ['Transparency by Design', 'Mempublikasikan tokenomics, vesting, governance, supply methodology, serta perubahan material melalui dokumentasi yang terversi.'],
                  ['Verifiable Milestones', 'Mengutamakan milestone yang dapat diverifikasi publik dibanding klaim promosi yang belum memiliki bukti.'],
                  ['Global Readiness', 'Membangun dokumentasi dan komunikasi yang konsisten untuk komunitas, developer, data aggregator, dan integrasi internasional.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="font-black text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5 sm:p-6">
              <h2 className="text-xl font-black">Komitmen komunikasi</h2>
              <p className="mt-3 leading-7 text-slate-300">
                KriptoAman tidak menjadikan kampanye KAM sebagai janji keuntungan, target harga, guaranteed listing, atau guaranteed liquidity. Status jaringan, fitur, dan milestone akan dikomunikasikan sesuai kondisi yang dapat diverifikasi pada saat publikasi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black sm:text-2xl">Langkah berikutnya</h2>
              <p className="mt-3 leading-7 text-slate-300">
                Kampanye berlanjut melalui edukasi tokenomics, utility, governance, infrastructure readiness, developer documentation, dan KAM Verification Matrix. Tujuannya adalah membangun ekosistem yang transparan, profesional, dan siap dinilai secara global berdasarkan bukti yang tersedia.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/KAM" className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-black hover:bg-sky-500">Explore KAM</a>
                <a href="/KAMTokenomics" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black hover:bg-white/10">KAM Tokenomics</a>
                <a href="/KAMGlobalRoadmap" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black hover:bg-white/10">Global Roadmap</a>
              </div>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
