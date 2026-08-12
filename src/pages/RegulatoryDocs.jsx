import React from 'react';
import { AlertTriangle, Building2, FileCheck2, ShieldCheck } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const ITEMS = [
  {
    icon: Building2,
    title: 'Identitas perusahaan',
    text: 'Informasi badan usaha dapat ditampilkan setelah dicocokkan dengan dokumen perusahaan yang sah. Informasi badan usaha tidak otomatis berarti izin untuk menjalankan layanan keuangan atau perdagangan aset kripto.',
  },
  {
    icon: FileCheck2,
    title: 'Lisensi dan registrasi',
    text: 'Nomor lisensi, status registrasi regulator, tanggal persetujuan, dan masa berlaku hanya akan dipublikasikan setelah dokumen resmi dan sumber penerbitnya dapat diverifikasi.',
  },
  {
    icon: ShieldCheck,
    title: 'Sertifikasi dan audit',
    text: 'Klaim ISO, PCI DSS, audit eksternal, asuransi, cold storage, atau sertifikasi pihak ketiga tidak ditampilkan sebagai aktif tanpa bukti yang dapat diverifikasi.',
  },
];

export default function RegulatoryDocs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-28 text-white">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div className="flex items-center gap-3">
          <KriptoAmanLogo size={42} showText={false} />
          <div>
            <p className="text-blue-300 text-xs font-bold uppercase tracking-wider">Transparansi Dokumen</p>
            <h1 className="text-2xl md:text-3xl font-bold">Status Regulasi & Dokumen</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-700/40 bg-amber-900/15 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-amber-200">Tidak ada klaim persetujuan otomatis</h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Pengajuan, persiapan dokumen, proses sandbox, pendaftaran perusahaan, atau integrasi KYC tidak boleh ditafsirkan sebagai persetujuan regulator. KriptoAman hanya akan menyatakan status lisensi atau sertifikasi apabila bukti resmi dapat diverifikasi.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {ITEMS.map(({ icon: Icon, title, text }) => (
            <section key={title} className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold">{title}</h2>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{text}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5">
          <h2 className="font-bold">Kemampuan rilis publik saat ini</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Rilis publik difokuskan pada informasi dan pemantauan: data pasar, analisis risiko indikatif, autentikasi akun, KYC melalui penyedia eksternal ketika siap, serta koneksi alamat publik EVM dan Solana dalam mode read-only. Fitur transaksi, kustodian, atau layanan keuangan tidak dianggap aktif hanya karena terdapat kode eksperimental atau dokumen persiapan di repository.
          </p>
        </section>
      </div>
    </div>
  );
}
