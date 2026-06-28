import React, { useState } from 'react';
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!featureTitle.trim() || !featureLink.trim()) {
      setError('Judul fitur dan link wajib diisi.');
      return;
    }
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('sendFeatureUpdateEmail', {
        featureTitle: featureTitle.trim(),
        featureDescription: featureDescription.trim(),
        featureLink: featureLink.trim()
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Gagal mengirim email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Broadcast Pembaruan Fitur</h1>
            <p className="text-xs text-slate-400">Kirim link fitur terbaru ke semua pengguna via email</p>
          </div>
        </div>

        <Card className="bg-slate-800/30 border-slate-700/30">
          <CardHeader>
            <CardTitle className="text-white text-base">Detail Pembaruan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Judul Fitur *</Label>
              <Input
                value={featureTitle}
                onChange={(e) => setFeatureTitle(e.target.value)}
                placeholder="Mis. Trading Bot Baru dengan AI"
                className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Deskripsi (opsional)</Label>
              <Textarea
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                placeholder="Jelaskan fitur baru secara singkat..."
                rows={4}
                className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Link Fitur *</Label>
              <Input
                value={featureLink}
                onChange={(e) => setFeatureLink(e.target.value)}
                placeholder="https://kriptoaman.com/fitur-baru"
                className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-emerald-300 text-sm font-semibold">
                Email terkirim: {result.sent} dari {result.totalRecipients} pengguna
                {result.failed > 0 && ` (${result.failed} gagal)`}
              </p>
            </div>
            <details className="text-xs">
              <summary className="text-slate-400 cursor-pointer">Lihat detail per penerima</summary>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {result.results?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-400">
                    <span>{r.email}</span>
                    <span className={r.status === 'sent' ? 'text-emerald-400' : 'text-rose-400'}>
                      {r.status === 'sent' ? '✓ Terkirim' : '✗ Gagal'}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        <Button
          onClick={handleSend}
          disabled={sending || !featureTitle.trim() || !featureLink.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {sending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> Kirim ke Semua Pengguna</>
          )}
        </Button>
      </div>
    </div>
  );
}