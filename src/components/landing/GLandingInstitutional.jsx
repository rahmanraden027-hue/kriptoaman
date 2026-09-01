import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, UserRound, BookOpen, Network, ArrowRight, ExternalLink } from 'lucide-react';

const ITEMS = [
  {
    icon: UserRound,
    eyebrow: 'Executive Leadership',
    title: 'Founder & CEO',
    desc: 'Profil resmi Raden Abdul Rahman dan fokus kepemimpinan pada pengembangan produk digital, pengalaman pengguna, bisnis, blockchain, dan aset digital.',
    to: '/founder',
    cta: 'Lihat profil resmi',
  },
  {
    icon: Building2,
    eyebrow: 'Institutional Identity',
    title: 'PT Kripto Aman Indonesia',
    desc: 'Fakta perusahaan, ruang lingkup platform, kanal verifikasi, informasi korporasi, dan identitas legal yang dipublikasikan secara terukur.',
    to: '/company',
    cta: 'Lihat company facts',
  },
  {
    icon: BookOpen,
    eyebrow: 'Research & Documentation',
    title: 'KriptoAman Research',
    desc: 'Dokumentasi arsitektur, keamanan, kesiapan publik, dan penelitian blockchain disajikan terpisah dari klaim pemasaran.',
    to: '/research',
    cta: 'Buka research',
  },
  {
    icon: Network,
    eyebrow: 'Blockchain Infrastructure',
    title: 'KAM Network & Explorer',
    desc: 'Akses informasi jaringan dan explorer publik untuk pemeriksaan on-chain. Status jaringan ditampilkan berdasarkan endpoint yang dapat diverifikasi.',
    href: 'https://explorer.kriptoaman.com',
    cta: 'Buka explorer',
  },
];

export default function GLandingInstitutional() {
  return (
    <section id="institutional" className="px-4 sm:px-6 py-14">
      <div className="max-w-[1440px] mx-auto">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] ka-blue">Verified Ecosystem</p>
          <h2 className="ka-sec-title mt-3 text-2xl sm:text-3xl">Satu Ekosistem, Peran yang Jelas</h2>
          <p className="ka-text2 mt-3 text-sm leading-relaxed">
            KriptoAman memisahkan identitas kepemimpinan, badan usaha, produk, penelitian, dan infrastruktur blockchain agar setiap informasi dapat dipahami dan diverifikasi sesuai konteksnya.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <div className="w-10 h-10 rounded-xl ka-card2 flex items-center justify-center">
                  <Icon className="w-5 h-5 ka-blue" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] ka-text2 mt-5">{item.eyebrow}</p>
                <h3 className="font-bold text-base ka-text mt-2">{item.title}</h3>
                <p className="text-xs ka-text2 leading-relaxed mt-2 flex-1">{item.desc}</p>
                <span className="inline-flex items-center gap-2 text-xs font-semibold ka-blue mt-5">
                  {item.cta} {item.href ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </span>
              </>
            );

            return item.href ? (
              <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="ka-card p-5 flex flex-col min-h-[250px] hover:-translate-y-0.5 transition-transform">
                {content}
              </a>
            ) : (
              <Link key={item.title} to={item.to} className="ka-card p-5 flex flex-col min-h-[250px] hover:-translate-y-0.5 transition-transform">
                {content}
              </Link>
            );
          })}
        </div>

        <p className="text-[11px] ka-text2 mt-5 leading-relaxed opacity-75">
          Informasi korporasi, penelitian, dan status jaringan memiliki fungsi berbeda. Publikasi dokumentasi atau endpoint yang aktif tidak dengan sendirinya menyatakan persetujuan regulator, listing pihak ketiga, likuiditas, atau jaminan investasi.
        </p>
      </div>
    </section>
  );
}
