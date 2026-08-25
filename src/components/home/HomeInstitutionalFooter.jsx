import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AtSign,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Contact,
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
    <div className="space-y-5 pb-3 pt-1">
      <section className="ka-surface overflow-hidden border border-sky-400/15 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-sky-400/20 bg-sky-400/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
            <UserRound className="h-8 w-8 text-sky-300" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.22em] text-sky-300">{t.leadership}</p>
            <h2 className="mt-1 max-w-[24ch] text-2xl font-black leading-tight tracking-[-0.035em] text-white sm:text-3xl">
              Raden Abdul Rahman, M.Sc.
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">{t.founderRole}</p>
          </div>

          <Link
            to="/Founder"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/[0.08] px-5 text-sm font-extrabold text-sky-200 transition hover:border-sky-300/35 hover:bg-sky-400/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            {t.founderCta} <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="ka-surface border border-sky-400/15 px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex justify-center">
          <KriptoAmanLogo size={42} showText textSize="text-lg" />
        </div>

        <nav className="mt-6 grid grid-cols-3 gap-3" aria-label={language === 'en' ? 'Company and legal links' : 'Tautan perusahaan dan legal'}>
          {PRODUCT_LINKS.map(([key, to, Icon]) => (
            <Link
              key={key}
              to={to}
              className="group flex min-h-[74px] flex-col items-center justify-center gap-2 rounded-2xl border border-transparent text-center text-xs font-bold text-slate-400 transition hover:border-sky-400/15 hover:bg-sky-400/[0.05] hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <Icon className="h-5 w-5 text-slate-400 transition group-hover:text-sky-300" aria-hidden="true" />
              <span>{t[key]}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-b border-sky-400/15 pb-5 text-xs font-semibold text-slate-400" aria-label="Social media">
          <span className="inline-flex items-center gap-1.5"><Music2 className="h-4 w-4" aria-hidden="true" /> TikTok</span>
          <span className="inline-flex items-center gap-1.5"><Instagram className="h-4 w-4" aria-hidden="true" /> Instagram</span>
          <span className="inline-flex items-center gap-1.5"><Youtube className="h-4 w-4" aria-hidden="true" /> YouTube</span>
          <span className="inline-flex items-center gap-1.5"><AtSign className="h-4 w-4" aria-hidden="true" /> X</span>
        </div>

        <div className="mx-auto mt-5 max-w-3xl text-center">
          <p className="text-xs leading-6 text-slate-400 sm:text-sm">{t.disclaimer}</p>
          <p className="mt-4 text-sm font-bold text-slate-200">© {year} KriptoAman. {t.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
