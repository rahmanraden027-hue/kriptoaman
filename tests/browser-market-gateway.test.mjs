import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const browserFiles = [
  'src/components/wallet/VirtualBalanceCard.jsx',
  'src/components/wallet/TradeModal.jsx',
  'src/components/home/HomeMarketOverview.jsx',
];

test('priority browser market surfaces use first-party KriptoAman gateways', () => {
  for (const path of browserFiles) {
    const source = read(path);
    assert.equal(source.toLowerCase().includes('api.coingecko.com'), false, `${path} must not call CoinGecko directly from the browser`);
    assert.equal(source.toLowerCase().includes('api.alternative.me'), false, `${path} must not call Alternative.me directly from the browser`);
  }

  assert.match(read('src/components/wallet/VirtualBalanceCard.jsx'), /getReadOnlyMarketPrices/);
  assert.match(read('src/components/wallet/TradeModal.jsx'), /getReadOnlyMarketPrices/);
  assert.match(read('src/components/home/HomeMarketOverview.jsx'), /\/api\/market-overview/);
});

test('market overview is D1-first with explicit backup and methodology metadata', () => {
  const source = read('functions/api/market-overview.js');
  assert.match(source, /PRIMARY_SNAPSHOT_ID = 'global'/);
  assert.match(source, /BACKUP_SNAPSHOT_ID = 'global-backup'/);
  assert.match(source, /readBestSnapshot/);
  assert.match(source, /market-cap-weighted-snapshot/);
  assert.match(source, /recoverySnapshot/);
  assert.equal(source.toLowerCase().includes('api.coingecko.com/api/v3/global'), false);
});
