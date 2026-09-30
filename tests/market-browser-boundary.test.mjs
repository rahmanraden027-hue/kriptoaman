import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const FILES=[
  'src/components/home/useCoinMarkets.js',
  'src/pages/PriceTracker.jsx',
  'src/components/market/useLivePrices.jsx',
  'src/components/market/LiveTickerBar.jsx',
  'src/components/wallet/useRealtimePrices.jsx',
  'src/components/wallet/useMarketData.jsx',
  'src/components/wallet/multiCoinApi.jsx',
  'src/components/wallet/VirtualBalanceCard.jsx',
  'src/components/wallet/TradeModal.jsx',
  'src/components/charting/AdvancedPriceChart.jsx',
  'src/components/wallet/CryptoPriceChart.jsx',
  'src/components/wallet/PortfolioChart.jsx',
  'src/components/market/CandlestickModal.jsx',
  'src/pages/DEXSavings.jsx',
  'src/components/home/HomeMarketOverview.jsx',
  'src/components/admin/ServerMonitorPanel.jsx',
  'src/components/admin/APIControlPanel.jsx',
];

const FORBIDDEN_HOSTS=[
  'api.coingecko.com',
  'api.coinlore.net',
  'min-api.cryptocompare.com',
  'stream.binance.com',
  'api.binance.com',
  'exchangerate-api.com/v4/latest/USD',
];

test('primary customer market paths do not contact external price providers directly',async()=>{
  for(const path of FILES){
    const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
    for(const host of FORBIDDEN_HOSTS) assert.ok(!source.toLowerCase().includes(host.toLowerCase()), `${path} must not contact ${host}`);
  }
});

test('realtime customer hooks do not open venue WebSockets',async()=>{
  for(const path of ['src/components/market/useLivePrices.jsx','src/components/market/LiveTickerBar.jsx','src/components/wallet/useRealtimePrices.jsx','src/pages/PriceTracker.jsx']){
    const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
    assert.doesNotMatch(source,/new\s+WebSocket\s*\(/,path);
    assert.match(source,/\/api\/(market-feed-hot|market-hot|market-snapshot-page)/,path);
  }
});
