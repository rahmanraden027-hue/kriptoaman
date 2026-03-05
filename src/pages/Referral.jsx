import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, Copy, Share2, Users, TrendingUp, Check, ArrowLeft, Star, ChevronRight, Zap, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TIERS = [
  { min: 0, max: 2, label: 'Starter', color: 'from-slate-500 to-slate-600', bonus: 25000, icon: '🌱' },
  { min: 3, max: 9, label: 'Bronze', color: 'from-amber-700 to-amber-600', bonus: 35000, icon: '🥉' },
  { min: 10, max: 24, label: 'Silver', color: 'from-slate-400 to-slate-300', bonus: 50000, icon: '🥈' },
  { min: 25, max: 999, label: 'Gold', color: 'from-yellow-500 to-amber-400', bonus: 75000, icon: '🥇' },
];

const SHARE_CHANNELS = [
  { name: 'WhatsApp', icon: '💬', color: 'bg-green-600 hover:bg-green-700' },
  { name: 'Telegram', icon: '✈️', color: 'bg-blue-500 hover:bg-blue-600' },
  { name: 'Twitter/X', icon: '🐦', color: 'bg-slate-700 hover:bg-slate-600' },
  { name: 'Instagram', icon: '📸', color: 'bg-gradient-to-br from-purple-600 to-pink-500 hover:opacity-90' },
];

export default function Referral() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u.referralCode) {
        const code = 'KA' + (u.id?.slice(-6) || Math.random().toString(36).slice(-6)).toUpperCase();
        base44.auth.updateMe({ referralCode: code });
        setUser(uu => ({ ...uu, referralCode: code }));
      }
    }).catch(() => {});
  }, []);

  const referralCode = user?.referralCode || ('KA' + (user?.id?.slice(-6) || '------').toUpperCase());
  const referralLink = `https://kriptoaman.app/register?ref=${referralCode}`;
  const referralCount = user?.referralCount || 0;
  const referralActive = user?.referralActive || 0;

  const currentTier = TIERS.find(t => referralCount >= t.min && referralCount <= t.max) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const progress = nextTier ? ((referralCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;
  const totalEarned = referralActive * currentTier.bonus;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = (channel) => {
    const msg = encodeURIComponent(`🚀 Gabung KriptoAman & dapat bonus Rp 25.000!\nGunakan kode: ${referralCode}\n${referralLink}`);
    const urls = {
      'WhatsApp': `https://wa.me/?text=${msg}`,
      'Telegram': `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${msg}`,
      'Twitter/X': `https://twitter.com/intent/tweet?text=${msg}`,
      'Instagram': null,
    };
    if (urls[channel]) window.open(urls[channel], '_blank');
    else handleCopy();
  };

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
            <p className="text-slate-500 text-xs">Undang teman, dapatkan bonus makin besar!</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-rose-500/20 to-orange-500/20" />
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative p-6 text-center">
            <div className={`w-16 h-16 bg-gradient-to-br ${currentTier.color} rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-2xl`}>
              {currentTier.icon}
            </div>
            <p className="text-slate-400 text-xs mt-2">Tier kamu</p>
            <h2 className="text-white text-xl font-bold">{currentTier.label}</h2>
            <p className="text-slate-300 text-sm mt-1">
              Bonus per teman: <strong className="text-yellow-400">Rp {currentTier.bonus.toLocaleString('id-ID')}</strong>
            </p>
            {nextTier && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>{referralCount} diundang</span>
                  <span>Target {nextTier.min} → {nextTier.label} {nextTier.icon}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Diundang', value: referralCount, color: 'text-blue-400' },
            { icon: TrendingUp, label: 'Aktif Deposit', value: referralActive, color: 'text-green-400' },
            { icon: Star, label: 'Total Bonus', value: `Rp ${totalEarned.toLocaleString('id-ID')}`, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3 text-center">
              <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1.5`} />
              <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-500 text-[10px]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[['overview', 'Kode & Share'], ['tiers', 'Tier Bonus'], ['how', 'Cara Kerja']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === key ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Referral code */}
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Kode Referral Kamu</h3>
              <div className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-2xl font-bold tracking-widest">{referralCode}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Kode unik Anda</p>
                </div>
                <button onClick={handleCopy} className={`p-2.5 rounded-xl border transition-all ${copied ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2 text-[11px] text-slate-400 break-all select-all">
                {referralLink}
              </div>

              {/* Copy button */}
              <button onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-semibold transition-all ${copied ? 'bg-green-500/15 border-green-500/40 text-green-400' : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Tersalin! ✓' : 'Salin Link Referral'}
              </button>
            </div>

            {/* Share channels */}
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-3">
              <h3 className="text-white font-semibold text-sm">Bagikan Via</h3>
              <div className="grid grid-cols-2 gap-2">
                {SHARE_CHANNELS.map(ch => (
                  <button key={ch.name} onClick={() => handleShare(ch.name)}
                    className={`flex items-center justify-center gap-2 py-3 ${ch.color} text-white font-semibold rounded-xl text-sm transition-all`}>
                    <span>{ch.icon}</span>
                    {ch.name}
                  </button>
                ))}
              </div>
              <button onClick={() => navigator.share ? navigator.share({ title: 'KriptoAman Referral', text: `Kode: ${referralCode}`, url: referralLink }) : handleCopy()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-orange-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
                <Share2 className="w-4 h-4" />
                Bagikan Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Tiers Tab */}
        {activeTab === 'tiers' && (
          <div className="space-y-3">
            {TIERS.map((tier, i) => {
              const isActive = currentTier.label === tier.label;
              return (
                <div key={tier.label} className={`border rounded-2xl p-4 transition-all ${isActive ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-slate-700/40 bg-slate-800/40'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-xl`}>{tier.icon}</div>
                      <div>
                        <p className={`font-bold text-sm ${isActive ? 'text-yellow-300' : 'text-white'}`}>{tier.label} {isActive && '← Kamu'}</p>
                        <p className="text-slate-500 text-xs">{tier.min}–{tier.max === 999 ? '∞' : tier.max} teman diundang</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-sm">Rp {tier.bonus.toLocaleString('id-ID')}</p>
                      <p className="text-slate-500 text-[10px]">per teman aktif</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How it works */}
        {activeTab === 'how' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Cara Kerja</h3>
              {[
                { num: '1', text: 'Bagikan kode atau link referral kamu ke teman', icon: Share2, color: 'bg-blue-500' },
                { num: '2', text: 'Teman daftar menggunakan kode atau link kamu', icon: Users, color: 'bg-indigo-500' },
                { num: '3', text: 'Teman selesaikan KYC & deposit minimal Rp 100.000', icon: Zap, color: 'bg-purple-500' },
                { num: '4', text: 'Kamu & teman langsung dapat bonus sesuai tier!', icon: Gift, color: 'bg-yellow-500' },
              ].map(step => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${step.color} rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {step.num}
                  </div>
                  <p className="text-slate-300 text-sm">{step.text}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-2">
              <p className="text-blue-300 font-semibold text-sm">💡 Tips Referral</p>
              <ul className="space-y-1.5 text-slate-400 text-xs leading-relaxed">
                <li>• Bagikan ke grup WhatsApp atau Telegram komunitas kripto</li>
                <li>• Share testimoni pengalaman pakai KriptoAman di sosmed</li>
                <li>• Bonus makin besar seiring naik tier — target Gold untuk Rp 75K/teman!</li>
              </ul>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
              <p className="text-slate-500 text-[11px] leading-relaxed">
                <strong className="text-slate-400">Syarat & Ketentuan:</strong> Bonus dikreditkan setelah teman menyelesaikan deposit pertama ≥ Rp 100.000 dan verifikasi KYC. Satu akun hanya bisa menggunakan satu kode referral. Bonus berlaku 30 hari setelah pendaftaran teman. KriptoAman berhak membatalkan bonus jika terdeteksi kecurangan.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}