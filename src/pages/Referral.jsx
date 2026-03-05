import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, Copy, Share2, Users, TrendingUp, Check, ArrowLeft, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Referral() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Generate referral code dari user ID
      if (!u.referralCode) {
        const code = 'KA' + (u.id?.slice(-6) || Math.random().toString(36).slice(-6)).toUpperCase();
        base44.auth.updateMe({ referralCode: code });
        setUser(uu => ({ ...uu, referralCode: code }));
      }
    }).catch(() => {});
  }, []);

  const referralCode = user?.referralCode || ('KA' + (user?.id?.slice(-6) || '------').toUpperCase());
  const referralLink = `https://kriptoaman.app/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Bergabung di KriptoAman!',
        text: `Gunakan kode referral saya ${referralCode} dan dapatkan bonus Rp 25.000 untuk deposit pertamamu!`,
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  const totalEarned = (user?.referralCount || 0) * 25000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Profile')} className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg">Program Referral</h1>
            <p className="text-slate-500 text-xs">Undang teman, dapatkan bonus!</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 via-orange-500/20 to-pink-500/20" />
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative p-6 text-center space-y-3">
            <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500/30 rounded-3xl flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-white text-xl font-bold">Undang & Dapatkan Bonus</h2>
            <p className="text-slate-300 text-sm">Kamu dapat <strong className="text-yellow-400">Rp 25.000</strong> dan temanmu dapat <strong className="text-yellow-400">Rp 25.000</strong> saat deposit pertama ≥ Rp 100.000</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Total Diundang', value: user?.referralCount || 0, color: 'text-blue-400' },
            { icon: TrendingUp, label: 'Aktif Deposit', value: user?.referralActive || 0, color: 'text-green-400' },
            { icon: Star, label: 'Total Bonus', value: `Rp ${(totalEarned).toLocaleString('id-ID')}`, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3 text-center">
              <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1.5`} />
              <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-500 text-[10px]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Code */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Kode Referral Kamu</h3>
          <div className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-2xl font-bold tracking-widest">{referralCode}</p>
              <p className="text-slate-500 text-xs mt-0.5">Kode unik Anda</p>
            </div>
            <button onClick={handleCopy} className={`p-2 rounded-xl border transition-all ${copied ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'}`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-400 break-all">
            {referralLink}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold rounded-xl text-sm transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Salin Link'}
            </button>
            <button onClick={handleShare}
              className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
              <Share2 className="w-4 h-4" />
              Bagikan
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Cara Kerja</h3>
          <div className="space-y-3">
            {[
              { num: '1', text: 'Bagikan kode referral kamu ke teman', color: 'bg-blue-500' },
              { num: '2', text: 'Teman daftar menggunakan kode kamu', color: 'bg-indigo-500' },
              { num: '3', text: 'Teman deposit minimal Rp 100.000', color: 'bg-purple-500' },
              { num: '4', text: 'Kamu & teman masing-masing dapat Rp 25.000', color: 'bg-yellow-500' },
            ].map(step => (
              <div key={step.num} className="flex items-center gap-3">
                <div className={`w-7 h-7 ${step.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {step.num}
                </div>
                <p className="text-slate-300 text-sm">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <p className="text-slate-500 text-[11px] leading-relaxed">
            <strong className="text-slate-400">Syarat & Ketentuan:</strong> Bonus akan dikreditkan setelah teman menyelesaikan deposit pertama. Satu akun hanya bisa menggunakan satu kode referral. Bonus berlaku 30 hari setelah pendaftaran.
          </p>
        </div>

      </div>
    </div>
  );
}