import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import KYCForm from '../components/kyc/KYCForm';
import TrustBadges from '../components/trust/TrustBadges';

export default function KYCVerificationPage() {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const user = await base44.auth.me();
      const kycRecords = await base44.entities.KYCVerification.filter({
        userEmail: user.email
      });
      setKycStatus(kycRecords[0] || null);
    } catch (err) {
      console.error('Error fetching KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (kycStatus?.status === 'verified') {
    return (
      <div className="max-w-2xl mx-auto p-6 pb-20">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
          <h1 className="text-white font-bold text-2xl">Verifikasi Identitas Selesai ✓</h1>
          <p className="text-slate-300">
            Status identitas pada akun Anda telah tercatat sebagai terverifikasi. Status ini digunakan untuk fitur verifikasi dan keamanan yang tersedia di KriptoAman.
          </p>
          <div className="bg-slate-800/50 rounded-lg p-4 text-left space-y-2 text-sm">
            {kycStatus.fullName && <div className="flex justify-between"><span className="text-slate-400">Nama:</span><span className="text-white">{kycStatus.fullName}</span></div>}
            <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className="text-green-400 font-semibold">Terverifikasi</span></div>
            {kycStatus.verificationLevel && <div className="flex justify-between"><span className="text-slate-400">Level:</span><span className="text-blue-400 uppercase text-xs">{kycStatus.verificationLevel}</span></div>}
            {kycStatus.expiresAt && (
              <div className="flex justify-between"><span className="text-slate-400">Berlaku hingga:</span><span className="text-white">{new Date(kycStatus.expiresAt).toLocaleDateString('id-ID')}</span></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto p-6 pb-20">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center space-y-4">
          <Clock className="w-16 h-16 text-yellow-400 mx-auto" />
          <h1 className="text-white font-bold text-2xl">Verifikasi Sedang Diproses</h1>
          <p className="text-slate-300">
            Data verifikasi Anda telah diterima dan sedang diproses. Waktu penyelesaian bergantung pada penyedia dan pemeriksaan yang diperlukan.
          </p>
          <p className="text-slate-400 text-sm">Status akan diperbarui pada akun setelah hasil verifikasi tersedia.</p>
          <div className="bg-slate-800/50 rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className="text-yellow-400 font-semibold">Dalam Proses</span></div>
            {kycStatus.created_date && <div className="flex justify-between"><span className="text-slate-400">Dikirim:</span><span className="text-white">{new Date(kycStatus.created_date).toLocaleDateString('id-ID')}</span></div>}
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus?.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-6 pb-20">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-white font-bold text-2xl">Verifikasi Belum Berhasil</h1>
          <p className="text-slate-300">{kycStatus.rejectionReason || 'Data verifikasi belum dapat diterima.'}</p>
          <p className="text-slate-400 text-sm">Silakan periksa kembali data dan dokumen sebelum mengirim ulang.</p>
          <button
            onClick={() => setKycStatus(null)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Kirim Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pb-20 space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
          <div>
            <h2 className="text-white font-bold mb-1">Verifikasi Identitas</h2>
            <p className="text-blue-300 text-sm">
              Verifikasi identitas membantu menjaga integritas akun dan mendukung fitur keamanan serta kepatuhan yang tersedia pada platform.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4">Dokumen yang mungkin diperlukan:</h3>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>✓ Identitas resmi yang didukung penyedia verifikasi</li>
          <li>✓ Foto dokumen yang jelas dan dapat dibaca</li>
          <li>✓ Pemeriksaan wajah/selfie bila diminta</li>
          <li>✓ Informasi tambahan sesuai proses verifikasi</li>
        </ul>
      </div>

      <KYCForm onComplete={() => fetchKYCStatus()} />

      <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
        <p className="text-slate-500 text-xs text-center mb-3">Prinsip transparansi dan keamanan data</p>
        <TrustBadges />
      </div>
    </div>
  );
}
