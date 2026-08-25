import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AtSign,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  Instagram,
  Mail,
  Music2,
  ShieldCheck,
  UserRound,
  Youtube,
} from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import { useLanguage } from '@/lib/LanguageContext';

const COPY = {
  id: {
    leadership: 'KEPEMIMPINAN',
    founderRole: 'Founder & CEO KriptoAman',
    founderCta: 'Tentang Founder',
    about: 'Tentang',
    privacy: 'Privasi',
    terms: 'Syarat',
    contact: 'Kontak',
    help: 'Bantuan',
    status: 'Status',
    disclaimer: 'KriptoAman adalah layanan informasi, edukasi, analitik, dan pemantauan aset digital. Bukan bursa, kustodian, atau penasihat investasi.',
    copyright: 'Hak cipta dilindungi.',
  },
  en: {
    leadership: 'LEADERSHIP',
    founderRole: 'Founder & CEO · KriptoAman',
    founderCta: 'About the Founder',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    help: 'Support',
    status: 'Status',
    disclaimer: 'KriptoAman provides digital-asset information, education, analytics, and monitoring. It is not an exchange, custodian, or investment adviser.',
    copyright: 'All rights reserved.',
  },
};

const PRODUCT_LINKS = [
  ['about', '/AboutUs', Info],
  ['privacy', '/PrivacyPolicy', ShieldCheck],
  ['terms', '/TermsOfService', FileText],
  ['contact', '/Contact', Mail],
  ['help', '/Support', CircleHelp],
  ['status', '/SystemStatus', Activity],
];

export default function HomeInstitutionalFooter() {
  const { language } = useLanguage();
  const t = COPY[language] || COPY.id;
  const year = new Date().getFullYear();

  return (
    <div className="space-y-4 pb-1 pt-1 sm:space-y-5 sm:pb-2">
      <section className="ka-surface overflow-hidden border border-sky-400/15 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-sky-400/20 bg-sky-400/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,.04)] sm:h-16 sm:w-16 sm:rounded-[20px]">
            <UserRound className="h-7 w-7 text-sky-300 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.22em] text-sky-300 sm:text-[11px]">{t.leadership}</p>
            <h2 className="mt-1 max-w-[24ch] text-[1.35rem] font-black leading-tight tracking-[-0.035em] text-white sm:text-3xl">
              Raden Abdul Rahman, M.Sc.
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-slate-400 sm:text-sm">{t.founderRole}</p>
          </div>

          <Link
            to="/Founder"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/[0.08] px-5 text-[13px] font-extrabold text-sky-200 transition hover:border-sky-300/35 hover:bg-sky-400/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:text-sm"
          >
            {t.founderCta} <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="ka-surface border border-sky-400/15 px-4 py-5 sm:px-7 sm:py-7">
        <div className="flex justify-center">
          <KriptoAmanLogo size={44} showText textSize="text-lg" />
        </div>

        <nav className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3" aria-label={language === 'en' ? 'Company and legal links' : 'Tautan perusahaan dan legal'}>
          {PRODUCT_LINKS.map(([key, to, Icon]) => (
            <Link
              key={key}
              to={to}
              className="group flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-transparent text-center text-[13px] font-bold text-slate-300 transition hover:border-sky-400/15 hover:bg-sky-400/[0.05] hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:min-h-[74px] sm:text-sm"
            >
              <Icon className="h-[22px] w-[22px] text-slate-400 transition group-hover:text-sky-300 sm:h-5 sm:w-5" aria-hidden="true" />
              <span>{t[key]}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 border-b border-sky-400/15 pb-4 text-[12px] font-semibold text-slate-400 sm:mt-5 sm:gap-x-5 sm:gap-y-3 sm:pb-5 sm:text-xs" aria-label="Social media">
          <span className="inline-flex items-center gap-1.5"><Music2 className="h-[17px] w-[17px]" aria-hidden="true" /> TikTok</span>
          <span className="inline-flex items-center gap-1.5"><Instagram className="h-[17px] w-[17px]" aria-hidden="true" /> Instagram</span>
          <span className="inline-flex items-center gap-1.5"><Youtube className="h-[17px] w-[17px]" aria-hidden="true" /> YouTube</span>
          <span className="inline-flex items-center gap-1.5"><AtSign className="h-[17px] w-[17px]" aria-hidden="true" /> X</span>
        </div>

        <div className="mx-auto mt-4 max-w-3xl text-center sm:mt-5">
          <p className="text-[12px] leading-5 text-slate-400 sm:text-sm sm:leading-6">{t.disclaimer}</p>
          <p className="mt-3 text-[13px] font-bold text-slate-200 sm:mt-4 sm:text-sm">© {year} KriptoAman. {t.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
