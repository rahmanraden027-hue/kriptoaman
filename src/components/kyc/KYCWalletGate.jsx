import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShieldCheck, Clock, XCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Banner kecil yang tampil di Wallet/Withdrawal
 * untuk menginformasikan status KYC pengguna.
 * 
 * Props:
 *   compact  - jika true, tampilkan versi mini (untuk modal)
 *   onBlock  - callback(true/false) untuk memberi tahu parent apakah KYC memblokir aksi
 */
export default function KYCWalletGate({ compact = false, onBlock }) {
  const [kycStatus, setKycStatus] = useState(null); // null=loading, 'approved'|'pending'|'rejected'|'none'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        // Cek dari entity KYCVerification sebagai source of truth
        const records = await base44.entities.KYCVerification.filter(
          { userEmail: u.email }, '-created_date', 1
        );
        let status = 'none';
        if (records.length > 0) {
          const s = records[0].status;
          status = s === 'verified' ? 'approved' : s === 'pending' ? 'pending' : s === 'rejected' ? 'rejected' : 'none';
        } else if (u.kycStatus === 'approved') {
          status = 'approved';
        }
        setKycStatus(status);
        if (onBlock) onBlock(status !== 'approved');
      } catch {
        setKycStatus('none');
        if (onBlock) onBlock(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;
  if (kycStatus === 'approved') return null; // Tidak perlu tampilkan apa-apa

  const configs = {
    none: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      title: compact ? 'KYC Diperlukan' : 'Verifikasi Identitas Diperlukan',
      desc: compact
        ? 'Selesaikan KYC untuk mengaktifkan withdrawal.'
        : 'Lakukan verifikasi KYC untuk membuka fitur withdrawal, deposit bank, dan P2P Lending.',
      cta: 'Verifikasi Sekarang →',
      ctaColor: 'text-amber-400',
    },
    pending: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: <Clock className="w-4 h-4 text-blue-400 shrink-0" />,
      title: 'KYC Sedang Diproses',
      desc: compact
        ? 'KYC Anda sedang diverifikasi tim kami (1×24 jam).'
        : 'Pengajuan KYC Anda sedang dalam proses verifikasi. Estimasi 1×24 jam kerja.',
      cta: 'Lihat Status →',
      ctaColor: 'text-blue-400',
    },
    rejected: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
      title: 'KYC Ditolak — Ajukan Ulang',
      desc: compact
        ? 'KYC ditolak. Ajukan ulang dengan dokumen yang valid.'
        : 'KYC Anda ditolak. Silakan ajukan ulang dengan dokumen yang lebih jelas.',
      cta: 'Ajukan Ulang →',
      ctaColor: 'text-red-400',
    },
  };

  const cfg = configs[kycStatus] || configs.none;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 border rounded-xl p-3 ${cfg.bg}`}>
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-bold">{cfg.title}</p>
          <p className="text-slate-400 text-[10px] leading-tight mt-0.5">{cfg.desc}</p>
        </div>
        <Link to={createPageUrl('KYCVerificationPage')} className={`text-xs font-semibold whitespace-nowrap ${cfg.ctaColor} flex items-center gap-0.5`}>
          KYC <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-4 space-y-3 ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        {cfg.icon}
        <div>
          <p className="text-white font-bold text-sm">{cfg.title}</p>
          <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{cfg.desc}</p>
        </div>
      </div>
      <Link
        to={createPageUrl('KYCVerificationPage')}
        className={`flex items-center gap-1.5 text-sm font-semibold ${cfg.ctaColor} hover:opacity-80 transition-opacity`}
      >
        <ShieldCheck className="w-4 h-4" />
        {cfg.cta}
      </Link>
    </div>
  );
}