import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('first-party listener is ZEVARYQ-pinned and defaults to local RPC', async () => {
  const config = await read('services/kriptoaman-chain-listener/src/config.mjs');
  assert.match(config, /chainId:\s*int\(process\.env\.CHAIN_ID, 22028\)/);
  assert.match(config, /0x560c/);
  assert.match(config, /http:\/\/127\.0\.0\.1:8648/);
  assert.match(config, /STARTUP_LOOKBACK_BLOCKS, 64/);
  assert.doesNotMatch(config, /coingecko|dexscreener|geckoterminal|alchemy|infura|quicknode/i);
});

test('listener exposes read-only REST and downstream websocket stream', async () => {
  const server = await read('services/kriptoaman-chain-listener/src/server.mjs');
  assert.match(server, /\/v1\/tokens/);
  assert.match(server, /\/v1\/pools/);
  assert.match(server, /\/v1\/events/);
  assert.match(server, /\/stream/);
  assert.match(server, /lastEventId/);
  assert.match(server, /config\.healthMaxAgeMs/);
  assert.match(server, /ok \? 200 : 503/);
  assert.match(server, /eventsAfter\(since, 1000\)/);
  assert.match(server, /read_only_service/);
  assert.doesNotMatch(server, /POST.*send|eth_send|personal_|admin_/i);
});

test('listener detects token contracts, allowlisted pair factories and reorgs', async () => {
  const indexer = await read('services/kriptoaman-chain-listener/src/indexer.mjs');
  assert.match(indexer, /PAIR_CREATED_TOPIC/);
  assert.match(indexer, /factoryAddresses/);
  assert.match(indexer, /token\.detected/);
  assert.match(indexer, /pool\.detected/);
  assert.match(indexer, /chain\.reorg/);
  assert.match(indexer, /rewindFrom/);
  assert.match(indexer, /blockTimestamp/);
  assert.match(indexer, /nodeReceivedAt/);
  assert.match(indexer, /indexedAt/);
});

test('service contains no signing, private key, transaction broadcast or external market feed dependency', async () => {
  const paths = [
    'services/kriptoaman-chain-listener/src/config.mjs',
    'services/kriptoaman-chain-listener/src/rpc.mjs',
    'services/kriptoaman-chain-listener/src/store.mjs',
    'services/kriptoaman-chain-listener/src/server.mjs',
    'services/kriptoaman-chain-listener/src/indexer.mjs',
    'services/kriptoaman-chain-listener/src/index.mjs',
  ];
  const content = (await Promise.all(paths.map(read))).join('\n');
  assert.doesNotMatch(content, /private.?key|mnemonic|eth_sendRawTransaction|eth_sendTransaction|personal_unlockAccount/i);
  assert.doesNotMatch(content, /api\.coingecko|dexscreener|geckoterminal|coinmarketcap|alchemy|infura|quicknode/i);
});
