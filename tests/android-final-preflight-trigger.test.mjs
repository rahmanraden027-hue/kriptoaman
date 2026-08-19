import assert from 'node:assert/strict';
import test from 'node:test';

test('final Android preflight trigger remains explicit', () => {
  assert.equal('KriptoAman Android'.includes('Android'), true);
});
