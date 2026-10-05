import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 8 first-screen metrics are locked to the authoritative platform snapshot', async () => {
  const page = await read('src/pages/KriptoAmanGlobalLanding.jsx');

  assert.match(page, /function authoritativeSnapshot\(payload\)/);
  assert.match(page, /const market = payload\?\.components\?\.market/);
  assert.match(page, /const networks = payload\?\.components\?\.networks/);
  assert.match(page, /const kam = payload\?\.components\?\.kam/);
  assert.match(page, /Object\.assign\(next, authoritativeSnapshot\(platformPayload\)\)/);
  assert.match(page, /networkActiveCount: Number\.isFinite\(networkOnline\) \? networkOnline : undefined/);
  assert.match(page, /zvqBlockNumber: kam\.status === 'operational'/);
  assert.match(page, /snapshotGeneratedAt: payload\?\.generatedAt/);
  assert.match(page, /snapshotReadMode: payload\?\.delivery\?\.aggregateRead/);
});

test('detail endpoints may enrich evidence but cannot overwrite authoritative headline counts', async () => {
  const page = await read('src/pages/KriptoAmanGlobalLanding.jsx');

  const networkStart = page.indexOf("if (networkResult.status === 'fulfilled')");
  const networkEnd = page.indexOf("if (kamResult.status === 'fulfilled')");
  const networkBlock = page.slice(networkStart, networkEnd);
  assert.match(networkBlock, /next\.networks = payload\.networks/);
  assert.doesNotMatch(networkBlock, /networkActiveCount\s*=/);
  assert.doesNotMatch(networkBlock, /zvqBlockNumber\s*=/);

  const kamStart = page.indexOf("if (kamResult.status === 'fulfilled')");
  const setStatsIndex = page.indexOf('setStats(next);', kamStart);
  const kamBlock = page.slice(kamStart, setStatsIndex);
  assert.match(kamBlock, /telemetryVerified/);
  assert.match(kamBlock, /next\.zvqSyncStatus/);
  assert.match(kamBlock, /next\.zvqProbeDurationMs/);
  assert.doesNotMatch(kamBlock, /next\.networkActiveCount\s*=/);
  assert.doesNotMatch(kamBlock, /next\.zvqBlockNumber\s*=/);
  assert.doesNotMatch(kamBlock, /next\.overall\s*=/);
});

test('periodic refresh updates the full authoritative snapshot atomically', async () => {
  const page = await read('src/pages/KriptoAmanGlobalLanding.jsx');

  assert.match(page, /const refreshAuthoritativeSnapshot = async \(\) =>/);
  assert.match(page, /fetch\('\/api\/platform-status'/);
  assert.match(page, /const snapshot = authoritativeSnapshot\(payload\)/);
  assert.match(page, /\.\.\.snapshot/);
  assert.match(page, /const authoritativeSnapshotTimer = window\.setInterval\(refreshAuthoritativeSnapshot, 15_000\)/);
  assert.match(page, /window\.clearInterval\(authoritativeSnapshotTimer\)/);
  assert.doesNotMatch(page, /const refreshZvqHead/);
});

console.log('phase 8 authoritative snapshot lock regression: ok');
