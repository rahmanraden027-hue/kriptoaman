import React, { useState } from 'react';
import { Mail, Send, MessageCircle, Phone, MapPin, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Mohon isi semua kolom yang diperlukan.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const subject = `[KriptoAman Contact] ${form.subject || 'Pesan dari ' + form.name}`;
      const body = `Nama: ${form.name}\nEmail: ${form.email}\n\nPesan:\n${form.message}`;
      window.open(`mailto:support@kriptoaman.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError('Gagal membuka aplikasi email. Silakan kirim langsung ke support@kriptoaman.com.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Header */}
        <div className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/20">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Kontak Kami</h1>
          <p className="text-slate-400 text-sm mt-2">Kirim pesan dan kami akan segera merespons</p>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 gap-3">
          <a href="mailto:support@kriptoaman.com" className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/40 rounded-xl hover:bg-slate-800/70 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Email Utama</p>
              <p className="text-white text-sm font-semibold">support@kriptoaman.com</p>
            </div>
          </a>

          <a href="mailto:admin@kriptoaman.com" className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/40 rounded-xl hover:bg-slate-800/70 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Email Admin</p>
              <p className="text-white text-sm font-semibold">admin@kriptoaman.com</p>
            </div>
          </a>

          <div className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/40 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Jam Operasional</p>
              <p className="text-white text-sm font-semibold">Senin–Jumat, 09.00–18.00 WIB</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Kirim Pesan</h2>

          {sent ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-400 font-semibold">Pesan Terkirim!</p>
              <p className="text-slate-400 text-sm">Tim kami akan membalas ke email Anda dalam 1-2 hari kerja.</p>
              <button onClick={() => setSent(false)} className="text-blue-400 text-sm hover:text-blue-300">
                Kirim pesan lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Nama Lengkap *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama Anda"
                  className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>

              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Email *</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  type="email" placeholder="email@anda.com"
                  className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>

              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Subjek</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Tentang apa pesan ini?"
                  className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>

              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Pesan *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tuliskan pesan atau pertanyaan Anda di sini..."
                  rows={5}
                  className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={sending} className="w-full bg-blue-600 hover:bg-blue-700 py-3">
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {sending ? 'Mengirim...' : 'Kirim Pesan'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-slate-600 text-xs text-center pb-2">
          Atau hubungi langsung via live chat di halaman <a className="text-blue-500 hover:text-blue-400" href="/Support">Support</a>
        </p>

      </div>
    </div>
  );
}