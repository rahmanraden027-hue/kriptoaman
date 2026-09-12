import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('primary navigation is bilingual and meets mobile touch sizing', async () => {
  const layout = await read('src/Layout.jsx');
  assert.match(layout, /NAV_LABELS/);
  assert.match(layout, /Beranda/);
  assert.match(layout, /Peringatan/);
  assert.match(layout, /min-h-\[62px\]/);
});

test('home is focused and avoids duplicate mobile market surfaces', async () => {
  const home = await read('src/pages/Home.jsx');
  assert.doesNotMatch(home, /HomeLiveMarket/);
  assert.doesNotMatch(home, /HomeTrendingCoins/);
  assert.match(home, /hidden md:block/);
  assert.match(home, /max-w-7xl/);
});

test('market trust widgets disclose source time and asset quality', async () => {
  const [ai, volume, overview] = await Promise.all([
    read('src/components/home/AIInsightCard.jsx'),
    read('src/components/home/WhaleAlertCard.jsx'),
    read('src/components/home/HomeMarketOverview.jsx'),
  ]);
  assert.match(ai, /Bukan rekomendasi investasi/);
  assert.match(ai, /updatedAt/);
  assert.match(volume, /market_cap_rank <= 100/);
  assert.match(volume, /berkapitalisasi besar/);
  assert.match(volume, /ambang volume minimum/);
  assert.match(volume, /bukan verifikasi legitimasi aset/);
  assert.match(volume, /bukan .*rekomendasi investasi/);
  assert.match(overview, /KriptoAman Market Database \+ Alternative\.me/);
  assert.match(overview, /\/api\/market-overview/);
  assert.match(overview, /Diperbarui/);
  assert.match(overview, /Data informatif, bukan harga eksekusi/);
  assert.equal(overview.toLowerCase().includes('api.coingecko.com'), false);
  assert.equal(overview.toLowerCase().includes('api.alternative.me'), false);
});

test('empty and sparse pages provide useful next actions', async () => {
  const [wallet, alerts, news, profile] = await Promise.all([
    read('src/pages/Wallet.jsx'),
    read('src/pages/Alerts.jsx'),
    read('src/components/home/HomeNews.jsx'),
    read('src/pages/Profile.jsx'),
  ]);
  assert.match(wallet, /Status pemantauan/);
  assert.match(wallet, /Aktivitas pemantauan terbaru/);
  assert.match(alerts, /Cara kerja peringatan/);
  assert.match(alerts, /Notification' in window/);
  assert.match(news, /Umpan berita sedang tidak tersedia/);
  assert.match(profile, /Peran sistem/);
  assert.match(profile, /Sesi perangkat/);
});
