import React, { useState } from 'react';

import {
  TrendingUp,
  TrendingDown,
  Search,
  Globe,
  Star,
  Wifi,
  WifiOff,
  Activity,
  Radar,
  Sparkles,
  Layers3,
} from 'lucide-react';

import useLivePrices from '../components/market/useLivePrices';
import useCoinMarkets from '../components/home/useCoinMarkets';
import InteractiveSparkline from '../components/home/InteractiveSparkline';
import TradingViewModal from '../components/market/TradingViewModal';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../lib/LanguageContext';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';

const SYMBOL_LOGOS = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.png?v=040',
  ADA: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
};

const coinCapImage = (symbol) =>
  `https://assets.coincap.io/assets/icons/${String(symbol || '').toLowerCase()}@2x.png`;

const coinImage = (id, remoteImage, symbol) => {
  if (remoteImage) return remoteImage;
  if (SYMBOL_LOGOS[symbol]) return SYMBOL_LOGOS[symbol];

  const coinLoreId = String(id || '').match(/^coinlore-(\d+)$/)?.[1];
  if (coinLoreId) return `https://www.coinlore.com/img/50x50/${coinLoreId}.png`;

  return coinCapImage(symbol);
};

const handleCoinImageError = (event, symbol) => {
  const image = event.currentTarget;
  const fallbackStep = Number(image.dataset.fallbackStep || 0);

  if (fallbackStep === 0) {
    image.dataset.fallbackStep = '1';
    image.src = coinCapImage(symbol);
    return;
  }

  image.dataset.fallbackStep = '2';
  image.onerror = null;
  image.style.display = 'none';

  const symbolBadge = image.nextElementSibling;
  if (symbolBadge instanceof HTMLElement) {
    symbolBadge.style.display = 'flex';
  }
};

const COINS = [
  { id: 'bitcoin', sym: 'BTC', name: 'Bitcoin', color: '#f7931a' },
  { id: 'ethereum', sym: 'ETH', name: 'Ethereum', color: '#627eea' },
  { id: 'binancecoin', sym: 'BNB', name: 'BNB', color: '#f0b90b' },
  { id: 'solana', sym: 'SOL', name: 'Solana', color: '#14f195' },
  { id: 'ripple', sym: 'XRP', name: 'XRP', color: '#00aae4' },
  { id: 'cardano', sym: 'ADA', name: 'Cardano', color: '#0033ad' },
  { id: 'dogecoin', sym: 'DOGE', name: 'Dogecoin', color: '#c2a633' },
  { id: 'tron', sym: 'TRX', name: 'TRON', color: '#ef0027' },
  { id: 'avalanche-2', sym: 'AVAX', name: 'Avalanche', color: '#e84142' },
  { id: 'polkadot', sym: 'DOT', name: 'Polkadot', color: '#e6007a' },
  { id: 'chainlink', sym: 'LINK', name: 'Chainlink', color: '#2a5ada' },
  { id: 'matic-network', sym: 'MATIC', name: 'Polygon', color: '#8247e5' },
  { id: 'litecoin', sym: 'LTC', name: 'Litecoin', color: '#345d9d' },
  { id: 'uniswap', sym: 'UNI', name: 'Uniswap', color: '#ff007a' },
  { id: 'tether', sym: 'USDT', name: 'Tether', color: '#26a17b' },
  { id: 'usd-coin', sym: 'USDC', name: 'USD Coin', color: '#2775ca' },
  { id: 'shiba-inu', sym: 'SHIB', name: 'Shiba Inu', color: '#e0522b' },
  { id: 'pepe', sym: 'PEPE', name: 'Pepe', color: '#4caf50' },
];

const COPY = {
  id: {
    title: 'Pasar Kripto', identity: 'KRIPTOAMAN MARKET INTELLIGENCE', live: 'Live 24/7',
    available: 'Data pasar tersedia', connecting: 'Menghubungkan…', assets: 'aset',
    updated: 'diperbarui', sourceUnavailable: 'Sumber belum tersedia', search: 'Cari aset',
    all: 'Semua', gainers: 'Naik', losers: 'Turun', watchlist: 'Watchlist',
    today: 'hari ini', methodology: 'Sumber & metodologi', source: 'Sumber pasar',
    cadence: 'Pembaruan', cadenceValue: 'Setiap 15 menit + harga live untuk aset utama',
    freshness: 'Freshness', freshnessFresh: 'Snapshot aktif', freshnessStale: 'Snapshot tersimpan',
    scope: 'Cakupan', scopeValue: 'Informasi pasar—bukan harga eksekusi bursa',
    disclaimer: 'Harga dapat berbeda antar bursa dan mengalami keterlambatan. KriptoAman tidak mengubah data harga sumber dan tidak menjamin keuntungan.',
    load: 'Muat 100 aset berikutnya', remaining: 'tersisa', empty: 'Tidak ada hasil',
    emptyWatch: 'Belum ada aset di watchlist. Tekan bintang untuk menambahkan.',
    stale: 'Menampilkan snapshot terakhir yang berhasil disimpan. Pembaruan otomatis akan dilanjutkan saat koneksi pulih.',
    cachedSource: 'Snapshot tersimpan', chartUnavailable: 'Grafik belum tersedia',
    hero: 'Pusat intelijen pasar multi-aset untuk memantau momentum, tren, dan perubahan harga secara real-time.',
    breadth: 'Market breadth', feeds: 'Data feeds', universe: 'Asset universe', mode: 'Intelligence mode',
  },
  en: {
    title: 'Crypto Market', identity: 'KRIPTOAMAN MARKET INTELLIGENCE', live: 'Live 24/7',
    available: 'Market data available', connecting: 'Connecting…', assets: 'assets',
    updated: 'updated', sourceUnavailable: 'Source unavailable', search: 'Search assets',
    all: 'All', gainers: 'Gainers', losers: 'Losers', watchlist: 'Watchlist',
    today: 'today', methodology: 'Source & methodology', source: 'Market source',
    cadence: 'Refresh', cadenceValue: 'Every 15 minutes + live prices for major assets',
    freshness: 'Freshness', freshnessFresh: 'Active snapshot', freshnessStale: 'Saved snapshot',
    scope: 'Scope', scopeValue: 'Market information—not exchange execution prices',
    disclaimer: 'Prices may vary by exchange and may be delayed. KriptoAman does not alter source prices and does not guarantee returns.',
    load: 'Load next 100 assets', remaining: 'remaining', empty: 'No results',
    emptyWatch: 'Your watchlist is empty. Press the star to add an asset.',
    stale: 'Showing the last successfully saved snapshot. Automatic updates will resume when connectivity returns.',
    cachedSource: 'Saved snapshot', chartUnavailable: 'Chart unavailable',
    hero: 'A multi-asset market intelligence center for monitoring momentum, trends, and price changes in real time.',
    breadth: 'Market breadth', feeds: 'Data feeds', universe: 'Asset universe', mode: 'Intelligence mode',
  },
};

export default function Market() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currency, setCurrency] = useState('idr');
  const [chartCoin, setChartCoin] = useState(null);
  const [visibleCount, setVisibleCount] = useState(100);
  const [watchlist, setWatchlist] = useState(() => JSON.parse(localStorage.getItem('ka_watchlist') || '[]'));

  const { prices: liveData, connected, idrRate } = useLivePrices();
  const { markets, coins: marketCoins, dataAvailable, source, lastUpdated, isStale, cacheAgeMs } = useCoinMarkets();
  const coins = marketCoins.length > 0 ? marketCoins : COINS;
  const marketAvailable = connected || dataAvailable;
  const sourceLabel = {
    coinlore: 'CoinLore',
    coingecko: 'CoinGecko',
    cryptocompare: 'CryptoCompare',
    cache: text.cachedSource,
    server: language === 'en' ? 'KriptoAman server snapshot' : 'Snapshot server KriptoAman',
  }[source] || text.sourceUnavailable;
  const ageLabel = cacheAgeMs == null ? null : cacheAgeMs < 60 * 60 * 1000
    ? `${Math.max(1, Math.round(cacheAgeMs / 60000))} ${language === 'en' ? 'min ago' : 'menit lalu'}`
    : `${Math.round(cacheAgeMs / 3600000)} ${language === 'en' ? 'hours ago' : 'jam lalu'}`;
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  const toggleWatchlist = (sym) => {
    const next = watchlist.includes(sym) ? watchlist.filter(s => s !== sym) : [...watchlist, sym];
    setWatchlist(next);
    localStorage.setItem('ka_watchlist', JSON.stringify(next));
  };

  const filtered = coins.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.sym.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
    const chg = liveData[c.sym]?.change24h ?? markets[c.sym]?.change24h;
    if (tab === 'gainers' && (chg == null || chg < 0)) return false;
    if (tab === 'losers' && (chg == null || chg > 0)) return false;
    if (tab === 'watchlist' && !watchlist.includes(c.sym)) return false;
    return true;
  });

  const visibleCoins = filtered.slice(0, visibleCount);
  const gainersCount = coins.filter(c => ((liveData[c.sym]?.change24h ?? markets[c.sym]?.change24h) || 0) > 0).length;
  const losersCount = coins.filter(c => ((liveData[c.sym]?.change24h ?? markets[c.sym]?.change24h) || 0) < 0).length;
  const breadth = gainersCount + losersCount > 0 ? Math.round((gainersCount / (gainersCount + losersCount)) * 100) : 0;

  const formatPrice = (sym) => {
    const d = liveData[sym] || markets[sym];
    const price = d?.price;
    if (price == null) return '—';
    if (currency === 'usd') {
      return price >= 1 ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `$${price.toFixed(6)}`;
    }
    const idr = price * idrRate;
    if (idr >= 1e9) return `Rp ${(idr / 1e9).toFixed(2)} M`;
    if (idr >= 1e6) return `Rp ${(idr / 1e6).toFixed(2)} Jt`;
    if (idr >= 1000) return `Rp ${idr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
    if (idr >= 1) return `Rp ${idr.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;
    if (idr >= 0.01) return `Rp ${idr.toLocaleString('id-ID', { maximumFractionDigits: 4 })}`;
    return `Rp ${idr.toLocaleString('id-ID', { maximumFractionDigits: 8 })}`;
  };

  return (
    <div className="min-h-screen ka-bg text-white pb-[calc(11rem+env(safe-area-inset-bottom))] sm:pb-28">
      {chartCoin && (
        <TradingViewModal
          coin={chartCoin}
          price={liveData[chartCoin.sym]?.price ?? markets[chartCoin.sym]?.price}
          change24h={liveData[chartCoin.sym]?.change24h ?? markets[chartCoin.sym]?.change24h}
          onClose={() => setChartCoin(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 space-y-4">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-slate-950/55 p-4 sm:p-6 lg:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
          <div className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(circle at 12% 0%, rgba(56,189,248,.18), transparent 34%), radial-gradient(circle at 88% 10%, rgba(59,130,246,.14), transparent 30%), linear-gradient(rgba(56,189,248,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.035) 1px, transparent 1px)', backgroundSize: 'auto, auto, 28px 28px, 28px 28px' }} />
          <div className="relative grid gap-5 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-400/10 shadow-[0_0_30px_rgba(56,189,248,.16)]">
                  <KriptoAmanLogo size={34} showText={false} animate={false} />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold tracking-[0.22em] text-sky-300">{text.identity}</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">{text.title}</h1>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-[15px]">{text.hero}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${marketAvailable ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/25 bg-amber-400/10 text-amber-300'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${marketAvailable ? 'bg-emerald-400 ka-pulse-dot' : 'bg-amber-400'}`} />
                  {connected ? text.live : dataAvailable ? text.available : text.connecting}
                </span>
                <span className="ka-chip px-3 py-1.5 text-[10px] font-bold text-slate-300">{sourceLabel}</span>
                {updatedLabel && <span className="ka-chip px-3 py-1.5 text-[10px] font-bold text-slate-400">{text.updated} {updatedLabel}</span>}
                {ageLabel && <span className={`ka-chip px-3 py-1.5 text-[10px] font-bold ${isStale ? 'text-amber-300' : 'text-emerald-300'}`}>{ageLabel}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                [Activity, text.breadth, `${breadth}%`, breadth >= 50 ? 'text-emerald-300' : 'text-amber-300'],
                [Radar, text.feeds, marketAvailable ? (connected ? 'LIVE' : 'SYNC') : 'WAIT', marketAvailable ? 'text-sky-300' : 'text-amber-300'],
                [Layers3, text.universe, coins.length.toLocaleString(language === 'en' ? 'en-US' : 'id-ID'), 'text-white'],
                [Sparkles, text.mode, language === 'en' ? 'REAL-TIME' : 'REAL-TIME', 'text-cyan-300'],
              ].map(([Icon, label, value, color]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 backdrop-blur-xl">
                  <Icon className="h-4 w-4 text-sky-300" />
                  <p className={`mt-3 text-lg font-black ${color}`}>{value}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {isStale && dataAvailable && (
          <div role="status" className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-[11px] leading-relaxed text-amber-200">
            {text.stale}{ageLabel ? ` (${ageLabel})` : ''}
          </div>
        )}

        <section className="ka-surface p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`${text.search} (${coins.length})… BTC, ETH, SOL`}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/55 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-sky-400/45 placeholder:text-slate-600"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <LanguageSwitcher compact />
              <button
                onClick={() => setCurrency(c => c === 'idr' ? 'usd' : 'idr')}
                className="ka-chip shrink-0 px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
              >
                {currency === 'idr' ? 'IDR 🇮🇩' : 'USD 🇺🇸'}
              </button>
              <div className={`shrink-0 rounded-xl border p-2 ${marketAvailable ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-amber-400/20 bg-amber-400/10'}`}>
                {marketAvailable ? <Wifi className="h-4 w-4 text-emerald-300" /> : <WifiOff className="h-4 w-4 text-amber-300" />}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
            {[['all', text.all], ['gainers', text.gainers], ['losers', text.losers], ['watchlist', text.watchlist]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`min-w-0 rounded-xl px-2 py-2.5 text-[11px] font-bold transition-all ${tab === key ? 'border border-sky-300/30 bg-sky-400/15 text-sky-200 shadow-[0_0_18px_rgba(56,189,248,.12)]' : 'border border-white/8 bg-white/[0.025] text-slate-400 hover:text-white'}`}
              >
                <span className="block truncate">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: text.gainers, value: gainersCount, color: 'text-emerald-300', icon: TrendingUp },
            { label: text.losers, value: losersCount, color: 'text-red-300', icon: TrendingDown },
            { label: 'Total', value: coins.length, color: 'text-white', icon: Globe },
          ].map(stat => (
            <div key={stat.label} className="ka-surface p-3 sm:p-4">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <p className={`mt-2 text-xl font-black ka-num ${stat.color}`}>{stat.value}</p>
              <p className="mt-0.5 truncate text-[9px] uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <details className="rounded-2xl border border-sky-400/15 bg-sky-400/[0.04] px-4 py-3">
          <summary className="cursor-pointer select-none text-[10px] font-bold text-sky-300">{text.methodology}</summary>
          <div className="pt-3 text-[10px] leading-relaxed text-slate-400">
            <div className="grid gap-3 sm:grid-cols-4">
              <div><span className="font-bold text-sky-300">{text.source}: </span>{sourceLabel}</div>
              <div><span className="font-bold text-sky-300">{text.cadence}: </span>{text.cadenceValue}</div>
              <div><span className="font-bold text-sky-300">{text.freshness}: </span>{isStale ? text.freshnessStale : text.freshnessFresh}{ageLabel ? ` · ${ageLabel}` : ''}</div>
              <div><span className="font-bold text-sky-300">{text.scope}: </span>{text.scopeValue}</div>
            </div>
            <p className="mt-3 border-t border-white/10 pt-3 text-slate-500">{text.disclaimer}</p>
          </div>
        </details>

        <div className="grid gap-2 xl:grid-cols-2">
          {visibleCoins.map((c, index) => {
            const d = liveData[c.sym] || markets[c.sym];
            const chg = d?.change24h;
            const isUp = (chg || 0) >= 0;
            const inWatchlist = watchlist.includes(c.sym);
            const spark = markets[c.sym]?.sparkline;
            const chartData = Array.isArray(spark) && spark.length > 1 ? spark : [];
            return (
              <div
                key={c.id}
                className="group flex items-center gap-3 ka-surface ka-surface-hover px-3.5 py-3.5 cursor-pointer"
                onClick={() => setChartCoin(c)}
              >
                <div className="relative shrink-0">
                  <img
                    src={coinImage(c.id, c.image, c.sym)}
                    alt={c.name}
                    className="h-10 w-10 rounded-2xl object-cover ring-1 ring-white/10"
                    loading="lazy"
                    onError={(e) => handleCoinImageError(e, c.sym)}
                  />
                  <span
                    aria-hidden="true"
                    className="h-10 w-10 rounded-2xl items-center justify-center border border-sky-400/30 bg-sky-400/10 text-[9px] font-extrabold text-sky-300"
                    style={{ display: 'none' }}
                  >
                    {c.sym.slice(0, 4)}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-white">{c.sym}</p>
                    <span className="rounded-md border border-white/8 bg-white/[0.035] px-1.5 py-0.5 text-[8px] text-slate-500">#{c.rank || index + 1}</span>
                  </div>
                  <p className="mt-0.5 max-w-[120px] truncate text-[10px] text-slate-500">{c.name}</p>
                </div>
                <div className="ml-auto flex min-w-0 items-center gap-2.5">
                  <div className="hidden sm:block">
                    {chartData.length > 1 ? (
                      <InteractiveSparkline data={chartData} up={isUp} height={28} width={64} />
                    ) : (
                      <span className="inline-flex w-16 justify-center text-[8px] font-semibold text-slate-600">{text.chartUnavailable}</span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-[13px] font-extrabold ka-num transition-colors ${d?.tick === 'up' ? 'text-emerald-300' : d?.tick === 'down' ? 'text-red-300' : 'text-white'}`}>
                      {formatPrice(c.sym)}
                    </p>
                    <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] font-bold ${isUp ? 'text-emerald-300' : 'text-red-300'}`}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {chg != null ? `${isUp ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleWatchlist(c.sym); }}
                    className={`shrink-0 rounded-xl border p-2 transition-all tap-reset ${inWatchlist ? 'border-yellow-400/25 bg-yellow-400/10 text-yellow-300' : 'border-white/8 bg-white/[0.025] text-slate-500 hover:text-white'}`}
                    aria-label="Watchlist"
                  >
                    <Star className={`h-4 w-4 ${inWatchlist ? 'fill-yellow-300' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {visibleCount < filtered.length && (
          <button
            type="button"
            onClick={() => setVisibleCount(count => Math.min(count + 100, filtered.length))}
            className="w-full ka-btn-primary mt-4 mb-6 py-3 text-sm"
          >
            {text.load} ({filtered.length - visibleCount} {text.remaining})
          </button>
        )}

        {filtered.length === 0 && (
          <div className="text-center ka-muted py-16">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {tab === 'watchlist' ? text.emptyWatch : text.empty}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
