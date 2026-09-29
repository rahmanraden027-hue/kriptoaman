import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertTriangle, ExternalLink } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const COLS = [
  { title: 'Platform', links: [['Intelligence Hub', '/login'], ['Market Intelligence', '/Market'], ['Security', '/SecurityHub'], ['System Status', '/SystemStatus']] },
  { title: 'ZEVARYQ', links: [['Network', '/ZEVARYQ'], ['Wallet', '/wallet-app'], ['Explorer', 'https://explorer.kriptoaman.com'], ['Developer Center', 'https://explorer.kriptoaman.com/developer']] },
  { title: 'Company', links: [['Company Facts', '/company'], ['Research', '/research'], ['Founder & CEO', '/founder'], ['Contact', '/Contact']] },
  { title: 'Legal', links: [['Legal & Corporate', '/LegalCorporateInformation'], ['Privacy', '/PrivacyPolicy'], ['Terms', '/TermsOfService'], ['Disclaimer', '/Disclaimer']] },
];

function FooterLink({ label, to }) {
  if (to.startsWith('http')) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="text-xs ka-text2 hover:ka-blue transition-colors inline-flex items-center gap-1">
        {label}<ExternalLink className="w-3 h-3" />
      </a>
    );
  }
  return <Link to={to} className="text-xs ka-text2 hover:ka-blue transition-colors">{label}</Link>;
}

export default function GLandingFooter() {
  return (
    <footer id="kontak" className="px-4 sm:px-6 pt-12 pb-8 border-t" style={{ borderColor: 'var(--ka-border)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-7">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2">
              <KriptoAmanLogo size={32} showText={false} animate={false} />
              <span className="font-extrabold tracking-[0.16em] text-sm uppercase"><span className="ka-text">KRIPTO</span><span className="ka-blue">AMAN</span></span>
            </div>
            <p className="text-sm ka-text2 mt-4 max-w-sm leading-6">Digital Asset Intelligence Platform untuk market intelligence, on-chain verification, security intelligence dan multi-chain monitoring.</p>
            <p className="text-[11px] ka-text2 mt-3">PT Kripto Aman Indonesia · Indonesia</p>
            <a href="mailto:hello@kriptoaman.com" className="inline-flex items-center gap-2 text-xs ka-blue mt-3"><Mail className="w-3.5 h-3.5" /> hello@kriptoaman.com</a>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="text-[10px] font-black uppercase tracking-[0.16em] ka-text2 mb-4">{c.title}</h4>
              <ul className="space-y-2.5">{c.links.map(([label, to]) => <li key={label}><FooterLink label={label} to={to} /></li>)}</ul>
            </div>
          ))}
        </div>

        <div className="ka-card2 p-4 mt-8 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 ka-gold shrink-0 mt-0.5" />
          <p className="text-[11px] ka-text2 leading-relaxed">
            Informasi pasar, riset, status jaringan dan analisis risiko disediakan untuk pemantauan, verifikasi dan edukasi. KriptoAman bukan bursa, kustodian, broker, atau penasihat investasi dan tidak menjanjikan harga, keuntungan, likuiditas, listing, atau hasil investasi tertentu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--ka-border)' }}>
          <p className="text-[11px] ka-text2">© 2026 KriptoAman · Production V2.</p>
          <p className="text-[10px] tracking-[0.14em] ka-text2">KRIPTOAMAN = INTELLIGENCE · ZEVARYQ = INFRASTRUCTURE</p>
        </div>
      </div>
    </footer>
  );
}
