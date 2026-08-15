import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import { Info, ShieldCheck, FileText, Mail, LifeBuoy, Activity, Music2, Instagram, Youtube, AtSign } from 'lucide-react';

const LINKS = [
  { label: 'Tentang', page: 'AboutUs', icon: Info },
  { label: 'Privasi', page: 'PrivacyPolicy', icon: ShieldCheck },
  { label: 'Syarat', page: 'TermsOfService', icon: FileText },
  { label: 'Kontak', page: 'Contact', icon: Mail },
  { label: 'Bantuan', page: 'Support', icon: LifeBuoy },
  { label: 'Status', page: 'SystemStatus', icon: Activity },
];

const SOCIAL_LINKS = [
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@kriptoamanofficial',
    icon: Music2,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/kriptoamanofficial/',
    icon: Instagram,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@KriptoAmanOfficial',
    icon: Youtube,
  },
  {
    label: 'X',
    href: 'https://x.com/KriptoAman',
    icon: AtSign,
  },
];

export default function HomeFooter() {
  return (
    <footer className="ka-surface p-5 ka-fade-up" style={{ animationDelay: '420ms' }}>
      <div className="flex justify-center mb-4">
        <KriptoAmanLogo size={28} showText textSize="text-xs" />
      </div>

      <div className="grid grid-cols-3 gap-y-3 gap-x-2 mb-4">
        {LINKS.map(({ label, page, icon: Icon }) => (
          <Link key={page} to={createPageUrl(page)}
            className="flex flex-col items-center gap-1 py-1 ka-muted hover:text-ka-emerald transition-colors tap-reset">
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-4" aria-label="Media sosial resmi KriptoAman">
        {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} resmi KriptoAman`}
            className="flex items-center gap-1.5 ka-muted hover:text-ka-emerald transition-colors tap-reset"
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-semibold">{label}</span>
          </a>
        ))}
      </div>

      <div className="pt-3 border-t border-ka-card-border text-center">
        <p className="ka-muted text-[10px] leading-relaxed">
          KriptoAman adalah layanan informasi, edukasi, dan pemantauan aset digital.<br />
          Bukan bursa, kustodian, atau penasihat investasi.
        </p>
        <p className="text-white/80 text-[10px] font-semibold mt-2">© 2026 KriptoAman. Hak cipta dilindungi.</p>
      </div>
    </footer>
  );
}
