import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { LOGO_CONTRACT, verifyLogoPlacement } from '../scripts/verify-zvq-logo-placement.mjs';
const html = await readFile(new URL('../explorer-dashboard/zevaryq-production.html', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/zvq-official-logo-public-proof.yml', import.meta.url), 'utf8');
test('Visual Master V3 public and local proof use the same two-slot contract', () => {
  assert.equal(verifyLogoPlacement(html).placements, 2);
  assert.ok(workflow.includes('node scripts/verify-zvq-logo-placement.mjs "$scratch/$label-$page.html"'));
  assert.ok(workflow.includes('tests/zvq-logo-placement-contract.test.mjs'));
  assert.ok(!workflow.includes('placements=3'));
});
test('missing, duplicated or wrong-source logo never passes', () => {
  const image = '<img class="official-emblem"';
  assert.throws(() => verifyLogoPlacement(html.replace(image, '<img class="missing"')));
  assert.throws(() => verifyLogoPlacement(html.replace('</body>', `<img class="official-emblem" src="${LOGO_CONTRACT.source}"></body>`)));
  assert.throws(() => verifyLogoPlacement(html.replace(`src="${LOGO_CONTRACT.source}"`, 'src="/wrong.svg"')));
  assert.throws(() => verifyLogoPlacement(html.replace('class="earth-brandmark"', 'class="wrong-slot"')));
});
