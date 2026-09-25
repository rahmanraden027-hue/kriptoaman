import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const RUNTIME_ROOTS = ['src', 'base44', 'public'];

function runtimeFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return runtimeFiles(fullPath);
    return [fullPath];
  });
}

function findRuntimeMatches(pattern) {
  return RUNTIME_ROOTS.flatMap((root) => runtimeFiles(path.join(ROOT, root)))
    .filter((file) => pattern.test(fs.readFileSync(file, 'utf8')))
    .map((file) => path.relative(ROOT, file));
}

test('SecureVault is absent from production routes, bundles, entities, and functions', () => {
  assert.deepEqual(findRuntimeMatches(/SecureVault/), []);
});

test('legacy CoinVault identity is absent from runtime-delivered source', () => {
  assert.deepEqual(findRuntimeMatches(/coinvault/i), []);
});

test('TOTP recovery codes use cryptographic randomness', () => {
  const setup = fs.readFileSync(path.join(ROOT, 'base44/functions/setupTOTP/entry.ts'), 'utf8');
  assert.match(setup, /crypto\.getRandomValues/);
  assert.doesNotMatch(setup, /Math\.random/);
});

test('security settings do not fabricate TOTP verification or login activity', () => {
  const settings = fs.readFileSync(path.join(ROOT, 'src/components/settings/SecuritySection.jsx'), 'utf8');
  assert.doesNotMatch(settings, /accept any 6 digit code|generateMockDevices|generateLoginHistory|Math\.random/i);
});

test('financial execution functions fail closed without simulated success', () => {
  for (const functionName of ['executeDEXOrder', 'gridTradingExecute', 'monitorDEXOrders']) {
    const source = fs.readFileSync(path.join(ROOT, `base44/functions/${functionName}/entry.ts`), 'utf8');
    assert.match(source, /status:\s*'UNAVAILABLE'/);
    assert.match(source, /status:\s*503/);
    assert.doesNotMatch(source, /Math\.random|SIMULATED|sim_/);
  }
});

test('multi-asset endpoint does not fabricate unavailable prices', () => {
  const source = fs.readFileSync(path.join(ROOT, 'base44/functions/getMultiAssetMarketData/entry.ts'), 'utf8');
  assert.doesNotMatch(source, /Math\.random|generateForexMockData|generateIndicesMockData|generateCommoditiesMockData|api\.example\.com/);
  assert.match(source, /status:\s*'UNAVAILABLE'/);
});

test('runtime source has no random production data outside explicit paper trading', () => {
  const matches = findRuntimeMatches(/Math\.random/)
    .filter((file) => file !== 'src/lib/paperTrading.js')
    .filter((file) => file !== 'base44/functions/runPaperTradeSimulation/entry.ts');
  assert.deepEqual(matches, []);
});
