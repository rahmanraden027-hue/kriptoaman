import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { probeMarketFreshness, MARKET_WARM_URL } from '../ops/market-freshness-cron/worker.mjs';

const NOW = Date.parse('2026-10-09T05:00:00Z');
const good = () => ({
  assetCount: 4925, source: 'coinlore', capturedAt: NOW - 5 * 60_000,
  ageMs: 5 * 60_000, stale: false, healthy: true,
  chunkReady: true, chunkCount: 50, expectedChunks: 50, refreshPerformed: true,
});
const response = (payload, status = 200) => async (url, options) => {
  assert.equal(url, MARKET_WARM_URL);
  assert.equal(options.method, 'GET');
  return { ok: status === 200, status, json: async () => payload };
};
const probe = (p, status = 200) => probeMarketFreshness(response(p, status), () => NOW);
test('fresh and fully chunked snapshot passes', async () => {
  const result = await probe(good());
  assert.equal(result.status, 'PASS');
  assert.equal(result.assetCount, 4925);
  assert.equal(result.ageMs, 300000);
});
test('outdated snapshot fails closed even if claimed healthy', async () => {
  await assert.rejects(probe({ ...good(), capturedAt: NOW - 16 * 60_000 }), /MARKET_SNAPSHOT_STALE_OR_UNHEALTHY/);
});
test('future capture, insufficient assets and unready chunks fail closed', async () => {
  await assert.rejects(probe({ ...good(), capturedAt: NOW + 1000 }), /MARKET_CAPTURE_INVALID/);
  await assert.rejects(probe({ ...good(), assetCount: 4499 }), /MARKET_ASSET_FLOOR/);
  await assert.rejects(probe({ ...good(), chunkReady: false }), /MARKET_CHUNKS_NOT_READY/);
});
test('stale flag and upstream errors fail closed', async () => {
  await assert.rejects(probe({ ...good(), stale: true }), /MARKET_SNAPSHOT_STALE_OR_UNHEALTHY/);
  await assert.rejects(probe(good(), 503), /MARKET_WARM_HTTP_503/);
});
test('isolated Cron does not expose routes', async () => {
  const config = await readFile(new URL('../ops/market-freshness-cron/wrangler.toml', import.meta.url), 'utf8');
  assert.match(config, /crons = \["\*\/5 \* \* \* \*"\]/);
  assert.match(config, /workers_dev = false/);
  assert.doesNotMatch(config, /(^|\n)\s*(routes?|vars|d1_databases|kv_namespaces)\s*=/);
});
