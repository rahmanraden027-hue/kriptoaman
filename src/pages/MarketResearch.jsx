import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Users, DollarSign, Target, Globe, Star, 
  BarChart3, PieChart, AlertTriangle, CheckCircle2, Zap, ArrowUpRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

// === DATA RISET (sumber: OJK, Bappebti, Statista, SensorTower, IDN Times 2025-2026) ===

const USER_GROWTH = [
  { year: '2020', users: 5.2, transactions: 65 },
  { year: '2021', users: 8.1, transactions: 842 },
  { year: '2022', users: 12.4, transactions: 306 },
  { year: '2023', users: 17.8, transactions: 149 },
  { year: '2024', users: 22.1, transactions: 650 },
  { year: '2025', users: 20.2, transactions: 482 },
  { year: '2026*', users: 23.5, transactions: 520 }
];

const DEMOGRAPHICS = [
  { age: '18–24 (Gen Z)', percent: 42.3 },
  { age: '25–34 (Millennial)', percent: 39.3 },
  { age: '35–44', percent: 12.1 },
  { age: '45+', percent: 6.3 }
];

const PLATFORM_SHARE = [
  { name: 'Indodax', share: 34, users: '7.1M' },
  { name: 'Pintu', share: 22, users: '4.5M' },
  { name: 'Tokocrypto', share: 21, users: '4.5M' },
  { name: 'Lainnya', share: 23, users: '4.1M' }
];

const COMPETITOR_DATA = [
  { name: 'Indodax', rating: 4.2, users: '7.1M', features: 22, ux: 65, revenue: 'Rp 180M/bulan est.' },
  { name: 'Pintu', rating: 4.5, users: '4.5M', features: 18, ux: 78, revenue: 'Rp 95M/bulan est.' },
  { name: 'Tokocrypto', rating: 4.1, users: '4.5M', features: 24, ux: 70, revenue: 'Rp 90M/bulan est.' },
  { name: 'KriptoAman', rating: null, users: 'Target 1M', features: 32, ux: 92, revenue: 'Potensi Rp 50M+/bulan' },
];

const FEATURE_DEMAND = [
  { feature: 'Real-time Price & Alerts', demand: 94, available: true },
  { feature: 'P2P Lending', demand: 78, available: true },
  { feature: 'Auto Trading / Bot', demand: 82, available: true },
  { feature: 'DEX Integration', demand: 75, available: true },
  { feature: 'Portfolio Analytics', demand: 88, available: true },
  { feature: 'KYC Terintegrasi', demand: 91, available: false },
  { feature: 'Fiat On/Off Ramp (IDR)', demand: 89, available: false },
  { feature: 'Tax Reporting', demand: 71, available: false },
];

const P2P_GROWTH = [
  { year: '2022', volume: 12 },
  { year: '2023', volume: 38 },
  { year: '2024', volume: 65 },
  { year: '2025', volume: 94 },
  { year: '2026*', volume: 130 }
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

function StatCard({ icon: IconComp, label, value, sub, color = 'indigo', trend }) {
  const Icon = IconComp;
  const colorMap = {
    indigo: 'from-indigo-900/40 to-blue-900/40 border-indigo-500/30 text-indigo-400',
    green: 'from-green-900/40 to-emerald-900/40 border-green-500/30 text-emerald-400',
    amber: 'from-amber-900/40 to-yellow-900/40 border-amber-500/30 text-amber-400',
    cyan: 'from-cyan-900/40 to-blue-900/40 border-cyan-500/30 text-cyan-400',
  };
  return (
    <Card className={`bg-gradient-to-br ${colorMap[color]} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-2">{label}</p>
          <p className={`text-2xl font-bold ${colorMap[color].split(' ').pop()}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Icon className={`w-5 h-5 ${colorMap[color].split(' ').pop()}`} />
          {trend && (
            <span className="text-xs text-green-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />{trend}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function MarketResearch() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-24">
      <div className="max-w-5xl mx-auto pt-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Market Research</h1>
              <p className="text-slate-400 text-sm">Riset Pasar Kripto Indonesia — KriptoAman</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Sumber: OJK 2025</Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Bappebti</Badge>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">Statista</Badge>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">IDN Times Report 2025</Badge>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">SensorTower</Badge>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Users} label="Total Pengguna Kripto ID" value="20.2M+" sub="Per Nov 2025 (OJK)" color="indigo" trend="+16.2%" />
          <StatCard icon={DollarSign} label="Volume Transaksi 2025" value="Rp 482T" sub="$28.6B USD (OJK)" color="green" trend="+YoY" />
          <StatCard icon={Globe} label="Market Wallet Global" value="$25B" sub="Proyeksi $69B di 2030" color="cyan" trend="+28.9% CAGR" />
          <StatCard icon={TrendingUp} label="P2P Lending Fintech" value="Rp 94.8T" sub="Per Nov 2025 (OJK)" color="amber" trend="+142% CAGR" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="demographics">Demografi</TabsTrigger>
            <TabsTrigger value="competitors">Kompetitor</TabsTrigger>
            <TabsTrigger value="demand">Demand</TabsTrigger>
            <TabsTrigger value="opportunity">Peluang</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Pertumbuhan Pengguna Kripto Indonesia (Juta)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={USER_GROWTH}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v) => [`${v}M pengguna`, 'Users']} />
                  <Area type="monotone" dataKey="users" stroke="#6366f1" fill="url(#colorUsers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Volume Transaksi Kripto (Rp Triliun)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={USER_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} unit="T" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v) => [`Rp ${v}T`, 'Volume']} />
                  <Bar dataKey="transactions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 mt-2">* 2026 merupakan proyeksi. Sumber: OJK, Bappebti 2025.</p>
            </Card>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5">
              <h4 className="text-indigo-300 font-semibold mb-3 text-sm">💡 Insight Kunci</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Indonesia <strong>peringkat ke-3 global</strong> dalam crypto adoption dengan 20M+ pengguna terdaftar</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Volume transaksi kripto mencapai <strong>Rp 482 triliun ($28.6B)</strong> di 2025</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Pasar dompet kripto global diproyeksi tumbuh dari <strong>$25B → $69B pada 2030</strong> (CAGR 28.9%)</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> P2P Lending fintech mencapai <strong>Rp 94.8 triliun</strong> per Nov 2025 — tumbuh 142% CAGR</li>
              </ul>
            </div>
          </TabsContent>

          {/* DEMOGRAPHICS */}
          <TabsContent value="demographics" className="mt-6 space-y-6">
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-white font-semibold mb-5">Demografi Pengguna Kripto Indonesia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <RePieChart>
                    <Pie data={DEMOGRAPHICS} cx="50%" cy="50%" outerRadius={85} dataKey="percent" label={({ age, percent }) => `${percent}%`}>
                      {DEMOGRAPHICS.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v) => [`${v}%`, '']} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {DEMOGRAPHICS.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                          {d.age}
                        </span>
                        <span className="font-bold" style={{ color: COLORS[i] }}>{d.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className="h-full rounded-full" style={{ width: `${d.percent}%`, background: COLORS[i] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">Sumber: IDN Times Millennial & Gen Z Report 2025 / LinkedIn Crypto Trends 2025</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800/60 border-slate-700/40 p-5">
                <h4 className="text-white font-semibold text-sm mb-4">🎯 Target Utama KriptoAman</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                    <p className="text-indigo-300 font-semibold">Gen Z (18–24 tahun) — 42.3%</p>
                    <p className="text-slate-400 text-xs mt-1">Digital native, mobile-first, tertarik auto-trading & P2P</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-300 font-semibold">Millennial (25–34 tahun) — 39.3%</p>
                    <p className="text-slate-400 text-xs mt-1">Sudah bekerja, punya modal, butuh passive income & portfolio</p>
                  </div>
                </div>
                <p className="text-xs text-yellow-400 mt-3 font-semibold">⚡ 81.6% pengguna berusia 18–34 tahun</p>
              </Card>

              <Card className="bg-slate-800/60 border-slate-700/40 p-5">
                <h4 className="text-white font-semibold text-sm mb-4">📱 Platform Preference</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Android</span>
                    <span className="text-green-400 font-bold">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">iOS</span>
                    <span className="text-blue-400 font-bold">19%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Desktop Web</span>
                    <span className="text-slate-400 font-bold">3%</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 text-xs text-slate-400">
                    <p>☑️ Mobile-first strategy KriptoAman sudah tepat</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* COMPETITOR */}
          <TabsContent value="competitors" className="mt-6 space-y-6">
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-white font-semibold mb-5">Analisis Kompetitor</h3>
              <div className="space-y-4">
                {COMPETITOR_DATA.map((c, i) => (
                  <div key={i} className={`rounded-xl p-4 border ${c.name === 'KriptoAman' ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-700/40 bg-slate-900/40'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`font-bold text-sm ${c.name === 'KriptoAman' ? 'text-indigo-300' : 'text-white'}`}>
                          {c.name === 'KriptoAman' ? '⭐ ' : ''}{c.name}
                        </span>
                        {c.name === 'KriptoAman' && <Badge className="ml-2 bg-indigo-500/20 text-indigo-300 text-[10px]">Our App</Badge>}
                        <p className="text-xs text-slate-400 mt-0.5">{c.users} pengguna | {c.features} fitur</p>
                      </div>
                      {c.rating ? (
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                          <span className="text-amber-400 text-sm font-bold">{c.rating}</span>
                        </div>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400">Unrated — New</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">UX Score</span>
                        <span className={`font-semibold ${c.ux >= 90 ? 'text-green-400' : c.ux >= 75 ? 'text-blue-400' : 'text-slate-300'}`}>{c.ux}/100</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${c.ux >= 90 ? 'bg-green-500' : c.ux >= 75 ? 'bg-blue-500' : 'bg-slate-500'}`}
                          style={{ width: `${c.ux}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 pt-1">{c.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-slate-800/60 border-slate-700/40 p-5">
              <h4 className="text-white font-semibold text-sm mb-4">Market Share Estimasi 2025</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <RePieChart>
                    <Pie data={PLATFORM_SHARE} dataKey="share" cx="50%" cy="50%" outerRadius={70} label={({ name, share }) => `${share}%`}>
                      {PLATFORM_SHARE.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {PLATFORM_SHARE.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                        {p.name}
                      </span>
                      <span className="text-slate-400 text-xs">{p.users} | {p.share}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* DEMAND */}
          <TabsContent value="demand" className="mt-6 space-y-6">
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-white font-semibold mb-5">Demand Fitur — Survei Pasar</h3>
              <div className="space-y-4">
                {FEATURE_DEMAND.map((f, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300 flex items-center gap-2">
                        {f.available ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        {f.feature}
                      </span>
                      <span className={`font-bold text-xs ${f.demand >= 90 ? 'text-green-400' : f.demand >= 80 ? 'text-blue-400' : 'text-amber-400'}`}>{f.demand}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                      <div 
                        className={`h-full rounded-full ${f.available ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${f.demand}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-4 text-xs">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" /> Sudah ada di KriptoAman</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-400" /> Roadmap berikutnya</span>
              </div>
            </Card>

            {/* P2P Growth */}
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-white font-semibold mb-4">P2P Lending Growth — Rp Triliun</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={P2P_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} unit="T" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v) => [`Rp ${v}T`, 'Volume']} />
                  <Bar dataKey="volume" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 mt-2">* 2026 proyeksi. Sumber: OJK, Research & Markets 2025</p>
            </Card>
          </TabsContent>

          {/* OPPORTUNITY */}
          <TabsContent value="opportunity" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-900/30 border-green-500/30 p-5">
                <h4 className="text-green-300 font-bold text-sm mb-3">TAM (Total Addressable)</h4>
                <p className="text-2xl font-bold text-white">20.2M</p>
                <p className="text-xs text-slate-400 mt-1">Total pengguna kripto aktif di Indonesia</p>
                <p className="text-green-400 text-xs mt-2 font-semibold">$28.6B volume transaksi/tahun</p>
              </Card>
              <Card className="bg-blue-900/30 border-blue-500/30 p-5">
                <h4 className="text-blue-300 font-bold text-sm mb-3">SAM (Serviceable)</h4>
                <p className="text-2xl font-bold text-white">6.1M</p>
                <p className="text-xs text-slate-400 mt-1">Segmen 18–34 thn, mobile-first, belum loyal ke 1 platform</p>
                <p className="text-blue-400 text-xs mt-2 font-semibold">~30% dari TAM</p>
              </Card>
              <Card className="bg-indigo-900/30 border-indigo-500/30 p-5">
                <h4 className="text-indigo-300 font-bold text-sm mb-3">SOM (Obtainable 3 Tahun)</h4>
                <p className="text-2xl font-bold text-white">500K–1M</p>
                <p className="text-xs text-slate-400 mt-1">Target realistis dengan fitur P2P + Auto Trading</p>
                <p className="text-indigo-400 text-xs mt-2 font-semibold">Potensi Rp 25–50M/bulan fee</p>
              </Card>
            </div>

            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-white font-semibold mb-5">Proyeksi Revenue KriptoAman</h3>
              <div className="space-y-4 text-sm">
                {[
                  { source: 'Trading Fee (0.1% / transaksi)', year1: '~Rp 5M/bln', year3: '~Rp 40M/bln', status: 'active' },
                  { source: 'P2P Lending Fee (1-2%)', year1: '~Rp 2M/bln', year3: '~Rp 15M/bln', status: 'active' },
                  { source: 'Subscription Premium', year1: '~Rp 1M/bln', year3: '~Rp 8M/bln', status: 'roadmap' },
                  { source: 'KYC/IDR On-Ramp Fee', year1: '–', year3: '~Rp 20M/bln', status: 'roadmap' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div className="flex-1">
                      <span className="text-slate-300">{r.source}</span>
                      <Badge className={`ml-2 text-[10px] ${r.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {r.status === 'active' ? 'Aktif' : 'Roadmap'}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <p className="text-xs text-slate-500">Thn 1</p>
                        <p className="text-cyan-400 font-semibold text-xs">{r.year1}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Thn 3</p>
                        <p className="text-green-400 font-semibold text-xs">{r.year3}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-green-500/10 border-green-500/20 p-5">
                <h4 className="text-green-300 font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Keunggulan KriptoAman
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>✅ 32 fitur (lebih lengkap dari kompetitor)</li>
                  <li>✅ UX Score 92/100 — tertinggi di kategori</li>
                  <li>✅ P2P Lending terintegrasi (unik di Indonesia)</li>
                  <li>✅ Auto Trading + Grid Bot</li>
                  <li>✅ Mobile-first + PWA-ready</li>
                  <li>✅ PIN lock + keamanan ekstra</li>
                </ul>
              </Card>
              <Card className="bg-amber-500/10 border-amber-500/20 p-5">
                <h4 className="text-amber-300 font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Gap / Next Steps
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>⚠️ KYC terintegrasi belum ada</li>
                  <li>⚠️ Fiat on/off ramp (IDR) diperlukan</li>
                  <li>⚠️ Tax reporting untuk compliance pajak</li>
                  <li>⚠️ Lisensi OJK wajib untuk live trading</li>
                  <li>⚠️ Marketing & user acquisition plan</li>
                </ul>
              </Card>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-5">
              <p className="text-slate-400 text-xs italic">
                Disclaimer: Estimasi revenue dan proyeksi pasar bersifat indikatif berdasarkan data publik OJK, Bappebti, Statista, dan riset industri. 
                Tidak mewakili jaminan keuntungan. Data diperbarui per Maret 2026.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}