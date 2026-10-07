import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('dual visual architecture separates ecosystem understanding from network inspection', async () => {
  const [home, hero, network] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/components/home-v10/CommandCenterHero.jsx'),
    read('src/pages/ZEVARYQ.jsx'),
  ]);

  assert.match(home, /data-visual-architecture="understand-ecosystem-v1"/);
  assert.match(home, /data-network-inspection-route="\/ZEVARYQ"/);
  assert.match(hero, /data-architecture-action="understand-ecosystem"/);
  assert.match(hero, /Jelajahi Ekosistem/);
  assert.match(hero, /data-architecture-action="inspect-network"/);
  assert.match(hero, /Live Network/);

  assert.match(network, /data-product-surface="network"/);
  assert.match(network, /data-product-release="phase15f"/);
  assert.match(network, /data-visual-architecture="inspect-network-v1"/);
  assert.match(network, /KRIPTOAMAN · INSPECT THE NETWORK/);
  assert.match(network, /Understand Ecosystem/);
});

test('inspect-network uses verified first-party live-block evidence and fail-closed states', async () => {
  const [network, hook] = await Promise.all([
    read('src/pages/ZEVARYQ.jsx'),
    read('src/hooks/useZevaryqNetworkInspection.js'),
  ]);

  assert.match(hook, /const ENDPOINT = '\/api\/zvq-live-blocks'/);
  assert.match(hook, /payload\?\.status === 'live'/);
  assert.match(hook, /Number\(payload\?\.chainId\) === 22028/);
  assert.match(hook, /payload\?\.provenance\?\.ownership === 'first-party'/);
  assert.match(hook, /payload\?\.provenance\?\.rpcEndpoint === 'rpc\.kriptoaman\.com'/);
  assert.match(hook, /DATA_STATE\.UNAVAILABLE/);
  assert.match(hook, /DATA_STATE\.DELAYED/);
  assert.match(hook, /DATA_STATE\.LIVE/);

  assert.match(network, /Pending TX/);
  assert.match(network, /NOT EXPOSED/);
  assert.match(network, /No synthetic mempool count/);
  assert.match(network, /VALIDATOR SET · NOT EXPOSED/);
  assert.match(network, /not equivalent to full validator-set evidence/);
  assert.match(network, /data-network-data-policy="verified-first-party-only"/);
});

test('inspect-network derives visual metrics only from verified block data', async () => {
  const network = await read('src/pages/ZEVARYQ.jsx');

  assert.match(network, /Block Activity/);
  assert.match(network, /Block Utilization/);
  assert.match(network, /Recent Verified Blocks/);
  assert.match(network, /Observed Proposers/);
  assert.match(network, /Indexer lag/);
  assert.match(network, /Average block time/);
  assert.match(network, /data-network-inspection-globe="signature-v1"/);

  assert.doesNotMatch(network, /512\s*nodes|342\s*validators|32\s*countries|2,418\s*TXs\/s|1\.82\s*MB\/s/);
  assert.doesNotMatch(network, /Binance Node|OKX Node|Kraken Node|New York|Tokyo|Frankfurt/);
  assert.doesNotMatch(network, /sat\/vB/);
});

test('dual visual architecture remains read-only and presentation-only', async () => {
  const source = [
    await read('src/pages/HomeV10.jsx'),
    await read('src/components/home-v10/CommandCenterHero.jsx'),
    await read('src/pages/ZEVARYQ.jsx'),
    await read('src/hooks/useZevaryqNetworkInspection.js'),
  ].join('\n');

  assert.doesNotMatch(source, /eth_sendRawTransaction|eth_sendTransaction|personal_|private.?key|validator.?key|genesis/i);
});
