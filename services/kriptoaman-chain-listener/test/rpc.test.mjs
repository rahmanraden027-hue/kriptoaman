import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeAbiString, decodeUint, hexToNumber, normalizeAddress } from '../src/rpc.mjs';

test('hex and address codecs are deterministic', () => {
  assert.equal(hexToNumber('0x560c'), 22028);
  assert.equal(hexToNumber('bad'), null);
  assert.equal(normalizeAddress('0x1234567890123456789012345678901234567890'), '0x1234567890123456789012345678901234567890');
  assert.equal(normalizeAddress('0x1234'), null);
  assert.equal(decodeUint('0x12'), '18');
});

test('ABI string decoder supports dynamic strings and bytes32-style strings', () => {
  const text = Buffer.from('ZVQ').toString('hex').padEnd(64, '0');
  assert.equal(decodeAbiString(`0x${text}`), 'ZVQ');

  const dynamic = '0'.repeat(62) + '20' + '0'.repeat(63) + '3' + text;
  assert.equal(decodeAbiString(`0x${dynamic}`), 'ZVQ');
});
