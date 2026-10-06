import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 16E freezes the accepted visual architecture and remains read-only', async () => {
  const manifest = JSON.parse(await read('release/phase16e-production-observation-baseline.json'));
  assert.equal(manifest.phase, '16E');
  assert.equal(manifest.architectureFrozen, true);
  assert.equal(manifest.visualBaseline, 'phase16c-final-command-center-v1');
  assert.equal(manifest.postMergeLock, 'phase16d');
  assert.equal(manifest.mutationPolicy.readOnly, true);
  for (const key of ['uiRedesignAllowed','genesis','validators','privateKeys','balances','tokenSupply','transactions','walletBroadcasting','custody','dns','rpcWritePolicy','consensus']) {
    assert.equal(manifest.mutationPolicy[key], false, key + ' must remain false');
  }
});

test('Phase 16E observes market freshness and first-party ZEVARYQ evidence', async () => {
  const script = await read('scripts/observe-phase16e-production.mjs');
  for (const marker of [
    '/api/health',
    '/api/market-snapshot-page',
    '/api/kam/network-status',
    '/api/zvq-token-intelligence',
    '/developer/network.json',
    '/api/v2/blocks',
    'eth_chainId',
    'eth_blockNumber',
    'first-party',
    'rpc.kriptoaman.com',
    'marketFreshnessMs',
    'maximumCrossSurfaceBlockDelta',
    'explorerMaximumLagBlocks'
  ]) assert.ok(script.includes(marker), marker);

  assert.match(script, /rpcBlock2 > rpcBlock1/);
  assert.match(script, /Number\(n2\.blockNumber\) >= Number\(n1\.blockNumber\)/);
  assert.match(script, /Number\(o2\.head\.number\) >= Number\(o1\.head\.number\)/);
  assert.match(script, /explorerBlock2 >= explorerBlock1/);
  assert.doesNotMatch(script, /eth_sendTransaction|eth_sendRawTransaction|wallet_requestPermissions|private.?key/i);
});

test('Phase 16E runs as an hourly observation and publishes machine-readable evidence', async () => {
  const workflow = await read('.github/workflows/phase16e-production-observation.yml');
  assert.match(workflow, /cron: '23 \* \* \* \*'/);
  assert.match(workflow, /node scripts\/observe-phase16e-production\.mjs/);
  assert.match(workflow, /phase16e-production-observation/);
  assert.match(workflow, /retention-days: 30/);
  assert.match(workflow, /kriptoaman\/phase16e-production-observation/);
  assert.match(workflow, /statuses: write/);
});
