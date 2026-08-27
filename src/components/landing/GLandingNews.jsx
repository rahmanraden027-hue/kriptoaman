import React from 'react';
import { ArrowRight, CalendarDays, Newspaper, ShieldCheck } from 'lucide-react';

export default function GLandingNews() {
  return (
    <section id="berita" className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] ka-cyan">KriptoAman News</p>
            <h2 className="mt-2 text-2xl font-black ka-text sm:text-3xl">Berita & Perkembangan Resmi</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 ka-text2">
              Ikuti perkembangan KAM, jaringan, tokenomics, keamanan, dan milestone yang dapat diverifikasi langsung dari sumber resmi KriptoAman.
            </p>
          </div>
        </div>

        <a
          href="/news/kam-campaign-2026"
          className="group block overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-sky-500/10 via-slate-900/70 to-emerald-500/10 p-5 transition hover:-translate-y-0.5 hover:border-sky-300/35 sm:p-7"
          aria-label="Baca berita kampanye global KAM 2026"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] ka-text2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 font-bold ka-cyan">
                  <Newspaper className="h-3.5 w-3.5" /> Berita Utama
                </span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> 27 Agustus 2026</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Transparency First</span>
              </div>

              <h3 className="mt-4 max-w-4xl text-xl font-black leading-tight ka-text sm:text-3xl">
                KriptoAman Memulai Kampanye Global KAM: Technology, Transparency & Verifiable Progress
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 ka-text2 sm:text-base">
                Kampanye KAM 2026 menempatkan teknologi, transparansi Tokenomics v1, governance, kesiapan jaringan, dan milestone terverifikasi sebagai fondasi komunikasi global.
              </p>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black ka-cyan">
                Baca berita resmi <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] ka-text2">KAM Campaign Pillars</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {['Technology First', 'Transparency', 'Governance', 'Verifiable Milestones'].map((item) => (
                  <div key={item} className="ka-card2 rounded-xl p-3 text-xs font-bold ka-text">{item}</div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-5 ka-text2">
                Informasi kampanye tidak merupakan janji harga, keuntungan, listing, atau likuiditas.
              </p>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}
