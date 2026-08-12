import React from 'react';
import { Shield, Info, CheckCircle2 } from 'lucide-react';

const BADGES = {
  company: {
    label: 'Identitas perusahaan tersedia',
    fullText: 'Informasi identitas perusahaan ditampilkan terpisah dari status perizinan atau sertifikasi.',
  },
  privacy: {
    label: 'Kontrol privasi aplikasi',
    fullText: 'Aplikasi menyediakan kontrol akun dan privasi yang dapat diuji pada rilis saat ini.',
  },
  security: {
    label: 'Kontrol keamanan aplikasi',
    fullText: 'Status keamanan mengacu pada kontrol teknis aplikasi yang dapat diuji, bukan sertifikasi pihak ketiga.',
  },
};

export function ComplianceBadge({ type = 'company', size = 'md' }) {
  const badge = BADGES[type] || BADGES.company;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-2';

  return (
    <div
      title={badge.fullText}
      className={`inline-flex items-center gap-2 border rounded-full ${sizeClass} bg-slate-800/70 border-slate-600 text-slate-300`}
    >
      <Info className="w-4 h-4" />
      <span className="font-semibold">{badge.label}</span>
    </div>
  );
}

export function ComplianceStatusBanner() {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-start gap-4">
      <Shield className="w-6 h-6 text-blue-400 mt-1" />
      <div className="flex-1">
        <h3 className="text-white font-bold">Status Dokumen & Kepatuhan</h3>
        <p className="text-slate-300 text-sm mt-1">
          KriptoAman tidak menampilkan klaim lisensi, registrasi regulator, atau sertifikasi pihak ketiga sebagai aktif kecuali dokumen resmi yang relevan telah diverifikasi dan dipublikasikan.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <ComplianceBadge type="company" size="sm" />
          <ComplianceBadge type="privacy" size="sm" />
          <ComplianceBadge type="security" size="sm" />
        </div>
      </div>
    </div>
  );
}

export function RegulatoryInfoCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-bold">Informasi Regulasi</h3>
      </div>
      <div className="space-y-2 text-sm text-slate-300">
        <p className="leading-relaxed">
          Status perizinan dan sertifikasi hanya boleh dinyatakan setelah diverifikasi terhadap dokumen resmi dan sumber penerbitnya.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-amber-700/40 bg-amber-900/20 p-2 text-amber-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Halaman publik tidak menganggap pengajuan atau persiapan dokumen sebagai persetujuan regulator.</span>
        </div>
      </div>
      <a href="/RegulatoryDocs" className="block text-center text-blue-400 text-xs font-semibold hover:text-blue-300 transition-colors mt-3">
        Lihat Status Dokumen →
      </a>
    </div>
  );
}
