import React, { useState } from 'react';
import {
  Database, Server, Zap, Target, Shield, Globe, TrendingUp,
  Wallet, Users, Bell, BookOpen, Code, GitBranch, Layers,
  CheckCircle2, Clock, Circle, ArrowRight, Star, Megaphone,
  BarChart3, Lock, Smartphone, Cpu, ChevronDown, ChevronRight,
  AlertTriangle, Radio, Link2, Package, ArrowUpRight
} from 'lucide-react';

const SECTIONS = [
  { id: 'database', label: 'Struktur Database', icon: Database },
  { id: 'backend', label: 'Arsitektur Backend', icon: Server },
  { id: 'roadmap', label: 'Roadmap Teknis', icon: GitBranch },
  { id: 'branding', label: 'Strategi Branding', icon: Megaphone },
];

const DB_GROUPS = [
  {
    group: 'Auth & User',
    color: 'blue',
    items: [
      { name: 'User', fields: ['id', 'email', 'full_name', 'role', 'created_date'], note: 'Built-in entity' },
    ]
  },
  {
    group: 'Wallet & Keuangan',
    color: 'green',
    items: [
      { name: 'UserBalance', fields: ['userEmail', 'coin', 'amount'] },
      { name: 'DepositRequest', fields: ['userEmail', 'type', 'coin', 'network', 'amountCrypto', 'txHash', 'status', 'confirmedAt'] },
      { name: 'WithdrawalRequest', fields: ['userEmail', 'coin', 'toAddress', 'amount', 'fee', 'otpCode', 'status', 'txHash'] },
      { name: 'AdminProfit', fields: ['transactionType', 'userEmail', 'amount', 'currency', 'status'] },
    ]
  },
  {
    group: 'Platform Config',
    color: 'purple',
    items: [
      { name: 'PlatformCryptoAddress', fields: ['coin', 'address', 'network', 'isActive', 'minDeposit'] },
      { name: 'PlatformBankAccount', fields: ['bank', 'accountNumber', 'accountName', 'isActive'] },
    ]
  },
  {
    group: 'Auto Trading',
    color: 'orange',
    items: [
      { name: 'TradingRule', fields: ['name', 'userEmail', 'pair', 'entryRules[]', 'exitRules[]', 'mode', 'stats'] },
      { name: 'TradingSignal', fields: ['ruleId', 'pair', 'signal', 'price', 'executed', 'pnl'] },
      { name: 'OpenPosition', fields: ['ruleId', 'pair', 'entryPrice', 'quantity', 'stopLoss', 'takeProfit', 'status'] },
      { name: 'AutoTradingStrategy', fields: ['name', 'strategyType', 'pair', 'assetClass', 'riskManagement', 'stats'] },
      { name: 'GridTradingBot', fields: ['symbol', 'upperPrice', 'lowerPrice', 'gridCount', 'totalInvestment', 'isActive'] },
      { name: 'PaperTrade', fields: ['strategyId', 'startingCapital', 'trades[]', 'statistics', 'status'] },
      { name: 'LivePaperTrade', fields: ['strategyId', 'pair', 'entryPrice', 'stopLoss', 'takeProfit', 'unrealizedPL'] },
      { name: 'CexConnection', fields: ['exchange', 'api_key', 'api_secret', 'status', 'last_balances'] },
    ]
  },
  {
    group: 'DEX / On-chain',
    color: 'cyan',
    items: [
      { name: 'DEXOrder', fields: ['orderType', 'chainId', 'fromTokenSymbol', 'toTokenSymbol', 'triggerPrice', 'status', 'txHash'] },
      { name: 'TradePerformance', fields: ['dexOrderId', 'entryPrice', 'exitPrice', 'profitLoss', 'status'] },
    ]
  },
  {
    group: 'Market & Analytics',
    color: 'yellow',
    items: [
      { name: 'MarketCondition', fields: ['pair', 'trend', 'volatility', 'riskLevel', 'alerts[]'] },
      { name: 'ChartTemplate', fields: ['name', 'indicators[]', 'timeframe', 'chartType', 'isDefault'] },
      { name: 'TradingNotification', fields: ['type', 'category', 'title', 'message', 'isRead', 'actionRequired'] },
    ]
  },
  {
    group: 'Support',
    color: 'pink',
    items: [
      { name: 'SupportMessage', fields: ['conversationId', 'role', 'content', 'userEmail', 'isRead'] },
    ]
  },
];

const BACKEND_FUNCTIONS = [
  { name: 'verifyTxHash', desc: 'Verifikasi transaksi di blockchain explorer', category: 'Wallet' },
  { name: 'sendWithdrawalOTP', desc: 'Kirim OTP via email untuk withdrawal', category: 'Wallet' },
  { name: 'verifyWithdrawalOTP', desc: 'Validasi kode OTP sebelum proses withdrawal', category: 'Wallet' },
  { name: 'autoConfirmDeposit', desc: 'Auto-confirm deposit setelah cek tx hash', category: 'Wallet' },
  { name: 'collectTransactionFee', desc: 'Kumpulkan fee ke AdminProfit entity', category: 'Wallet' },
  { name: 'runAutoTradingBot', desc: 'Jalankan sinyal & cek kondisi trading rules', category: 'Trading' },
  { name: 'executeAutoTrade', desc: 'Eksekusi trade di CEX (Binance/Bybit)', category: 'Trading' },
  { name: 'gridTradingExecute', desc: 'Jalankan grid bot & manage order levels', category: 'Trading' },
  { name: 'runPaperTradeSimulation', desc: 'Backtest strategi dengan data historis', category: 'Trading' },
  { name: 'executeLiveTradeRequest', desc: 'Buka posisi live paper trade', category: 'Trading' },
  { name: 'closeLiveTradeRequest', desc: 'Tutup posisi live paper trade', category: 'Trading' },
  { name: 'monitorMarketConditions', desc: 'Pantau & update kondisi pasar realtime', category: 'Market' },
  { name: 'getRealtimeMarketData', desc: 'Ambil data pasar multi-aset realtime', category: 'Market' },
  { name: 'getMultiAssetMarketData', desc: 'Data forex, indices, commodities', category: 'Market' },
  { name: 'analyzeMarketOpportunity', desc: 'AI analisis peluang trading', category: 'Market' },
  { name: 'executeDEXOrder', desc: 'Eksekusi stop-loss/take-profit di DEX', category: 'DEX' },
  { name: 'monitorDEXOrders', desc: 'Monitor harga & trigger DEX orders', category: 'DEX' },
  { name: 'executeOrderMonitor', desc: 'Cek dan eksekusi pending orders', category: 'DEX' },
  { name: 'syncCexBalances', desc: 'Sinkronisasi saldo dari exchange', category: 'CEX' },
  { name: 'getAdminProfitAnalytics', desc: 'Hitung analitik profit admin', category: 'Admin' },
  { name: 'analyzeDynamicSLTP', desc: 'Hitung SL/TP dinamis berbasis ATR', category: 'Trading' },
];

const ROADMAP = [
  {
    phase: 'Phase 1', title: 'Foundation', status: 'done',
    items: [
      { text: 'Auth & User management', done: true },
      { text: 'Multi-coin wallet (USDT, SOL, ETH, BTC, IDR)', done: true },
      { text: 'Deposit/Withdraw flow (crypto + bank)', done: true },
      { text: 'Admin panel (balance editor, deposit notifier)', done: true },
      { text: 'Auto-trading rules + paper trade + grid bot', done: true },
      { text: 'DEX integration (swap, order book)', done: true },
      { text: 'CEX connection (Binance, Bybit, OKX)', done: true },
      { text: 'Candlestick chart realtime (Binance WS)', done: true },
      { text: 'Edukasi konten (Anti-rugpull, keamanan)', done: true },
      { text: 'Disclaimer gate + PIN lock', done: true },
    ]
  },
  {
    phase: 'Phase 2', title: 'Growth', status: 'active',
    items: [
      { text: 'KYC / Verifikasi identitas (upload KTP/selfie)', done: false },
      { text: 'Push notification real (FCM/OneSignal)', done: false },
      { text: '2FA / TOTP (Google Authenticator)', done: false },
      { text: 'Referral system + komisi fee sharing', done: false },
      { text: 'Portfolio tax report (export PDF/CSV)', done: false },
      { text: 'On-chain verification via explorer API', done: false },
    ]
  },
  {
    phase: 'Phase 3', title: 'Scale', status: 'planned',
    items: [
      { text: 'Multi-language support (EN/ID)', done: false },
      { text: 'Staking real (Lido, Jito integration)', done: false },
      { text: 'Copy trading (follow trader lain)', done: false },
      { text: 'AI advisor (GPT-based chat trading assistant)', done: false },
      { text: 'Mobile app store (iOS + Android via PWA)', done: false },
      { text: 'Social trading feed & leaderboard', done: false },
    ]
  },
];

const BRAND_PILLARS = [
  {
    icon: Shield, color: 'indigo',
    pillar: 'AMAN',
    tagline: '"Investasi kripto tanpa takut"',
    impl: ['Shield logo + dark navy color', 'Disclaimer gate wajib', 'Edukasi anti-rugpull', 'PIN lock & 2FA', 'Verifikasi tx hash otomatis']
  },
  {
    icon: Cpu, color: 'blue',
    pillar: 'CERDAS',
    tagline: '"Trading berbasis data, bukan FOMO"',
    impl: ['Auto-trading rules builder', 'AI signal & market analysis', 'Candlestick chart realtime', 'Paper trading / backtest', 'Grid bot management']
  },
  {
    icon: Globe, color: 'green',
    pillar: 'LOKAL',
    tagline: '"Dibuat untuk Indonesia"',
    impl: ['Dukungan IDR + bank lokal', 'UI bahasa Indonesia', 'Support via chat langsung', 'Edukasi konten Bahasa Indonesia', 'Regulasi OJK-friendly']
  },
];

const colorMap = {
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  green: 'bg-green-500/10 border-green-500/30 text-green-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
  indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
};

const categoryColor = {
  'Wallet': 'bg-green-500/15 text-green-400',
  'Trading': 'bg-orange-500/15 text-orange-400',
  'Market': 'bg-blue-500/15 text-blue-400',
  'DEX': 'bg-cyan-500/15 text-cyan-400',
  'CEX': 'bg-purple-500/15 text-purple-400',
  'Admin': 'bg-red-500/15 text-red-400',
};

function CollapsibleGroup({ group }) {
  const [open, setOpen] = useState(false);
  const cls = colorMap[group.color] || colorMap.blue;
  return (
    <div className={`border rounded-xl overflow-hidden ${cls}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="font-bold text-sm">{group.group}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-60">{group.items.length} entities</span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 bg-slate-900/60">
          {group.items.map(entity => (
            <div key={entity.name} className="bg-slate-800/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-white font-semibold text-sm">{entity.name}</span>
                {entity.note && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">{entity.note}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entity.fields.map(f => (
                  <span key={f} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlatformDocs() {
  const [activeSection, setActiveSection] = useState('database');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h1 className="text-white font-bold text-lg">Platform Docs</h1>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">Internal</span>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BANNER PEMBERITAHUAN MIGRASI ── */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="relative overflow-hidden border border-red-500/40 bg-gradient-to-br from-red-950/60 via-orange-950/40 to-slate-900/80 rounded-2xl p-4 mb-2">
          {/* Blinking dot */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">URGENT</span>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">⚠️ Pemberitahuan Migrasi Platform</h2>
              <p className="text-red-300 text-xs mt-0.5">Diterbitkan: 10 Maret 2026 — Tim Teknis KriptoAman</p>
            </div>
          </div>

          <div className="space-y-3">

            {/* Item 1 */}
            <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Link2 className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div>
                <p className="text-orange-300 font-bold text-sm">Hubungkan Semua Rantai Jaringan ke Platform Publik</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Seluruh node dan rantai jaringan yang saat ini beroperasi secara terpusat (internal/private) <span className="text-orange-300 font-semibold">wajib segera dihubungkan ke infrastruktur platform publik</span>. Pastikan setiap koneksi node telah dikonfigurasi dengan endpoint yang terdaftar dan terverifikasi di dashboard platform.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Ethereum Mainnet', 'BNB Chain', 'Polygon', 'Arbitrum', 'Solana', 'Base', 'Avalanche'].map(chain => (
                    <span key={chain} className="text-[9px] bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold">{chain}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Package className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <p className="text-red-300 font-bold text-sm">Migrasi Semua Muatan Kontainer ke Platform</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Semua data, konfigurasi, dan layanan yang masih berjalan di dalam <span className="text-red-300 font-semibold">kontainer lokal/legacy</span> harus segera dimigrasikan ke platform terpusat KriptoAman. Ini mencakup seluruh image container, volume data, environment variables, dan service configuration.
                </p>
                <div className="mt-2 space-y-1">
                  {[
                    { label: 'Kontainer Wallet Service', status: 'Belum Migrasi' },
                    { label: 'Kontainer Trading Engine', status: 'Belum Migrasi' },
                    { label: 'Kontainer Market Data', status: 'Belum Migrasi' },
                    { label: 'Kontainer Auth Service', status: 'Belum Migrasi' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-2 py-1 bg-slate-800/60 rounded-lg">
                      <span className="text-slate-300 text-[11px]">{item.label}</span>
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Radio className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-300 font-bold text-sm">Tenggat Waktu & Tindakan Segera</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Proses migrasi dan koneksi jaringan harus diselesaikan sebelum <span className="text-yellow-300 font-semibold">31 Maret 2026</span>. Kegagalan dalam memenuhi tenggat ini akan menyebabkan layanan yang belum termigrasi <span className="text-red-400 font-semibold">dinonaktifkan otomatis</span> dari sistem platform.
                </p>
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <ArrowUpRight className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className="text-yellow-300 text-xs font-semibold">International Organization of Securities Commissions (IOSCO)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-red-500/20 flex items-center justify-between">
            <p className="text-slate-600 text-[10px]">Dokumen internal — hanya untuk admin platform</p>
            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">REV 1.0 / 2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-2 space-y-4">

        {/* ── DATABASE ── */}
        {activeSection === 'database' && (
          <div className="space-y-3">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h2 className="text-white font-bold mb-1">Struktur Database</h2>
              <p className="text-slate-400 text-xs">Base44 BaaS — NoSQL document store. {DB_GROUPS.reduce((a,g)=>a+g.items.length,0)} entities total. Klik grup untuk expand.</p>
            </div>
            {DB_GROUPS.map(g => <CollapsibleGroup key={g.group} group={g} />)}

            {/* Data Flow */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Data Flow
              </h3>
              <div className="space-y-2">
                {[
                  'User Action (Frontend)',
                  'React Component → base44.functions.invoke()',
                  'Deno Function (Backend)',
                  'base44.entities (Database) ↔ External API',
                  'Response → UI Update (Real-time via subscribe)',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 text-[10px] flex items-center justify-center font-bold shrink-0">{i+1}</span>
                    <span className="text-slate-300 text-xs font-mono">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BACKEND ── */}
        {activeSection === 'backend' && (
          <div className="space-y-3">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h2 className="text-white font-bold mb-1">Arsitektur Backend</h2>
              <p className="text-slate-400 text-xs">Stack: React + Vite + TailwindCSS | Backend: Base44 BaaS | Runtime: Deno Deploy</p>
            </div>

            {/* Stack layers */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-2">
              <h3 className="text-white font-semibold text-sm mb-3">Tech Stack</h3>
              {[
                { layer: 'Frontend', tech: 'React 18 + Vite + TailwindCSS + shadcn/ui', color: 'blue' },
                { layer: 'State', tech: 'TanStack Query + React useState/useEffect', color: 'cyan' },
                { layer: 'Backend Functions', tech: 'Deno Deploy (serverless edge functions)', color: 'green' },
                { layer: 'Database', tech: 'Base44 BaaS (NoSQL, real-time subscriptions)', color: 'purple' },
                { layer: 'Auth', tech: 'Base44 Auth (email/password, role-based)', color: 'orange' },
                { layer: 'External APIs', tech: 'Binance WS, CoinGecko, DEXScreener, 1inch', color: 'yellow' },
                { layer: 'Charts', tech: 'Recharts + lightweight-charts + Canvas API', color: 'pink' },
                { layer: 'PWA', tech: 'Service Worker + Web Push + App Manifest', color: 'indigo' },
              ].map(row => (
                <div key={row.layer} className="flex items-center gap-3 py-1.5 border-b border-slate-700/40 last:border-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colorMap[row.color]} w-28 text-center shrink-0`}>{row.layer}</span>
                  <span className="text-slate-300 text-xs">{row.tech}</span>
                </div>
              ))}
            </div>

            {/* Functions list */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Code className="w-4 h-4 text-green-400" /> Backend Functions ({BACKEND_FUNCTIONS.length})
              </h3>
              <div className="space-y-1.5">
                {BACKEND_FUNCTIONS.map(fn => (
                  <div key={fn.name} className="flex items-start gap-2 py-1.5 border-b border-slate-700/30 last:border-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${categoryColor[fn.category]}`}>{fn.category}</span>
                    <div>
                      <p className="text-white text-xs font-mono">{fn.name}</p>
                      <p className="text-slate-500 text-[11px]">{fn.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ROADMAP ── */}
        {activeSection === 'roadmap' && (
          <div className="space-y-4">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h2 className="text-white font-bold mb-1">Roadmap Teknis</h2>
              <p className="text-slate-400 text-xs">3-phase development plan. Phase 1 sudah selesai, Phase 2 dalam progress.</p>
            </div>
            {ROADMAP.map(phase => (
              <div key={phase.phase} className={`border rounded-xl overflow-hidden ${
                phase.status === 'done' ? 'border-green-500/30 bg-green-500/5' :
                phase.status === 'active' ? 'border-blue-500/30 bg-blue-500/5' :
                'border-slate-600/30 bg-slate-800/20'
              }`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold text-sm">{phase.phase}</span>
                    <span className="text-slate-400 text-sm ml-2">— {phase.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    phase.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    phase.status === 'active' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                    'bg-slate-600/20 text-slate-400'
                  }`}>
                    {phase.status === 'done' ? '✅ Selesai' : phase.status === 'active' ? '🔄 Aktif' : '🔮 Planned'}
                  </span>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  {phase.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {item.done
                        ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        : phase.status === 'active'
                          ? <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          : <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      }
                      <span className={`text-xs ${item.done ? 'text-slate-400 line-through' : 'text-slate-300'}`}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BRANDING ── */}
        {activeSection === 'branding' && (
          <div className="space-y-4">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h2 className="text-white font-bold mb-1">Strategi Branding</h2>
              <p className="text-indigo-300 text-sm font-semibold italic mt-1">"KriptoAman — Platform Kripto Terpercaya untuk Investor Indonesia"</p>
              <p className="text-slate-400 text-xs mt-2">Target: Investor pemula–menengah Indonesia yang takut scam & rugpull</p>
            </div>

            {/* 3 Pillars */}
            <div className="grid grid-cols-1 gap-3">
              {BRAND_PILLARS.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.pillar} className={`border rounded-xl p-4 ${colorMap[p.color]}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-base">{p.pillar}</p>
                        <p className="text-xs opacity-80 italic">{p.tagline}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {p.impl.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <ArrowRight className="w-3 h-3 shrink-0 opacity-70" />
                          <span className="text-slate-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Visual Identity */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-semibold text-sm">Visual Identity</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Primary', color: '#6366f1', name: 'Indigo 500' },
                  { label: 'Dark BG', color: '#0f172a', name: 'Slate 950' },
                  { label: 'Accent', color: '#f59e0b', name: 'Amber (coin)' },
                  { label: 'Success', color: '#10b981', name: 'Emerald' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-2 bg-slate-700/40 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded-md border border-white/10 shrink-0" style={{ background: c.color }} />
                    <div>
                      <p className="text-white text-xs font-semibold">{c.label}</p>
                      <p className="text-slate-500 text-[10px]">{c.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Strategy */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" /> Growth Strategy
              </h3>
              <div className="space-y-2">
                {[
                  { no: '1', strat: 'SEO Content', desc: 'Artikel edukasi (anti-rugpull, cara beli crypto aman)' },
                  { no: '2', strat: 'Komunitas', desc: 'Telegram/Discord group → share sinyal trading gratis' },
                  { no: '3', strat: 'Referral', desc: 'Invite teman, dapat fee sharing otomatis' },
                  { no: '4', strat: 'KOL / Influencer', desc: 'Crypto educator Indonesia (YouTube, TikTok)' },
                  { no: '5', strat: 'App Store', desc: 'PWA → iOS/Android store listing' },
                ].map(s => (
                  <div key={s.no} className="flex items-start gap-3 py-1.5 border-b border-slate-700/30 last:border-0">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">{s.no}</span>
                    <div>
                      <p className="text-white text-xs font-semibold">{s.strat}</p>
                      <p className="text-slate-500 text-[11px]">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor Matrix */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" /> Diferensiasi vs Kompetitor
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 pb-2 font-semibold">Fitur</th>
                      <th className="text-center text-indigo-400 pb-2 font-semibold">KriptoAman</th>
                      <th className="text-center text-slate-500 pb-2 font-semibold">Pintu/Indodax</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {[
                      ['Auto-trading rules', '✅', '❌'],
                      ['Grid bot built-in', '✅', '❌'],
                      ['Paper trading/backtest', '✅', '❌'],
                      ['DEX + CEX hybrid', '✅', '⚠️ Partial'],
                      ['Edukasi anti-rugpull', '✅', '❌ Minim'],
                      ['AI market analysis', '✅', '❌'],
                      ['Candlestick realtime', '✅', '✅'],
                      ['Bahasa Indonesia', '✅', '✅'],
                    ].map(([feat, ka, comp], i) => (
                      <tr key={i} className="border-b border-slate-700/30 last:border-0">
                        <td className="text-slate-300 py-1.5">{feat}</td>
                        <td className="text-center py-1.5">{ka}</td>
                        <td className="text-center py-1.5 text-slate-500">{comp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}