import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const assets = ['ZVQ', 'ZEVARYQ_NETWORK', 'zBTC', 'zETH', 'zUSDT', 'zUSDC', 'zBNB', 'zSOL', 'zTRX', 'zXRP', 'zADA', 'zDOGE'];
const root = join(process.cwd(), 'public/assets/zevaryq/tokens');

test('all twelve approved premium PNG files exist and have 1024x1024 PNG headers', () => {
  for (const symbol of assets) {
    const path = join(root, symbol + '.png');
    assert.ok(existsSync(path), `Missing approved logo: ${path}`);
    const buffer = readFileSync(path);
    assert.ok(buffer.length > 24, `Empty or truncated logo: ${symbol}`);
    assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `Invalid PNG: ${symbol}`);
    assert.equal(buffer.readUInt32BE(16), 1024, `Wrong width: ${symbol}`);
    assert.equal(buffer.readUInt32BE(20), 1024, `Wrong height: ${symbol}`);
  }
});
