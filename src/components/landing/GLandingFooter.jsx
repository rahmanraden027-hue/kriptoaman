import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, AlertTriangle, ExternalLink } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const COLS = [
  { title: 'Produk', links: [['Dashboard', '/login'], ['Pemantauan Aset', '/login'], ['Verifikasi Transaksi', '/login'], ['Pemeriksaan Risiko', '/login']] },
  { title: 'Enterprise', links: [['Enterprise Solutions', '/enterprise'], ['KAM Network Docs', '/KAMNetworkDocs'], ['Status Sistem', '/SystemStatus'], ['Research & Publications', '/research']] },
  { title: 'Perusahaan', links: [['Company Facts', '/company'], ['Founder & CEO', '/founder'], ['Legal & Corporate', '/LegalCorporateInformation'], ['Tentang Kami', '/AboutUs'], ['Kontak', '/Contact']] },
  { title: 'Bantuan & Legal', links: [['FAQ', '#faq'], ['Dukungan', '/Contact'], ['Kebijakan Privasi', '/PrivacyPolicy'], ['Syarat Penggunaan', '/TermsOfService'], ['Disclaimer', '/Disclaimer']] },
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
    <footer id="kontak" className="px-4 sm:px-6 pt-14 pb-8 border-t" style={{ borderColor: 'var(--ka-border)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2"><KriptoAmanLogo size={30} showText={false} animate={false} /><span className="font-extrabold tracking-[0.16em] text-sm uppercase"><span className="ka-text">KRIPTO</span><span className="ka-blue">AMAN</span></span></div>
            <p className="text-xs ka-text2 mt-3 leading-relaxed">Platform intelijen aset digital untuk informasi pasar, pemantauan, verifikasi berbasis sumber publik, edukasi, dan analisis risiko indikatif.</p>
            <p className="text-[11px] ka-text2 mt-2 leading-relaxed">Dioperasikan oleh PT Kripto Aman Indonesia · Republik Indonesia. Bukan bursa, kustodian, broker, atau penasihat investasi.</p>
            <div className="flex items-start gap-2 text-[11px] ka-text2 mt-3 leading-relaxed"><MapPin className="w-3.5 h-3.5 ka-blue shrink-0 mt-0.5" /><address className="not-italic"><span className="font-semibold ka-text">Corporate Office</span><br />Soho Capital – Podomoro City, 25th Floor, Unit 2508<br />Jl. Letjen S. Parman Kav. 28<br />Tanjung Duren Selatan, Grogol Petamburan<br />Jakarta Barat, DKI Jakarta 11470 · Indonesia</address></div>
            <a href="mailto:hello@kriptoaman.com" className="inline-flex items-center gap-2 text-xs ka-blue mt-3"><Mail className="w-3.5 h-3.5" /> hello@kriptoaman.com</a>
          </div>
          {COLS.map((c) => <div key={c.title}><h4 className="text-xs font-bold uppercase tracking-wider ka-text2 mb-3">{c.title}</h4><ul className="space-y-2">{c.links.map(([label, to]) => <li key={label}><FooterLink label={label} to={to} /></li>)}</ul></div>)}
        </div>
        <div className="ka-card2 p-4 mt-8 flex items-start gap-3"><AlertTriangle className="w-4 h-4 ka-gold shrink-0 mt-0.5" /><p className="text-[11px] ka-text2 leading-relaxed">Informasi pasar, riset, status jaringan, dan analisis risiko disediakan untuk pemantauan, verifikasi, dan edukasi. KriptoAman tidak memberikan nasihat investasi serta tidak menjanjikan harga, keuntungan, likuiditas, listing, atau hasil investasi tertentu.</p></div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--ka-border)' }}><p className="text-[11px] ka-text2">© 2026 KriptoAman · PT Kripto Aman Indonesia.</p><div className="flex flex-wrap justify-center gap-4 text-[11px] ka-text2"><Link to="/enterprise" className="hover:ka-blue">Enterprise</Link><Link to="/company" className="hover:ka-blue">Company Facts</Link><Link to="/founder" className="hover:ka-blue">Founder & CEO</Link><Link to="/research" className="hover:ka-blue">Research</Link><Link to="/LegalCorporateInformation" className="hover:ka-blue">Legal & Corporate</Link><Link to="/PrivacyPolicy" className="hover:ka-blue">Privasi</Link><Link to="/TermsOfService" className="hover:ka-blue">Syarat</Link><Link to="/Disclaimer" className="hover:ka-blue">Disclaimer</Link></div></div>
      </div>
    </footer>
  );
}
