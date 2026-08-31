import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const read = (path) => readFile(path, 'utf8');

const REQUIRED_VIEWPORTS = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440, 1920];

test('design system remains locked at final-ui-v9 without new version layers', async () => {
  const files = await readdir('src/styles');
  const versions = files
    .map((name) => /^final-ui-v(\d+)\.css$/.exec(name))
    .filter(Boolean)
    .map((match) => Number(match[1]));

  assert.equal(Math.max(...versions), 9);
  assert.ok(files.includes('final-ui-v9.css'));
});

test('final UI enforces minimum touch target, visible focus, reduced motion and narrow-layout guards', async () => {
  const css = await read('src/styles/final-ui-v9.css');
  assert.match(css, /--ka-ds-control-min:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test('production capacity model defines the complete viewport audit matrix', async () => {
  const doc = await read('docs/PRODUCTION_FINALIZATION.md');
  for (const width of REQUIRED_VIEWPORTS) {
    assert.match(doc, new RegExp(`\\b${width}px\\b`));
  }
});

test('one-million-user target remains evidence gated rather than a capacity claim', async () => {
  const capacity = await read('docs/PRODUCTION_CAPACITY_MODEL.md');
  assert.match(capacity, /not a public capacity claim/i);
  assert.match(capacity, /1,000,000 registered accounts/i);
  assert.match(capacity, /1,000 virtual\/concurrent users/i);
  assert.match(capacity, /10,000 virtual\/concurrent users/i);
  assert.match(capacity, /error rate < 1%/i);
});

test('high-load production profile requires explicit opt-in and remains read-only', async () => {
  const load = await read('load/k6-production-readonly.js');
  assert.match(load, /ALLOW_PRODUCTION_LOAD_TEST === 'YES'/);
  assert.match(load, /http\.get\(/);
  assert.doesNotMatch(load, /http\.(post|put|patch|del|delete)\(/);
  assert.doesNotMatch(load, /eth_sendRawTransaction|eth_sendTransaction|personal_sign|eth_signTypedData/i);
});

test('bundle budget checks total distribution, total javascript and largest chunk', async () => {
  const budget = await read('scripts/release-budget.mjs');
  assert.match(budget, /totalDistBytes/);
  assert.match(budget, /totalJsBytes/);
  assert.match(budget, /largestJsBytes/);
  assert.match(budget, /process\.exit\(report\.ok \? 0 : 1\)/);
});
