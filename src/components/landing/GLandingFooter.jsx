import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertTriangle } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const COLS = [
  { title: 'Produk', links: [['Dashboard', '/login'], ['Pemantauan Aset', '/login'], ['Verifikasi Transaksi', '/login'], ['Pemeriksaan Risiko', '/login']] },
  { title: 'Keamanan', links: [['Cara Kerja', '#fitur'], ['Status Sistem', '/SystemStatus'], ['Pemeriksaan Alamat', '/login'], ['Peringatan Risiko', '/login']] },
  { title: 'Perusahaan', links: [['Tentang Kami', '/AboutUs'], ['Edukasi', '/Edukasi'], ['Kontak', '/Contact'], ['Kebijakan Privasi', '/PrivacyPolicy']] },
  { title: 'Bantuan', links: [['FAQ', '#faq'], ['Dukungan', '/Contact'], ['Syarat Penggunaan', '/TermsOfService'], ['Disclaimer', '/Disclaimer']] },
];

export default function GLandingFooter() {
  return (
    <footer id="kontak" className="px-4 sm:px-6 pt-14 pb-8 border-t" style={{ borderColor: 'var(--ka-border)' }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <KriptoAmanLogo size={30} showText={false} animate={false} />
              <span className="font-extrabold tracking-[0.16em] text-sm uppercase">
                <span className="ka-text">KRIPTO</span><span className="ka-blue">AMAN</span>
              </span>
            </div>
            <p className="text-xs ka-text2 mt-3 leading-relaxed">
              Platform informasi, pemantauan, dan analisis risiko aset kripto.
            </p>
            <a href="mailto:hello@kriptoaman.com" className="inline-flex items-center gap-2 text-xs ka-blue mt-3">
              <Mail className="w-3.5 h-3.5" /> hello@kriptoaman.com
            </a>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider ka-text2 mb-3">{c.title}</h4>
              <ul className="space-y-2">
                {c.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-xs ka-text2 hover:ka-blue transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ka-card2 p-4 mt-8 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 ka-gold shrink-0 mt-0.5" />
          <p className="text-[11px] ka-text2 leading-relaxed">
            Disclaimer risiko kripto: Aset kripto bersifat volatil dan berisiko tinggi. KriptoAman
            tidak memberikan nasihat investasi dan bukan penyelenggara keuangan resmi. Keputusan
            sepenuhnya tanggung jawab Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--ka-border)' }}>
          <p className="text-[11px] ka-text2">© 2026 KriptoAman. Hak cipta dilindungi.</p>
          <div className="flex gap-4 text-[11px] ka-text2">
            <Link to="/PrivacyPolicy" className="hover:ka-blue">Kebijakan Privasi</Link>
            <Link to="/TermsOfService" className="hover:ka-blue">Syarat Penggunaan</Link>
            <Link to="/Disclaimer" className="hover:ka-blue">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
