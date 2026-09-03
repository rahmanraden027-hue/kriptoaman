import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('market health metadata path never selects the large snapshot payload', async () => {
  const source = await read('functions/api/market-snapshot.js');
  assert.match(source, /async function readSnapshotMetadata/);
  assert.match(source, /SELECT source, asset_count, captured_at FROM market_snapshots/);
  assert.match(source, /X-KriptoAman-Market-Read': 'metadata-only'/);
  assert.match(source, /const MARKET_CHUNK_SIZE = 100/);
  assert.match(source, /CREATE TABLE IF NOT EXISTS market_snapshot_chunks/);
  assert.match(source, /persistChunks/);
});

test('paged market path prefers fixed chunks and retains safe full-snapshot migration fallback', async () => {
  const source = await read('functions/api/market-snapshot-page.js');
  assert.match(source, /FROM market_snapshot_chunks/);
  assert.match(source, /chunk_index BETWEEN \? AND \?/);
  assert.match(source, /loadChunkPage/);
  assert.match(source, /loadFullFallback/);
  assert.match(source, /snapshotRead: pageResult\.mode/);
  assert.match(source, /chunkSize: MARKET_CHUNK_SIZE/);
  assert.doesNotMatch(source, /SELECT source, asset_count, captured_at, payload FROM market_snapshots/);
});
