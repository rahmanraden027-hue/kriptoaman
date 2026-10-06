import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('device acceptance pack remains preparation-only until Phase 16F 24H passes', async () => {
  const pack = JSON.parse(await read('release/device-acceptance-pack.json'));
  assert.equal(pack.status, 'prepared-not-executed');
  assert.equal(pack.executeAfter, 'phase16f-24h-pass');
  assert.equal(pack.productionMutationAllowed, false);
  assert.equal(pack.frozenBoundary.mergeBefore24hPass, false);
  assert.equal(pack.frozenBoundary.deployBefore24hPass, false);
  assert.equal(pack.canonicalNetwork.chainId, 22028);
  assert.equal(pack.canonicalNetwork.chainIdHex, '0x560c');
  assert.equal(pack.canonicalNetwork.nativeSymbol, 'ZVQ');
});

test('device matrix covers compact Android through desktop plus a physical Android gate', async () => {
  const pack = JSON.parse(await read('release/device-acceptance-pack.json'));
  const ids = new Set(pack.deviceMatrix.map(item => item.id));
  for (const id of ['android-compact','android-standard','android-large','tablet','desktop','physical-android']) {
    assert.ok(ids.has(id), 'missing device profile: ' + id);
  }
  assert.equal(pack.passRules.physicalAndroidEvidenceRequired, true);
  assert.equal(pack.passRules.zeroHorizontalOverflow, true);
  assert.equal(pack.passRules.zeroCriticalJavascriptErrors, true);
});

test('current Platform and Wallet source expose the required acceptance hooks without enabling broadcast', async () => {
  const [home, wallet, css, gate, shell, browser] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/pages/Wallet.jsx'),
    read('src/pages/ZevaryqWallet.css'),
    read('.github/workflows/zvq-wallet-production-gate.yml'),
    read('src/FullAppShell.jsx'),
    read('.github/scripts/phase11e-final-cross-surface.mjs'),
  ]);

  assert.match(home, /safe-area-inset-bottom/);
  assert.match(home, /safe-area-inset-top/);
  assert.match(home, /data-zvq-overall-state/);

  assert.match(shell, /path="\/wallet-app"/);
  assert.match(shell, /<Web3Provider><WalletStandalonePage/);

  for (const marker of ['Connect Wallet','Receive ZVQ','My Wallet Assets','Preview Send','Broadcast Locked']) {
    assert.ok(wallet.includes(marker), 'wallet acceptance marker missing: ' + marker);
  }

  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /\.zv-bottom-nav/);

  assert.match(gate, /VITE_ZEVARYQ_TRANSACTIONS_ENABLED !== 'true'/);
  assert.match(gate, /executionEnabled,false/);
  assert.match(gate, /submitted,true/);
  assert.match(gate, /broadcast,true/);

  assert.match(browser, /scrollWidth <= s\.width \+ 1/);
  assert.match(browser, /minItemHeight >= 44/);
  assert.match(browser, /minItemWidth >= 44/);
  assert.match(browser, /\/wallet-app/);
});

test('device pack explicitly forbids secret collection and real transfer requirements', async () => {
  const pack = JSON.parse(await read('release/device-acceptance-pack.json'));
  assert.equal(pack.securityChecks.privateKeyCollectionAllowed, false);
  assert.equal(pack.securityChecks.mnemonicCollectionAllowed, false);
  assert.equal(pack.securityChecks.seedPhraseCollectionAllowed, false);
  assert.equal(pack.securityChecks.realTransferRequired, false);
  assert.equal(pack.securityChecks.swapBroadcastRequired, false);
  assert.equal(pack.securityChecks.walletBroadcastingExpected, false);
  assert.equal(pack.securityChecks.rpcWritePolicyExpected, false);
});
