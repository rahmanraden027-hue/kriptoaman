import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Zap, BarChart3, TrendingUp, Brain, Shield, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
  { icon: Brain, text: 'Sinyal trading AI real-time (BTC, ETH, SOL, dll)' },
  { icon: BarChart3, text: 'Market research mendalam + laporan harian' },
  { icon: TrendingUp, text: 'Indikator teknikal canggih (RSI, MACD, Bollinger)' },
  { icon: Zap, text: 'Auto-trading bot tanpa batas strategi' },
  { icon: Shield, text: 'Analisis risiko portofolio & rekomendasi DCA' },
  { icon: Star, text: 'Akses prioritas ke fitur baru & beta testing' },
];

export default function Premium() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'cancelled'

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') setStatus('success');
    if (params.get('cancelled') === 'true') setStatus('cancelled');
  }, []);

  const handleSubscribe = async () => {
    // Block if running inside iframe (preview mode)
    if (window.self !== window.top) {
      alert('Checkout hanya tersedia di aplikasi yang sudah dipublish. Buka aplikasi di tab baru.');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        successUrl: window.location.origin + '/premium?success=true',
        cancelUrl: window.location.origin + '/premium?cancelled=true',
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = user?.premium_analytics === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Status banners */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-emerald-900/50 border border-emerald-500/40 rounded-2xl text-center">
            <p className="text-emerald-400 font-bold text-lg">🎉 Berhasil! Langganan Premium aktif.</p>
            <p className="text-emerald-300/70 text-sm mt-1">Selamat datang di KriptoAman Premium Analytics!</p>
          </div>
        )}
        {status === 'cancelled' && (
          <div className="mb-6 p-4 bg-amber-900/30 border border-amber-500/30 rounded-2xl text-center">
            <p className="text-amber-400 font-semibold">Pembayaran dibatalkan. Anda bisa mencoba lagi kapan saja.</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-3">Premium Plan</Badge>
          <h1 className="text-3xl font-extrabold text-white mb-2">Crypto Analytics Premium</h1>
          <p className="text-slate-400 text-sm">Tingkatkan keputusan investasi Anda dengan data & AI terdepan</p>
        </div>

        {/* Pricing card */}
        <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900/80 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl mb-6">
          <div className="text-center mb-6">
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-slate-400 text-lg">$</span>
              <span className="text-5xl font-black text-white">99</span>
              <span className="text-slate-400 text-lg mb-1">/bulan</span>
            </div>
            <p className="text-slate-400 text-xs">≈ Rp 1.600.000/bulan · Batalkan kapan saja</p>
          </div>

          {/* Features list */}
          <ul className="space-y-3 mb-8">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </li>
            ))}
          </ul>

          {isPremium ? (
            <div className="w-full py-3 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-center text-emerald-400 font-bold">
              ✓ Anda sudah Premium
            </div>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-6 text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl shadow-lg shadow-indigo-900/40"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</>
              ) : (
                'Mulai Langganan Premium'
              )}
            </Button>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs">
          Pembayaran diproses aman oleh Stripe · SSL Encrypted · Tidak ada biaya tersembunyi
        </p>
      </div>
    </div>
  );
}