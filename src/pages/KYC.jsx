import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Upload, CheckCircle2, Clock, AlertCircle, User, Camera, FileText, Loader2, ArrowLeft, Phone, ChevronRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STEPS = [
  { id: 'identity', label: 'Data Diri', icon: User },
  { id: 'document', label: 'Dokumen', icon: FileText },
  { id: 'selfie', label: 'Selfie', icon: Camera },
];

const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
  'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung',
  'DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat',
  'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan'
];

const BENEFITS = [
  { icon: '💳', title: 'Limit Lebih Tinggi', desc: 'Deposit & withdraw hingga Rp 500 juta/hari' },
  { icon: '🏦', title: 'Semua Metode Pembayaran', desc: 'Bank transfer, QRIS, e-wallet aktif penuh' },
  { icon: '🤝', title: 'P2P Lending', desc: 'Akses fitur pinjam & investasi kripto' },
  { icon: '🔒', title: 'Akun Lebih Aman', desc: 'Perlindungan identitas & anti-fraud aktif' },
];

export default function KYC() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('identity');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: '', idType: 'ktp', nik: '', birthDate: '', phone: '', address: '', province: '', occupation: '',
  });
  const [ktpFile, setKtpFile] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      // Auto-fill as much as possible from user profile
      setForm(f => ({
        ...f,
        fullName: u.full_name || u.kycData?.fullName || '',
        phone: u.phone || u.kycData?.phone || '',
        address: u.kycData?.address || '',
        province: u.kycData?.province || '',
        nik: u.kycData?.nik || '',
        birthDate: u.kycData?.birthDate || '',
        occupation: u.kycData?.occupation || '',
      }));
      // Check KYCVerification entity as source of truth
      try {
        const records = await base44.entities.KYCVerification.filter({ userEmail: u.email }, '-created_date', 1);
        if (records && records.length > 0) {
          const latest = records[0];
          if (latest.status === 'verified') {
            await base44.auth.updateMe({ kycStatus: 'approved' });
            setUser(prev => ({ ...prev, kycStatus: 'approved' }));
          } else if (latest.status === 'pending' || latest.status === 'rejected') {
            await base44.auth.updateMe({ kycStatus: latest.status === 'rejected' ? 'rejected' : 'pending' });
            setSubmitted(true);
          }
        } else if (u.kycStatus === 'approved' || u.kycStatus === 'pending') {
          setSubmitted(true);
        }
      } catch {
        if (u.kycStatus === 'approved' || u.kycStatus === 'pending') setSubmitted(true);
      }
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
    let ktpUrl = null, selfieUrl = null;
    if (ktpFile) { const r = await base44.integrations.Core.UploadFile({ file: ktpFile }); ktpUrl = r.file_url; }
    if (selfieFile) { const r = await base44.integrations.Core.UploadFile({ file: selfieFile }); selfieUrl = r.file_url; }

    // Save to KYCVerification entity (for admin review)
    await base44.entities.KYCVerification.create({
      userEmail: user.email,
      fullName: form.fullName,
      idType: form.idType || 'ktp',
      idNumber: form.nik,
      dateOfBirth: form.birthDate,
      nationality: 'ID',
      address: form.address,
      province: form.province,
      phoneNumber: form.phone,
      idPhotoUrl: ktpUrl,
      selfieUrl: selfieUrl,
      verificationLevel: 'intermediate',
      status: 'pending',
      withdrawalLimit: 0,
    });

    // Update user status
    await base44.auth.updateMe({ kycStatus: 'pending', kycData: { ...form, ktpUrl, selfieUrl, submittedAt: new Date().toISOString() } });

    // Notify admin
    await base44.integrations.Core.SendEmail({
      to: 'sinaga28081981@gmail.com',
      subject: '📋 KYC Baru Menunggu Review — KriptoAman',
      body: `<h2>KYC Submission Baru</h2><p>Nama: <strong>${form.fullName}</strong></p><p>NIK: ${form.nik}</p><p>Email: ${user.email}</p><p>Silakan login ke dashboard admin untuk mereview.</p>`
    });

    setSubmitted(true);
    setLoading(false);
  };

  const kycStatus = user?.kycStatus;

  // KYC Approved
  if (kycStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 px-4 pt-6">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Link to={createPageUrl('Profile')} className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>
            <h1 className="text-white font-bold text-lg">Verifikasi KYC</h1>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-3xl p-6 text-center space-y-3">
            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto text-4xl">
              🎉
            </div>
            <h2 className="text-2xl font-bold text-white">KYC Terverifikasi!</h2>
            <p className="text-slate-400 text-sm">Identitas Anda telah diverifikasi oleh tim KriptoAman.</p>
            <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-green-300 font-bold text-sm">Level 2 — Full Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3.5">
                <span className="text-2xl">{b.icon}</span>
                <p className="text-white text-xs font-bold mt-2">{b.title}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>

          <Link to={createPageUrl('Wallet')} className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-center transition-colors">
            Kembali ke Wallet →
          </Link>
        </div>
      </div>
    );
  }

  // KYC Pending
  if (kycStatus === 'pending' || submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 px-4 pt-6">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Link to={createPageUrl('Profile')} className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>
            <h1 className="text-white font-bold text-lg">Status KYC</h1>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border border-yellow-500/30 rounded-3xl p-6 text-center space-y-3">
            <div className="w-20 h-20 bg-yellow-500/20 border border-yellow-500/30 rounded-3xl flex items-center justify-center mx-auto text-4xl">
              ⏳
            </div>
            <h2 className="text-2xl font-bold text-white">Sedang Diproses</h2>
            <p className="text-slate-400 text-sm">Data KYC Anda sedang dalam verifikasi oleh tim kami. Estimasi 1×24 jam kerja.</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-3">
            <p className="text-slate-300 font-semibold text-sm">📋 Checklist Verifikasi</p>
            {['Data Diri Terkirim ✓', 'Dokumen KTP/Paspor Diunggah ✓', 'Foto Selfie Diunggah ✓', 'Dalam Review Tim KYC…'].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < 3 ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <Clock className="w-4 h-4 text-yellow-400 animate-pulse shrink-0" />}
                <span className={`text-sm ${i < 3 ? 'text-green-300' : 'text-yellow-300'}`}>{s}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <p className="text-blue-300 text-xs">💡 Anda akan mendapat notifikasi email setelah verifikasi selesai. Jika ada pertanyaan, hubungi support kami.</p>
          </div>
        </div>
      </div>
    );
  }

  // KYC Form
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
            <p className="text-slate-500 text-xs">Diperlukan sesuai regulasi Bappebti & OJK</p>
          </div>
        </div>

        {/* Welcome Banner for new user */}
        {!user?.kycStatus && (
          <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">👋</span>
            <div>
              <p className="text-white font-bold text-sm">Halo, {user?.full_name?.split(' ')[0] || 'Pengguna'}!</p>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Verifikasi KYC hanya butuh <strong className="text-white">3 langkah mudah</strong> dan selesai dalam <strong className="text-white">5 menit</strong>. Data Anda sudah kami isi sebagian!
              </p>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-2">
          {BENEFITS.map(b => (
            <div key={b.title} className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5">
              <span className="text-lg">{b.icon}</span>
              <p className="text-slate-300 text-[10px] font-semibold leading-tight">{b.title}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-slate-400 text-xs leading-relaxed">Data Anda dienkripsi dan hanya digunakan untuk verifikasi identitas sesuai regulasi. Tidak dibagikan ke pihak ketiga.</p>
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${isDone ? 'bg-green-500 border-green-400' : isActive ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-slate-700'}`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-white" /> : <s.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />}
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-400' : isDone ? 'text-green-400' : 'text-slate-600'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${isDone ? 'bg-green-500' : 'bg-slate-700'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Identity */}
        {step === 'identity' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Data Diri</h2>
              {user?.full_name && (
                <button
                  onClick={() => setForm(f => ({
                    ...f,
                    fullName: user.full_name || f.fullName,
                    phone: user.phone || f.phone,
                  }))}
                  className="text-xs text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 rounded-full hover:bg-indigo-500/20 transition-colors"
                >
                  ✨ Isi dari Akun
                </button>
              )}
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Jenis Dokumen <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'ktp', label: 'KTP' },
                  { value: 'passport', label: 'Passport' },
                  { value: 'sim', label: 'SIM' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, idType: opt.value }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      form.idType === opt.value
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: 'Nama Lengkap', placeholder: 'Nama sesuai dokumen', key: 'fullName', required: true },
              {
                label: form.idType === 'passport' ? 'Nomor Passport' : form.idType === 'sim' ? 'Nomor SIM' : 'NIK (16 digit)',
                key: 'nik',
                placeholder: form.idType === 'passport' ? 'A1234567' : form.idType === 'sim' ? '1234567890123' : '3273XXXXXXXXXXXX',
                type: 'tel',
                required: true
              },
              { label: 'Tanggal Lahir', key: 'birthDate', type: 'date', required: true },
              { label: 'Nomor HP Aktif', key: 'phone', placeholder: '+62812XXXXXXXX', required: true },
              { label: 'Alamat Lengkap', key: 'address', placeholder: 'Jl. Nama Jalan No. RT/RW Kel. Kec.' },
              { label: 'Pekerjaan', key: 'occupation', placeholder: 'Karyawan / Wirausaha / dll' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-slate-400 text-xs mb-1.5 block">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type={field.type || 'text'}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Provinsi <span className="text-red-400">*</span></label>
              <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Pilih Provinsi --</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button
              onClick={() => setStep('document')}
              disabled={!form.fullName || !form.nik || !form.birthDate || !form.phone}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
              Lanjut: Upload Dokumen <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Document */}
        {step === 'document' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Upload {form.idType === 'passport' ? 'Passport' : form.idType === 'sim' ? 'SIM' : 'KTP'}</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300 space-y-1">
              <p>📋 <strong>Pastikan foto:</strong></p>
              <p>• Seluruh kartu terlihat jelas, tidak terpotong</p>
              <p>• Tidak buram atau silau</p>
              <p>• Tulisan dapat dibaca dengan jelas</p>
            </div>

            {ktpPreview ? (
              <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-2">
                <img src={ktpPreview} alt="KTP" className="w-full h-52 object-cover rounded-xl" />
                <button onClick={() => { setKtpFile(null); setKtpPreview(null); }} className="text-red-400 text-xs w-full text-center py-1">🗑️ Hapus & ganti foto</button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Kamera HP */}
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={e => handleFileChange(e, 'ktp')} className="hidden" id="ktpCamera" />
                  <div className="w-full py-4 bg-blue-600/15 border border-blue-500/30 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-600/25 active:scale-95 transition-all">
                    <Camera className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-blue-300 text-sm font-bold">Ambil Foto dengan Kamera</p>
                      <p className="text-blue-500 text-xs">Gunakan kamera HP langsung</p>
                    </div>
                  </div>
                </label>
                {/* Galeri / Upload */}
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'ktp')} className="hidden" id="ktpGallery" />
                  <div className="w-full py-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-700/50 active:scale-95 transition-all">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-slate-300 text-sm font-bold">Pilih dari Galeri</p>
                      <p className="text-slate-500 text-xs">JPG, PNG, HEIC · Maks 10MB</p>
                    </div>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('identity')} className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-2xl hover:bg-slate-700 transition-colors">← Kembali</button>
              <button onClick={() => setStep('selfie')} disabled={!ktpFile}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
                Lanjut: Selfie <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Selfie */}
        {step === 'selfie' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Foto Selfie + {form.idType === 'passport' ? 'Passport' : form.idType === 'sim' ? 'SIM' : 'KTP'}</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300 space-y-1">
              <p>📸 <strong>Panduan selfie:</strong></p>
              <p>• Pegang dokumen identitas di samping wajah Anda</p>
              <p>• Pastikan wajah & tulisan dokumen terlihat jelas</p>
              <p>• Gunakan pencahayaan yang cukup</p>
              <p>• Lepas masker, kacamata hitam, topi</p>
            </div>

            {selfiePreview ? (
              <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-2">
                <img src={selfiePreview} alt="Selfie" className="w-full h-52 object-cover rounded-xl" />
                <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} className="text-red-400 text-xs w-full text-center py-1">🗑️ Hapus & ambil foto ulang</button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Kamera depan (selfie) */}
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" capture="user" onChange={e => handleFileChange(e, 'selfie')} className="hidden" id="selfieCamera" />
                  <div className="w-full py-4 bg-violet-600/15 border border-violet-500/30 rounded-2xl flex items-center justify-center gap-3 hover:bg-violet-600/25 active:scale-95 transition-all">
                    <Camera className="w-5 h-5 text-violet-400" />
                    <div>
                      <p className="text-violet-300 text-sm font-bold">Ambil Selfie dengan Kamera Depan</p>
                      <p className="text-violet-500 text-xs">Kamera depan HP otomatis aktif</p>
                    </div>
                  </div>
                </label>
                {/* Galeri */}
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'selfie')} className="hidden" id="selfieGallery" />
                  <div className="w-full py-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-700/50 active:scale-95 transition-all">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-slate-300 text-sm font-bold">Pilih dari Galeri</p>
                      <p className="text-slate-500 text-xs">JPG, PNG, HEIC · Maks 10MB</p>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Summary before submit */}
            {selfiePreview && (
              <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 space-y-1">
                <p className="text-slate-400 text-xs font-semibold mb-2">📋 Ringkasan Data</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <span className="text-slate-500">Nama:</span><span className="text-white">{form.fullName}</span>
                  <span className="text-slate-500">{form.idType === 'passport' ? 'Passport:' : form.idType === 'sim' ? 'SIM:' : 'NIK:'}</span><span className="text-white">{form.nik?.slice(0, 4)}••••••••••••</span>
                  <span className="text-slate-500">Provinsi:</span><span className="text-white">{form.province || '—'}</span>
                  <span className="text-slate-500">HP:</span><span className="text-white">{form.phone}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('document')} className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-2xl hover:bg-slate-700 transition-colors">← Kembali</button>
              <button onClick={handleSubmit} disabled={!selfieFile || loading}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? 'Mengirim...' : 'Kirim Verifikasi'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}