import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Mail, Calendar, Hash, Star, LogOut, Edit3, Save, X, Loader2, Shield, Phone, Gift, FileCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({ full_name: u?.full_name || '', phone: u?.phone || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setUser(u => ({ ...u, ...form }));
    setSaved(true);
    setEditing(false);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  const memberSince = user?.created_date
    ? new Date(user.created_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-slate-400 mb-4">Anda belum login</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-600 hover:bg-blue-700">Login Sekarang</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Hero Card */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30" />
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative p-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 text-white text-3xl font-bold mx-auto mb-4">
              {initials}
            </div>
            <h1 className="text-2xl font-bold text-white">{user.full_name || 'Pengguna'}</h1>
            <p className="text-slate-400 text-sm mt-1">{user.email}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full font-semibold capitalize">
                {user.role || 'user'}
              </span>
              <span className="text-[11px] bg-green-500/15 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full font-semibold">
                ● Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: 'Member Sejak', value: memberSince },
            { icon: Hash, label: 'User ID', value: `#${user?.id?.slice(-6) || '—'}` },
            { icon: Star, label: 'Tier', value: 'Standard' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3 text-center">
              <stat.icon className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
              <p className="text-white text-xs font-bold truncate">{stat.value}</p>
              <p className="text-slate-500 text-[10px] truncate">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Informasi Akun</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-blue-400 text-xs hover:text-blue-300">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-slate-500 text-xs mb-1 block">Nama Lengkap</label>
              {editing ? (
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-white text-sm">{user.full_name || '—'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-500 text-xs mb-1 block">Email</label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-white text-sm">{user.email}</span>
                <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full">Terverifikasi</span>
              </div>
            </div>

            <div>
              <label className="text-slate-500 text-xs mb-1 block">Nomor Telepon</label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+62..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-white text-sm">{user.phone || '—'}</span>
                </div>
              )}
            </div>
          </div>

          {editing && (
            <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Perubahan
            </Button>
          )}

          {saved && (
            <div className="bg-green-500/15 border border-green-500/30 rounded-xl px-4 py-2.5 text-green-400 text-sm text-center">
              ✓ Profil berhasil diperbarui!
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <h2 className="text-white font-semibold">Keamanan</h2>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Password</span>
              <span className="text-green-400 text-xs">● Terlindungi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Status KYC</span>
              <span className={`text-xs capitalize font-semibold ${user.kycStatus === 'approved' ? 'text-green-400' : user.kycStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                {user.kycStatus === 'approved' ? '✓ Terverifikasi' : user.kycStatus === 'pending' ? '⏳ Menunggu Review' : '✗ Belum Verifikasi'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Role</span>
              <span className="text-blue-400 text-xs capitalize">{user.role || 'user'}</span>
            </div>
          </div>
        </div>

        {/* KYC & Referral shortcuts */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('KYC')}
            className={`flex items-center gap-2.5 p-3.5 border rounded-2xl transition-all ${user.kycStatus === 'approved' ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15'}`}>
            <FileCheck className={`w-5 h-5 shrink-0 ${user.kycStatus === 'approved' ? 'text-green-400' : 'text-yellow-400'}`} />
            <div>
              <p className={`text-sm font-semibold ${user.kycStatus === 'approved' ? 'text-green-300' : 'text-yellow-300'}`}>
                {user.kycStatus === 'approved' ? 'KYC Aktif ✓' : 'Verifikasi KYC'}
              </p>
              <p className="text-slate-500 text-[10px]">{user.kycStatus === 'approved' ? 'Full access' : 'Aktifkan limit penuh'}</p>
            </div>
          </Link>
          <Link to={createPageUrl('Referral')}
            className="flex items-center gap-2.5 p-3.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl hover:bg-orange-500/15 transition-all">
            <Gift className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <p className="text-orange-300 text-sm font-semibold">Referral</p>
              <p className="text-slate-500 text-[10px]">Undang teman, dapat bonus</p>
            </div>
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={() => base44.auth.logout()}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 hover:bg-red-500/15 transition-colors font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Keluar dari Akun
        </button>

      </div>
    </div>
  );
}