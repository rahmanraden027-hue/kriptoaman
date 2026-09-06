import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('chart service reads persisted KriptoAman history and keeps a browser last-known-good copy', async () => {
  const source = await read('src/components/market/marketDataService.jsx');

  assert.match(source, /\/api\/market-history\?/);
  assert.match(source, /HISTORY_CACHE_PREFIX = 'ka_market_history_v3'/);
  assert.match(source, /browser-last-known-good/);
  assert.match(source, /syntheticCandles: false/);
  assert.match(source, /missingIntervals: 'explicit-not-filled'/);
  assert.match(source, /SUPPORTED_HISTORY_ASSETS/);
  assert.match(source, /numericDays <= 7/);
  assert.match(source, /numericDays <= 80/);
  assert.doesNotMatch(source, /api\.coingecko\.com/);
  assert.doesNotMatch(source, /Math\.random/);
});

test('advanced chart uses persisted history and read-only market prices without direct provider calls', async () => {
  const chart = await read('src/components/charting/AdvancedPriceChart.jsx');

  assert.match(chart, /getHistoricalSeries/);
  assert.match(chart, /getReadOnlyMarketPrices/);
  assert.match(chart, /KriptoAman persisted store/);
  assert.match(chart, /tidak untuk eksekusi transaksi/);
  assert.match(chart, /tidak diisi secara sintetis/);
  assert.doesNotMatch(chart, /api\.coingecko\.com/);
  assert.doesNotMatch(chart, /market_chart\?/);
  assert.doesNotMatch(chart, /\/ohlc\?/);
});

test('mini chart discloses browser last-known-good history instead of presenting it as live', async () => {
  const mini = await read('src/components/wallet/MiniPriceChart.jsx');

  assert.match(mini, /Snapshot tersimpan/);
  assert.match(mini, /data\[0\]\?\.cached/);
  assert.match(mini, /Riwayat grafik belum tersedia/);
});

test('transaction-adjacent BTC trade path remains on a live price function and does not import archived chart data', async () => {
  const [trade, bitcoinApi] = await Promise.all([
    read('src/components/wallet/TradeModal.jsx'),
    read('src/components/wallet/bitcoinApi.jsx'),
  ]);

  assert.match(trade, /getBtcPrice/);
  assert.doesNotMatch(trade, /getHistoricalSeries|getMarketChart|readOnlyMarketPrices/);
  assert.match(bitcoinApi, /getBtcPrice/);
  assert.match(bitcoinApi, /api\.coingecko\.com/);
});

test('server historical read path remains persisted-storage-only with explicit gaps', async () => {
  const api = await read('functions/api/market-history.js');

  assert.match(api, /queryMode: 'persisted-storage-only'/);
  assert.match(api, /syntheticCandles: false/);
  assert.match(api, /missingIntervals: 'explicit-not-filled'/);
  assert.match(api, /FROM market_timeseries_observations/);
  assert.equal(api.includes('fetch('), false);
});
