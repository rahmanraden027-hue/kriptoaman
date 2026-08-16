import React, { useState } from 'react';

import {
  TrendingUp,
  TrendingDown,
  Search,
  Globe,
  Star,
  Wifi,
  WifiOff
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
    updated: 'diperbarui', fallback: 'Sumber cadangan', search: 'Cari aset',
    all: 'Semua', gainers: 'Naik', losers: 'Turun', watchlist: 'Watchlist',
    today: 'hari ini', methodology: 'Sumber & metodologi', source: 'Sumber pasar',
    cadence: 'Pembaruan', cadenceValue: 'Setiap 15 menit + harga live untuk aset utama',
    scope: 'Cakupan', scopeValue: 'Informasi pasar—bukan harga eksekusi bursa',
    disclaimer: 'Harga dapat berbeda antar bursa dan mengalami keterlambatan. KriptoAman tidak mengubah data harga sumber dan tidak menjamin keuntungan.',
    load: 'Muat 100 aset berikutnya', remaining: 'tersisa', empty: 'Tidak ada hasil',
    emptyWatch: 'Belum ada aset di watchlist. Tekan bintang untuk menambahkan.',
    stale: 'Menampilkan snapshot terakhir yang berhasil disimpan. Pembaruan otomatis akan dilanjutkan saat koneksi pulih.',
    cachedSource: 'Snapshot tersimpan',
  },
  en: {
    title: 'Crypto Market', identity: 'KRIPTOAMAN MARKET INTELLIGENCE', live: 'Live 24/7',
    available: 'Market data available', connecting: 'Connecting…', assets: 'assets',
    updated: 'updated', fallback: 'Fallback source', search: 'Search assets',
    all: 'All', gainers: 'Gainers', losers: 'Losers', watchlist: 'Watchlist',
    today: 'today', methodology: 'Source & methodology', source: 'Market source',
    cadence: 'Refresh', cadenceValue: 'Every 15 minutes + live prices for major assets',
    scope: 'Scope', scopeValue: 'Market information—not exchange execution prices',
    disclaimer: 'Prices may vary by exchange and may be delayed. KriptoAman does not alter source prices and does not guarantee returns.',
    load: 'Load next 100 assets', remaining: 'remaining', empty: 'No results',
    emptyWatch: 'Your watchlist is empty. Press the star to add an asset.',
    stale: 'Showing the last successfully saved snapshot. Automatic updates will resume when connectivity returns.',
    cachedSource: 'Saved snapshot',
  },
};

const fallbackSparkline = (change24h) => {
  const change = Number(change24h);
  if (!Number.isFinite(change)) return [];
  const direction = change >= 0 ? 1 : -1;
  const amplitude = Math.max(0.8, Math.min(18, Math.abs(change)));
  return [0, 0.18, 0.1, 0.42, 0.34, 0.72, 1].map(
    (step, index) => 100 + direction * amplitude * step + (index % 2 ? direction * 0.15 : 0),
  );
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
  }[source] || text.fallback;
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

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <KriptoAmanLogo size={30} showText={false} animate={false} className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[8px] font-extrabold tracking-[0.16em] text-sky-300">{text.identity}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <h1 className="text-lg font-bold text-white sm:text-xl">{text.title}</h1>
                <span className={`inline-flex items-center gap-1 text-[10px] ${marketAvailable ? 'text-ka-emerald' : 'text-yellow-400'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${marketAvailable ? 'bg-ka-emerald ka-pulse-dot' : 'bg-yellow-400'}`} />
                  {connected ? text.live : dataAvailable ? text.available : text.connecting}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[9px] ka-muted">
                {coins.length.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} {text.assets} · {sourceLabel}
                {updatedLabel ? ` · ${text.updated} ${updatedLabel}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0" style={{ scrollbarWidth: 'none' }}>
            <LanguageSwitcher compact />
            <button
              onClick={() => setCurrency(c => c === 'idr' ? 'usd' : 'idr')}
              className="ka-chip shrink-0 px-2.5 py-1.5 text-[10px] font-bold ka-muted hover:text-white transition-colors"
            >
              {currency === 'idr' ? 'IDR 🇮🇩' : 'USD 🇺🇸'}
            </button>
            <div className={`shrink-0 rounded-lg border p-1.5 ${marketAvailable ? 'bg-ka-emerald/10 border-ka-emerald/20' : 'ka-chip'}`}>
              {marketAvailable ? <Wifi className="h-3.5 w-3.5 text-ka-emerald" /> : <WifiOff className="h-3.5 w-3.5 text-yellow-400" />}
            </div>
          </div>
        </div>

        {isStale && dataAvailable && (
          <div role="status" className="mb-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[10px] leading-relaxed text-amber-200">
            {text.stale}{ageLabel ? ` (${ageLabel})` : ''}
          </div>
        )}

        <div className="relative mb-2.5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ka-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${text.search} (${coins.length})… BTC, ETH, SOL`}
            className="w-full ka-surface rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ka-emerald placeholder:ka-muted"
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-2.5">
          {[['all', text.all], ['gainers', text.gainers], ['losers', text.losers], ['watchlist', text.watchlist]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`min-w-0 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all ${tab === key ? 'bg-ka-emerald text-black' : 'ka-chip ka-muted hover:text-white'}`}
            >
              <span className="block truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {[
            { label: text.gainers, value: coins.filter(c => ((liveData[c.sym]?.change24h ?? markets[c.sym]?.change24h) || 0) > 0).length, color: 'text-ka-emerald' },
            { label: text.losers, value: coins.filter(c => ((liveData[c.sym]?.change24h ?? markets[c.sym]?.change24h) || 0) < 0).length, color: 'text-[#e74c3c]' },
            { label: 'Total', value: coins.length, color: 'text-white' },
          ].map(stat => (
            <div key={stat.label} className="ka-surface rounded-xl px-2 py-2 text-center">
              <p className={`text-sm font-bold ka-num ${stat.color}`}>{stat.value}</p>
              <p className="ka-muted text-[9px] truncate">{stat.label}</p>
            </div>
          ))}
        </div>

        <details className="mb-2.5 rounded-xl border border-sky-400/15 bg-sky-400/[0.04] px-3 py-2">
          <summary className="cursor-pointer select-none text-[10px] font-bold text-sky-300">{text.methodology}</summary>
          <div className="pt-2 text-[9px] leading-relaxed text-slate-400">
            <div className="grid gap-2 sm:grid-cols-3">
              <div><span className="font-bold text-sky-300">{text.source}: </span>{sourceLabel}</div>
              <div><span className="font-bold text-sky-300">{text.cadence}: </span>{text.cadenceValue}</div>
              <div><span className="font-bold text-sky-300">{text.scope}: </span>{text.scopeValue}</div>
            </div>
            <p className="mt-2 border-t border-white/10 pt-2 text-slate-500">{text.disclaimer}</p>
          </div>
        </details>

        <div className="grid gap-1.5 xl:grid-cols-2">
          {visibleCoins.map((c, index) => {
            const d = liveData[c.sym] || markets[c.sym];
            const chg = d?.change24h;
            const isUp = (chg || 0) >= 0;
            const inWatchlist = watchlist.includes(c.sym);
            const spark = markets[c.sym]?.sparkline;
            const chartData = Array.isArray(spark) && spark.length > 1 ? spark : fallbackSparkline(chg);
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 ka-surface ka-surface-hover px-2.5 py-2.5"
                onClick={() => setChartCoin(c)}
              >
                <div className="relative shrink-0">
                  <img
                    src={coinImage(c.id, c.image, c.sym)}
                    alt={c.name}
                    className="h-8 w-8 rounded-full object-cover"
                    loading="lazy"
                    onError={(e) => handleCoinImageError(e, c.sym)}
                  />
                  <span
                    aria-hidden="true"
                    className="h-8 w-8 rounded-full items-center justify-center border border-ka-emerald/30 bg-ka-emerald/10 text-[8px] font-extrabold text-ka-emerald"
                    style={{ display: 'none' }}
                  >
                    {c.sym.slice(0, 4)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{c.sym}</p>
                  <p className="max-w-[100px] truncate text-[9px] ka-muted">#{c.rank || index + 1} · {c.name}</p>
                </div>
                <div className="ml-auto flex min-w-0 items-center gap-2">
                  <div className="hidden xs:block sm:block">
                    {chartData.length > 1 ? (
                      <InteractiveSparkline data={chartData} up={isUp} height={24} width={52} />
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-[13px] font-bold ka-num transition-colors ${d?.tick === 'up' ? 'text-ka-emerald' : d?.tick === 'down' ? 'text-[#e74c3c]' : 'text-white'}`}>
                      {formatPrice(c.sym)}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-[10px] font-semibold ${isUp ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {chg != null ? `${isUp ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleWatchlist(c.sym); }}
                    className={`shrink-0 rounded-lg p-1.5 transition-all tap-reset ${inWatchlist ? 'text-yellow-400' : 'ka-muted hover:text-white'}`}
                    aria-label="Watchlist"
                  >
                    <Star className={`h-4 w-4 ${inWatchlist ? 'fill-yellow-400' : ''}`} />
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
