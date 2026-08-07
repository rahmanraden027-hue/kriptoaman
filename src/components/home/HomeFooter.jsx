import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import { Info, ShieldCheck, FileText, Mail, LifeBuoy, Activity } from 'lucide-react';

const LINKS = [
  { label: 'Tentang', page: 'AboutUs', icon: Info },
  { label: 'Privasi', page: 'PrivacyPolicy', icon: ShieldCheck },
  { label: 'Syarat', page: 'TermsOfService', icon: FileText },
  { label: 'Kontak', page: 'Contact', icon: Mail },
  { label: 'Bantuan', page: 'Support', icon: LifeBuoy },
  { label: 'Status', page: 'SystemStatus', icon: Activity },
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

      <div className="pt-3 border-t border-ka-card-border text-center">
        <p className="ka-muted text-[10px] leading-relaxed">
          KriptoAman beroperasi sesuai regulasi Bappebti &amp; OJK Indonesia.<br />
          Transaksi dijamin dengan enkripsi SSL 256-bit.
        </p>
        <p className="text-white/80 text-[10px] font-semibold mt-2">© 2025 KriptoAman. Hak cipta dilindungi.</p>
      </div>
    </footer>
  );
}