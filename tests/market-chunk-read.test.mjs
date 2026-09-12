import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('market health metadata path never selects the large snapshot payload for ordinary health reads', async () => {
  const source = await read('functions/api/market-snapshot.js');
  assert.match(source, /async function readSnapshotMetadata/);
  assert.match(source, /SELECT source, asset_count, captured_at FROM market_snapshots/);
  assert.match(source, /X-KriptoAman-Market-Read': 'metadata-only'/);
  assert.match(source, /const MARKET_CHUNK_SIZE = 100/);
  assert.match(source, /CREATE TABLE IF NOT EXISTS market_snapshot_chunks/);
  assert.match(source, /persistChunks/);
});

test('forced warm repairs missing chunks from the persisted snapshot without requiring upstream refresh', async () => {
  const source = await read('functions/api/market-snapshot.js');
  const workflow = await read('.github/workflows/market-snapshot-warm.yml');
  assert.match(source, /async function readChunkCoverage/);
  assert.match(source, /async function backfillChunksFromPersistedSnapshot/);
  assert.match(source, /if \(!chunkCoverage\.ready\)/);
  assert.match(source, /chunkReady: Boolean\(chunkCoverage\?\.ready\)/);
  assert.match(source, /chunkBackfilled/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /payload\.chunkReady !== true/);
  assert.match(workflow, /payload\.delivery\?\.snapshotRead !== 'chunk-d1'/);
  assert.match(workflow, /page=11&limit=300/);
});

test('paged market path rejects mixed-generation chunks before falling back to the full snapshot', async () => {
  const source = await read('functions/api/market-snapshot-page.js');
  assert.match(source, /FROM market_snapshot_chunks/);
  assert.match(source, /chunk_index BETWEEN \? AND \?/);
  assert.match(source, /rows\.some\(\(row\) => Number\(row\.captured_at\) !== Number\(capturedAt\)\)/);
  assert.match(source, /loadChunkPage/);
  assert.match(source, /loadFullFallback/);
  assert.match(source, /snapshotRead: pageResult\.mode/);
  assert.match(source, /chunkSize: MARKET_CHUNK_SIZE/);
  assert.doesNotMatch(source, /SELECT source, asset_count, captured_at, payload FROM market_snapshots/);
});

test('market snapshot keeps a validated rolling full-row backup before replacing the primary snapshot', async () => {
  const source = await read('functions/api/market-snapshot.js');
  assert.match(source, /const BACKUP_SNAPSHOT_ID = 'global-backup'/);
  assert.match(source, /async function copyPrimarySnapshotToBackup/);
  assert.match(source, /const current = decodeSnapshot/);
  assert.match(source, /const backupCreated = await copyPrimarySnapshotToBackup\(db\)/);
  assert.match(source, /backupMode: 'rolling-full-row'/);
  assert.match(source, /recoverySnapshot: snapshot\.snapshot_id === BACKUP_SNAPSHOT_ID/);
});

test('paged and hot market reads can recover from the rolling backup snapshot', async () => {
  const page = await read('functions/api/market-snapshot-page.js');
  const hot = await read('functions/api/market-hot.js');
  assert.match(page, /const BACKUP_SNAPSHOT_ID = 'global-backup'/);
  assert.match(page, /backup-full-fallback/);
  assert.match(page, /X-KriptoAman-Market-Recovery/);
  assert.match(hot, /const SNAPSHOT_IDS = \['global', 'global-backup'\]/);
  assert.match(hot, /snapshot-backup:/);
  assert.match(hot, /rollingBackupFallback: true/);
});

test('wallet BTC display price no longer exposes a browser CoinGecko key and uses durable first-party data', async () => {
  const source = await read('src/components/wallet/bitcoinApi.jsx');
  assert.match(source, /fetch\('\/api\/market-hot'/);
  assert.match(source, /fetch\('\/api\/market-snapshot-page\?page=0&limit=500'/);
  assert.doesNotMatch(source, /COINGECKO_API_KEY/);
  assert.equal(source.includes('api.coingecko.com'), false);
});
