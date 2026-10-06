import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11I synchronizes active production labels to ZEVARYQ', async () => {
  const [notifications, fallback, founder, analytics, rpcPolicy, readiness] = await Promise.all([
    read('src/pages/NotificationCenterV2.jsx'),
    read('src/components/AppErrorBoundary.jsx'),
    read('src/pages/Founder.jsx'),
    read('src/pages/AdminKAMAnalytics.jsx'),
    read('src/pages/RPCPrivacyPolicy.jsx'),
    read('src/pages/KAMLaunchReadiness.jsx'),
  ]);

  assert.match(notifications, /label: 'ZEVARYQ Network'/);
  assert.doesNotMatch(notifications, /label: 'KAM Network'/);

  assert.match(fallback, /href="\/KAMNetwork"[^>]*>ZEVARYQ Network<\/a>/);
  assert.doesNotMatch(fallback, /href="\/KAM"[^>]*>KAM Network<\/a>/);

  assert.match(founder, /KriptoAman, ZEVARYQ Network, Explorer/);
  assert.doesNotMatch(founder, /KriptoAman, KAM Network, explorer/);

  assert.match(analytics, /KRIPTOAMAN REWARDS INTELLIGENCE/);
  assert.doesNotMatch(analytics, /KAM NETWORK INTELLIGENCE/);

  assert.match(rpcPolicy, /ZEVARYQ Public RPC Privacy Policy/);
  assert.match(rpcPolicy, /ZEVARYQ Network \(Chain ID 22028 \/ 0x560c\)/);
  assert.match(rpcPolicy, /ZEVARYQ Network Documentation/);
  assert.doesNotMatch(rpcPolicy, /KAM Public RPC Privacy Policy|KAM network candidate|KAM Network Documentation/);

  assert.match(readiness, /ZEVARYQ MAINNET PROMOTION/);
  assert.doesNotMatch(readiness, /KAM MAINNET PROMOTION/);
});

test('Phase 11I preserves clearly marked historical KAM archives', async () => {
  const [archive, research] = await Promise.all([
    read('src/pages/KAM.jsx'),
    read('src/pages/KAMResearchPaper.jsx'),
  ]);

  assert.match(archive, /ARSIP HISTORIS KAM/);
  assert.match(archive, /identitas ZEVARYQ \/ ZVQ/);
  assert.match(research, /Historical Archive — KAM Mainnet Architecture/);
  assert.match(research, /current production network identity is ZEVARYQ Mainnet/);
});
