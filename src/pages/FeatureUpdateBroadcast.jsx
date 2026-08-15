import React, { useState } from 'react';
import { Mail, Send, CheckCircle, XCircle, Loader2, Users, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeatureUpdateBroadcast() {
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureLink, setFeatureLink] = useState('');
  const [sending, setSending] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [audit, setAudit] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAudit = async () => {
    setAuditing(true); setError(null); setAudit(null);
    try {
      const res = await base44.functions.invoke('auditBroadcastRecipients', {});
      setAudit(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Gagal mengaudit penerima');
    } finally { setAuditing(false); }
  };

  const handleSend = async () => {
    if (!featureTitle.trim() || !featureLink.trim()) { setError('Judul fitur dan link wajib diisi.'); return; }
    if (!audit?.summary) { setError('Jalankan audit penerima terlebih dahulu sebelum broadcast.'); return; }
    setSending(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke('sendFeatureUpdateEmail', {
        featureTitle: featureTitle.trim(), featureDescription: featureDescription.trim(), featureLink: featureLink.trim()
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Gagal mengirim email');
    } finally { setSending(false); }
  };

  const s = audit?.summary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="pt-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center"><Mail className="w-5 h-5 text-indigo-400" /></div><div><h1 className="text-lg font-bold text-white">Broadcast Pembaruan Fitur</h1><p className="text-xs text-slate-400">Audit penerima terlebih dahulu sebelum pengiriman</p></div></div>

        <Card className="bg-slate-800/30 border-slate-700/30"><CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Users className="w-4 h-4"/>Audit Penerima</CardTitle></CardHeader><CardContent className="space-y-4"><Button onClick={handleAudit} disabled={auditing} className="w-full bg-sky-600 hover:bg-sky-700">{auditing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Mengaudit...</> : <><ShieldCheck className="w-4 h-4 mr-2"/>Hitung & Audit Penerima</>}</Button>{s && <div className="grid grid-cols-2 gap-3 text-sm"><Stat label="Total akun" value={s.totalAccounts}/><Stat label="Punya email" value={s.accountsWithEmail}/><Stat label="Email unik valid" value={s.uniqueValidEmail}/><Stat label="Duplikat" value={s.duplicateEmailRecords}/><Stat label="Email terverifikasi" value={s.verifiedEmail}/><Stat label="Verifikasi belum diketahui" value={s.verificationUnknown}/><Stat label="Opt-in eksplisit" value={s.explicitOptIn}/><Stat label="Opt-out" value={s.optedOut}/><Stat label="Kandidat dapat dihubungi" value={s.contactableCandidates}/><Stat label="Layak konservatif" value={s.conservativeEligible}/></div>}{audit?.sample?.length > 0 && <details className="text-xs"><summary className="text-slate-400 cursor-pointer">Contoh penerima (email disamarkan)</summary><div className="mt-2 space-y-1 max-h-44 overflow-y-auto">{audit.sample.map((r,i)=><div key={i} className="flex items-center justify-between gap-3 text-slate-400"><span>{r.email}</span><span>{r.verified} · {r.consent}</span></div>)}</div></details>}</CardContent></Card>

        <Card className="bg-slate-800/30 border-slate-700/30"><CardHeader><CardTitle className="text-white text-base">Detail Pembaruan</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label className="text-slate-300 text-sm">Judul Fitur *</Label><Input value={featureTitle} onChange={e=>setFeatureTitle(e.target.value)} placeholder="Mis. KriptoAman Global Product Update 2026" className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"/></div><div className="space-y-2"><Label className="text-slate-300 text-sm">Deskripsi</Label><Textarea value={featureDescription} onChange={e=>setFeatureDescription(e.target.value)} rows={4} className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"/></div><div className="space-y-2"><Label className="text-slate-300 text-sm">Link *</Label><Input value={featureLink} onChange={e=>setFeatureLink(e.target.value)} placeholder="https://kriptoaman.com/" className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"/></div></CardContent></Card>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-2"><XCircle className="w-5 h-5 text-rose-400 shrink-0"/><p className="text-rose-300 text-sm">{error}</p></div>}
        {result && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-400"/><p className="text-emerald-300 text-sm font-semibold">Email terkirim: {result.sent} dari {result.totalRecipients}{result.failed > 0 && ` (${result.failed} gagal)`}</p></div></div>}

        <Button onClick={handleSend} disabled={sending || !featureTitle.trim() || !featureLink.trim() || !audit?.summary} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">{sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Mengirim...</> : <><Send className="w-4 h-4 mr-2"/>Kirim ke Semua Pengguna</>}</Button>
        <p className="text-[11px] text-slate-500 text-center">Audit tidak mengirim email. Pengiriman massal tetap merupakan tindakan terpisah.</p>
      </div>
    </div>
  );
}

function Stat({ label, value }) { return <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-3"><p className="text-slate-500 text-[11px]">{label}</p><p className="text-white text-lg font-bold mt-1">{value ?? 0}</p></div>; }
