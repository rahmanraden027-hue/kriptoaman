import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Mail, Calendar, Hash, Star, LogOut, Edit3, Save, X, Loader2, Shield, Phone, Gift, FileCheck, Bell, Globe2, MonitorSmartphone, Fingerprint, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import DeleteAccount from '@/components/mobile/DeleteAccount';

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

  const memberSince = user?.created_date
    ? new Date(user.created_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  if (loading) return <div className="ka-bg min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-300" /></div>;
  if (!user) return <div className="ka-bg min-h-screen flex items-center justify-center p-4"><div className="text-center"><p className="text-slate-400 mb-4">Anda belum login</p><Button onClick={() => base44.auth.redirectToLogin()} className="bg-sky-600 hover:bg-sky-500">Login Sekarang</Button></div></div>;

  return (
    <div className="ka-bg min-h-screen" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-sky-400/15 bg-[#071423]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,.3)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(56,189,248,.18),transparent_28%),radial-gradient(circle_at_15%_90%,rgba(139,92,246,.13),transparent_32%)]" />
          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[26px] border border-sky-400/25 bg-slate-950/60 shadow-[0_0_45px_rgba(56,189,248,.16)]"><KriptoAmanLogo size={76} showText={false} /></div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-center gap-2 text-sky-300 sm:justify-start"><Fingerprint className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[0.2em]">KRIPTOAMAN IDENTITY CENTER</span></div>
              <h1 className="break-words text-2xl font-extrabold text-white sm:text-3xl">{user.full_name || 'Pengguna'}</h1>
              <p className="mt-1 break-all text-sm text-slate-400">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start"><span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-sky-300">{user.role || 'user'}</span><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">● Aktif</span></div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-3">
          {[{ icon: Calendar, label: 'Member Sejak', value: memberSince },{ icon: Hash, label: 'User ID', value: `#${user?.id?.slice(-6) || '—'}` },{ icon: Star, label: 'Tier', value: 'Standard' }].map(stat => (
            <div key={stat.label} className="ka-surface min-w-0 p-3 text-center"><stat.icon className="mx-auto mb-1.5 h-4 w-4 text-cyan-300" /><p className="truncate text-xs font-bold text-white">{stat.value}</p><p className="truncate text-[10px] text-slate-500">{stat.label}</p></div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <section className="ka-surface p-5 lg:col-span-7">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold tracking-[0.18em] text-cyan-300">ACCOUNT CORE</p><h2 className="mt-1 font-semibold text-white">Informasi Akun</h2></div>{!editing ? <button onClick={() => setEditing(true)} className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs text-sky-300 hover:bg-sky-500/10"><Edit3 className="h-3.5 w-3.5" /> Edit</button> : <button onClick={() => setEditing(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>}</div>
            <div className="mt-4 space-y-4">
              <div><label className="mb-1 block text-xs text-slate-500">Nama Lengkap</label>{editing ? <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full rounded-xl border border-sky-400/15 bg-slate-950/60 px-3 py-2 text-sm text-white" /> : <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-500" /><span className="text-sm text-white">{user.full_name || '—'}</span></div>}</div>
              <div><label className="mb-1 block text-xs text-slate-500">Email</label><div className="flex min-w-0 items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span className="min-w-0 flex-1 break-all text-sm text-white">{user.email}</span><span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">Terverifikasi</span></div></div>
              <div><label className="mb-1 block text-xs text-slate-500">Nomor Telepon</label>{editing ? <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+62..." className="w-full rounded-xl border border-sky-400/15 bg-slate-950/60 px-3 py-2 text-sm text-white" /> : <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" /><span className="break-all text-sm text-white">{user.phone || '—'}</span></div>}</div>
            </div>
            {editing && <Button onClick={handleSave} disabled={saving} className="mt-5 w-full min-h-11 bg-sky-600 hover:bg-sky-500">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Simpan Perubahan</Button>}
            {saved && <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-center text-sm text-emerald-400">✓ Profil berhasil diperbarui!</div>}
          </section>

          <section className="ka-surface p-5 lg:col-span-5">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-violet-300" /><div><p className="text-[10px] font-extrabold tracking-[0.18em] text-violet-300">SECURITY POSTURE</p><h2 className="mt-1 font-semibold text-white">Keamanan</h2></div></div>
            <div className="mt-4 space-y-3"><div className="flex items-center justify-between gap-3 rounded-xl border border-sky-400/10 bg-slate-950/35 p-3"><span className="text-sm text-slate-400">Password</span><span className="text-xs text-emerald-400">● Terlindungi</span></div><div className="flex items-center justify-between gap-3 rounded-xl border border-sky-400/10 bg-slate-950/35 p-3"><span className="text-sm text-slate-400">Status KYC</span><span className={`text-right text-xs capitalize font-semibold ${user.kycStatus === 'approved' ? 'text-emerald-400' : user.kycStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>{user.kycStatus === 'approved' ? '✓ Terverifikasi' : user.kycStatus === 'pending' ? '⏳ Menunggu Review' : '✗ Belum Verifikasi'}</span></div><div className="flex items-center justify-between gap-3 rounded-xl border border-sky-400/10 bg-slate-950/35 p-3"><span className="text-sm text-slate-400">Peran sistem</span><span className="text-right text-xs capitalize text-sky-300">{user.role || 'user'}</span></div></div>
          </section>
        </div>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Preferensi dan keamanan">
          {[{ icon: Globe2, title: 'Bahasa & mata uang', body: 'Gunakan pemilih ID/EN di bagian atas aplikasi.' },{ icon: MonitorSmartphone, title: 'Sesi perangkat', body: 'Keluar dari akun bila perangkat digunakan bersama.' },{ icon: Bell, title: 'Notifikasi', body: typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Notifikasi browser diizinkan.' : 'Izin notifikasi belum diberikan.' }].map(({ icon: Icon, title, body }) => <div key={title} className="ka-surface p-4"><Icon className="h-5 w-5 text-cyan-300" /><h2 className="mt-3 text-sm font-bold text-white">{title}</h2><p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p></div>)}
        </section>

        <div className="grid grid-cols-2 gap-3"><Link to={createPageUrl('KYC')} className={`flex min-h-20 items-center gap-2.5 rounded-2xl border p-3.5 transition ${user.kycStatus === 'approved' ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/15'}`}><FileCheck className={`h-5 w-5 shrink-0 ${user.kycStatus === 'approved' ? 'text-emerald-400' : 'text-yellow-400'}`} /><div className="min-w-0"><p className={`text-sm font-semibold ${user.kycStatus === 'approved' ? 'text-emerald-300' : 'text-yellow-300'}`}>{user.kycStatus === 'approved' ? 'KYC Aktif ✓' : 'Verifikasi KYC'}</p><p className="text-[10px] leading-relaxed text-slate-500">{user.kycStatus === 'approved' ? 'Identitas terverifikasi' : 'Lengkapi verifikasi identitas'}</p></div></Link><Link to={createPageUrl('Referral')} className="flex min-h-20 items-center gap-2.5 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3.5 transition hover:bg-violet-500/15"><Gift className="h-5 w-5 shrink-0 text-violet-300" /><div className="min-w-0"><p className="text-sm font-semibold text-violet-300">Referral</p><p className="text-[10px] leading-relaxed text-slate-500">Undang teman, dapat bonus</p></div></Link></div>

        <button onClick={() => base44.auth.logout()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3.5 font-semibold text-red-400 transition hover:bg-red-500/15"><LogOut className="h-4 w-4" />Keluar dari Akun</button>
        <DeleteAccount />
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600"><Sparkles className="h-3 w-3" /> KRIPTOAMAN SECURE IDENTITY WORKSPACE</div>
      </div>
    </div>
  );
}
