import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Upload, CheckCircle2, Clock, AlertCircle, User, Camera, FileText, Loader2, ArrowLeft, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STEPS = [
  { id: 'identity', label: 'Data Diri', icon: User },
  { id: 'document', label: 'Dokumen', icon: FileText },
  { id: 'selfie', label: 'Selfie', icon: Camera },
];

export default function KYC() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('identity');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    nik: '',
    birthDate: '',
    phone: '',
    address: '',
    province: '',
  });
  const [ktpFile, setKtpFile] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm(f => ({ ...f, fullName: u.full_name || '', phone: u.phone || '' }));
      if (u.kycStatus === 'approved' || u.kycStatus === 'pending') setSubmitted(true);
    }).catch(() => {});
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'ktp') { setKtpFile(file); setKtpPreview(url); }
    else { setSelfieFile(file); setSelfiePreview(url); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    let ktpUrl = null;
    let selfieUrl = null;

    if (ktpFile) {
      const res = await base44.integrations.Core.UploadFile({ file: ktpFile });
      ktpUrl = res.file_url;
    }
    if (selfieFile) {
      const res = await base44.integrations.Core.UploadFile({ file: selfieFile });
      selfieUrl = res.file_url;
    }

    await base44.auth.updateMe({
      kycStatus: 'pending',
      kycData: { ...form, ktpUrl, selfieUrl, submittedAt: new Date().toISOString() }
    });

    setSubmitted(true);
    setLoading(false);
  };

  const kycStatus = user?.kycStatus;

  if (kycStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 px-4 pt-6">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">KYC Terverifikasi!</h1>
          <p className="text-slate-400">Identitas Anda telah diverifikasi. Semua fitur platform aktif.</p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
            <p className="text-green-400 font-semibold text-sm">✓ Level 2 — Full Access</p>
            <p className="text-slate-400 text-xs mt-1">Limit penarikan: Rp 500 juta/hari</p>
          </div>
          <Link to={createPageUrl('Wallet')} className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors">
            Kembali ke Wallet
          </Link>
        </div>
      </div>
    );
  }

  if (kycStatus === 'pending' || submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 px-4 pt-6">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="w-20 h-20 bg-yellow-500/20 border border-yellow-500/30 rounded-3xl flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sedang Diproses</h1>
          <p className="text-slate-400">Data KYC Anda sedang dalam proses verifikasi oleh tim kami. Biasanya 1×24 jam kerja.</p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-left space-y-2">
            <p className="text-yellow-400 font-semibold text-sm">📋 Status Verifikasi</p>
            <div className="space-y-1.5">
              {['Data Diri Diterima', 'Dokumen KTP Diunggah', 'Selfie Diunggah', 'Dalam Review Tim'].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {i < 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />}
                  <span className={i < 3 ? 'text-green-400' : 'text-yellow-400'}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Profile')} className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg">Verifikasi Identitas (KYC)</h1>
            <p className="text-slate-500 text-xs">Diperlukan untuk fitur lengkap platform</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 font-semibold text-sm">Mengapa perlu KYC?</p>
              <p className="text-slate-400 text-xs mt-1">Sesuai regulasi Bappebti & OJK, verifikasi identitas diperlukan untuk deposit/withdraw IDR dan meningkatkan limit transaksi.</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {STEPS.map((s, i) => {
            const stepIds = STEPS.map(x => x.id);
            const currentIdx = stepIds.indexOf(step);
            const isActive = s.id === step;
            const isDone = stepIds.indexOf(s.id) < currentIdx;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isDone ? 'bg-green-500 border-green-500' : isActive ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4 text-white" /> : <s.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />}
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-400' : isDone ? 'text-green-400' : 'text-slate-600'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-green-500' : 'bg-slate-700'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step: Identity */}
        {step === 'identity' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Data Diri</h2>
            {[
              { label: 'Nama Lengkap (sesuai KTP)', key: 'fullName', placeholder: 'Nama sesuai KTP' },
              { label: 'NIK (16 digit)', key: 'nik', placeholder: '3273XXXXXXXXXXXX', type: 'number' },
              { label: 'Tanggal Lahir', key: 'birthDate', type: 'date' },
              { label: 'Nomor HP', key: 'phone', placeholder: '+62812XXXXXXXX' },
              { label: 'Alamat Lengkap', key: 'address', placeholder: 'Jl. ...' },
              { label: 'Provinsi', key: 'province', placeholder: 'DKI Jakarta' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-slate-400 text-xs mb-1 block">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
            <button
              onClick={() => setStep('document')}
              disabled={!form.fullName || !form.nik || !form.birthDate}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors"
            >
              Lanjut → Upload KTP
            </button>
          </div>
        )}

        {/* Step: Document */}
        {step === 'document' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Upload KTP / Paspor</h2>
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4">
              <p className="text-slate-400 text-xs mb-3">Pastikan foto jelas, tidak buram, dan seluruh kartu terlihat</p>
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'ktp')} className="hidden" />
                {ktpPreview ? (
                  <img src={ktpPreview} alt="KTP" className="w-full h-48 object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-48 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 text-slate-500" />
                    <p className="text-slate-500 text-sm">Tap untuk upload foto KTP</p>
                    <p className="text-slate-600 text-xs">JPG, PNG, HEIC • Maks 10MB</p>
                  </div>
                )}
              </label>
              {ktpPreview && (
                <button onClick={() => { setKtpFile(null); setKtpPreview(null); }} className="mt-2 text-red-400 text-xs">Hapus & ganti foto</button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('identity')} className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-2xl">← Kembali</button>
              <button
                onClick={() => setStep('selfie')}
                disabled={!ktpFile}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-2xl"
              >
                Lanjut → Selfie
              </button>
            </div>
          </div>
        )}

        {/* Step: Selfie */}
        {step === 'selfie' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Foto Selfie + KTP</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300">
              📸 Pegang KTP di samping wajah Anda. Pastikan wajah dan tulisan KTP terlihat jelas.
            </div>
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4">
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" capture="user" onChange={e => handleFileChange(e, 'selfie')} className="hidden" />
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie" className="w-full h-48 object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-48 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 transition-colors">
                    <Camera className="w-8 h-8 text-slate-500" />
                    <p className="text-slate-500 text-sm">Tap untuk selfie dengan KTP</p>
                  </div>
                )}
              </label>
              {selfiePreview && (
                <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} className="mt-2 text-red-400 text-xs">Hapus & ganti foto</button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('document')} className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-2xl">← Kembali</button>
              <button
                onClick={handleSubmit}
                disabled={!selfieFile || loading}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Mengirim...' : 'Kirim Verifikasi ✓'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}