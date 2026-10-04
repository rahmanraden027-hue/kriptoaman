import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, BookOpen, Activity, ArrowRight, ExternalLink } from 'lucide-react';

const ITEMS = [
  {
    icon: Building2,
    eyebrow: 'COMPANY',
    title: 'PT Kripto Aman Indonesia',
    desc: 'Identitas korporasi, informasi legal, ruang lingkup layanan dan kanal verifikasi resmi.',
    to: '/company',
    cta: 'Company facts',
  },
  {
    icon: BookOpen,
    eyebrow: 'RESEARCH',
    title: 'KriptoAman Research',
    desc: 'Dokumentasi arsitektur, keamanan dan penelitian teknis dipisahkan dari klaim pemasaran dan materi promosi.',
    to: '/research',
    cta: 'Open research',
  },
  {
    icon: Activity,
    eyebrow: 'TRANSPARENCY',
    title: 'System Status & Verification',
    desc: 'Status sistem, data health dan jalur verifikasi dipublikasikan dengan state yang eksplisit dan tanpa metrik sintetis.',
    to: '/SystemStatus',
    cta: 'View system status',
  },
];

export default function GLandingInstitutional() {
  return (
    <section id="institutional" className="px-4 sm:px-6 py-14">
      <div className="max-w-[1440px] mx-auto">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] ka-blue">Institutional Layer</p>
          <h2 className="ka-sec-title mt-3 text-2xl sm:text-3xl">Perusahaan, riset, dan transparansi dipisahkan dengan jelas.</h2>
          <p className="ka-text2 mt-3 text-sm leading-relaxed">
            KriptoAman menjaga pengalaman produk tetap fokus sambil menyediakan jalur terpisah untuk fakta perusahaan, penelitian, dan bukti operasional.
          </p>
        </div>

        <div className="ka-institutional-grid grid gap-4 mt-8 md:grid-cols-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} to={item.to} className="ka-card p-6 flex flex-col min-h-[220px] hover:-translate-y-0.5 transition-transform ka-institutional-card">
                <div className="w-11 h-11 rounded-xl ka-card2 flex items-center justify-center">
                  <Icon className="w-5 h-5 ka-blue" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] ka-text2 mt-5">{item.eyebrow}</p>
                <h3 className="font-black text-lg ka-text mt-2">{item.title}</h3>
                <p className="text-xs ka-text2 leading-relaxed mt-2 flex-1">{item.desc}</p>
                <span className="inline-flex items-center gap-2 text-xs font-bold ka-blue mt-5">
                  {item.cta} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] ka-text2">
          <Link to="/founder" className="hover:ka-blue">Founder & CEO</Link>
          <Link to="/LegalCorporateInformation" className="hover:ka-blue">Legal & Corporate</Link>
          <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:ka-blue">ZEVARYQ Explorer <ExternalLink className="h-3 w-3" /></a>
        </div>
      </div>
    </section>
  );
}
