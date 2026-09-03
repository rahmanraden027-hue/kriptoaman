import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('broadcast delivery metrics are admin-only, aggregated, and privacy preserving', async () => {
  const endpoint = await readFile(
    new URL('../functions/api/auth/admin/broadcast-progress-metrics.js', import.meta.url),
    'utf8',
  );

  assert.match(endpoint, /verifySessionToken/);
  assert.match(endpoint, /getActiveSession/);
  assert.match(endpoint, /user\.role !== 'admin'/);
  assert.match(endpoint, /RESEND_API_KEY/);
  assert.match(endpoint, /emails/);
  assert.match(endpoint, /last_event/);
  assert.match(endpoint, /deliveredOrEngaged/);
  assert.match(endpoint, /deliveryRateObserved/);
  assert.match(endpoint, /failureRateObserved/);
  assert.match(endpoint, /ecosystem-progress-2026-09-03/);
  assert.match(endpoint, /Perkembangan Positif Ekosistem KriptoAman/);

  // The response must expose aggregate counts only, never recipient addresses.
  assert.doesNotMatch(endpoint, /return json\(\{[^}]*\bto\s*:/s);
  assert.doesNotMatch(endpoint, /return json\(\{[^}]*\bemail\s*:/s);
});
