import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const metadataPath = new URL('../public/token/skam.json', import.meta.url);
const logoPath = new URL('../public/token/skam-logo.png', import.meta.url);
const headersPath = new URL('../public/_headers', import.meta.url);

test('sKAM public metadata is indexer-friendly and identity-pinned', async () => {
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  assert.equal(metadata.name, 'Solana KAM');
  assert.equal(metadata.symbol, 'sKAM');
  assert.equal(metadata.image, 'https://kriptoaman.com/token/skam-logo.png');
  assert.equal(metadata.external_url, 'https://kriptoaman.com');
  assert.equal(metadata.properties?.category, 'image');
  assert.deepEqual(metadata.properties?.files, [
    { uri: 'https://kriptoaman.com/token/skam-logo.png', type: 'image/png' },
  ]);
});

test('sKAM logo is a square PNG large enough for wallet/indexer display', async () => {
  const png = await readFile(logoPath);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.toString('ascii', 12, 16), 'IHDR');
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(width, height, `logo must be square, got ${width}x${height}`);
  assert.ok(width >= 256, `logo must be at least 256x256, got ${width}x${height}`);
});

test('sKAM metadata and logo are explicitly available cross-origin', async () => {
  const headers = await readFile(headersPath, 'utf8');
  for (const route of ['/token/*.json', '/token/*.png']) {
    const start = headers.indexOf(route);
    assert.notEqual(start, -1, `${route} header block missing`);
    const block = headers.slice(start, headers.indexOf('\n\n', start));
    assert.match(block, /Access-Control-Allow-Origin:\s*\*/);
    assert.match(block, /Cross-Origin-Resource-Policy:\s*cross-origin/);
    assert.match(block, /Cache-Control:\s*public/);
  }
});
