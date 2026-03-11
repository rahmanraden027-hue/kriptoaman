import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Camera, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function KYCForm({ onComplete }) {
  const [step, setStep] = useState('personal'); // personal | documents | selfie | review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    idType: 'ktp',
    idNumber: '',
    dateOfBirth: '',
    nationality: 'ID',
    address: '',
    city: '',
    province: '',
    phoneNumber: ''
  });

  const [files, setFiles] = useState({
    idPhoto: null,
    selfie: null
  });

  const [preview, setPreview] = useState({
    idPhoto: null,
    selfie: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File harus < 5MB');
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
    const reader = new FileReader();
    reader.onload = () => setPreview(prev => ({ ...prev, [type]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Upload files
      let idPhotoUrl = '', selfieUrl = '';
      
      if (files.idPhoto) {
        const idRes = await base44.integrations.Core.UploadFile({ file: files.idPhoto });
        idPhotoUrl = idRes.file_url;
      }

      if (files.selfie) {
        const selfieRes = await base44.integrations.Core.UploadFile({ file: files.selfie });
        selfieUrl = selfieRes.file_url;
      }

      // Create KYC record
      const user = await base44.auth.me();
      const kycRes = await base44.entities.KYCVerification.create({
        userEmail: user.email,
        fullName: formData.fullName,
        idType: formData.idType,
        idNumber: formData.idNumber,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        phoneNumber: formData.phoneNumber,
        idPhotoUrl,
        selfieUrl,
        verificationLevel: 'intermediate',
        status: 'pending'
      });

      setLoading(false);
      onComplete(kycRes.data.id);
    } catch (err) {
      setError('Upload gagal: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      
      {/* Step Indicator */}
      <div className="flex gap-2">
        {['personal', 'documents', 'selfie', 'review'].map((s, idx) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${['personal', 'documents', 'selfie', 'review'].indexOf(step) >= idx ? 'bg-blue-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {/* Personal Info */}
      {step === 'personal' && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Data Pribadi</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Nama Lengkap (sesuai KTP)</label>
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Nama lengkap"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">Tipe Identitas</label>
                <select
                  name="idType"
                  value={formData.idType}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="ktp">KTP</option>
                  <option value="passport">Passport</option>
                  <option value="sim">SIM</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">Nomor Identitas</label>
                <Input
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  placeholder="Nomor"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Tanggal Lahir</label>
              <Input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Alamat</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Alamat lengkap"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Kota"
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Input
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                placeholder="Provinsi"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <Input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="+62..."
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <Button onClick={() => setStep('documents')} className="w-full bg-blue-600 hover:bg-blue-700">Lanjut Upload Dokumen</Button>
        </div>
      )}

      {/* Documents */}
      {step === 'documents' && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Upload Dokumen Identitas</h3>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300 text-xs">Foto harus jelas, tidak ada blur/cahaya berlebih. File max 5MB.</p>
          </div>

          <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange('idPhoto')}
              className="hidden"
              id="idPhotoInput"
            />
            <label htmlFor="idPhotoInput" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-300 text-sm font-medium">Upload Foto Identitas</p>
              {preview.idPhoto && <img src={preview.idPhoto} alt="ID" className="w-32 h-32 mx-auto mt-2 rounded-lg object-cover" />}
            </label>
          </div>

          <Button onClick={() => setStep('selfie')} className="w-full bg-blue-600 hover:bg-blue-700">Lanjut Ke Selfie</Button>
        </div>
      )}

      {/* Selfie */}
      {step === 'selfie' && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Foto Selfie dengan Identitas</h3>
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">Pegang identitas di sebelah wajah. Harus terlihat kedua sisi wajah dan identitas Anda.</p>
          </div>

          <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange('selfie')}
              className="hidden"
              id="selfieInput"
            />
            <label htmlFor="selfieInput" className="cursor-pointer block">
              <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-300 text-sm font-medium">Upload Foto Selfie</p>
              {preview.selfie && <img src={preview.selfie} alt="Selfie" className="w-32 h-32 mx-auto mt-2 rounded-lg object-cover" />}
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep('documents')} variant="outline" className="flex-1 border-slate-700 text-slate-300">Kembali</Button>
            <Button onClick={() => setStep('review')} className="flex-1 bg-blue-600 hover:bg-blue-700">Review</Button>
          </div>
        </div>
      )}

      {/* Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Review Data KYC</h3>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Nama:</span><span className="text-white font-medium">{formData.fullName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">ID:</span><span className="text-white font-medium">{formData.idType.toUpperCase()} - {formData.idNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Alamat:</span><span className="text-white font-medium">{formData.city}, {formData.province}</span></div>
          </div>

          {error && (
            <div className="flex gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Kirim Verifikasi KYC'}
          </Button>
        </div>
      )}
    </div>
  );
}