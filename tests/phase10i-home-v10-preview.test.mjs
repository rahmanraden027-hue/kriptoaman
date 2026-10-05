import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 10I exposes HomeV10 only on an isolated preview route', async () => {
  const shell = await read('src/FullAppShell.jsx');
  assert.match(shell, /HomeV10Preview/);
  assert.match(shell, /\/preview\/home-v10/);
  assert.match(shell, /DashboardPage/);
  assert.doesNotMatch(shell, /path="\/" element={<HomeV10Preview/);
});

test('Phase 10I visual gate captures mobile tablet and desktop evidence', async () => {
  const workflow = await read('.github/workflows/phase10i-home-v10-preview.yml');
  assert.match(workflow, /width: 390, height: 844, label: 'mobile'/);
  assert.match(workflow, /width: 768, height: 1024, label: 'tablet'/);
  assert.match(workflow, /width: 1440, height: 1080, label: 'desktop'/);
  assert.match(workflow, /horizontal overflow/i);
  assert.match(workflow, /WCAG 2 AA scan/);
  assert.match(workflow, /https:\/\/kriptoaman\.com/);
  assert.match(workflow, /page\.route\('\*\*\/api\/\*\*'/);
});
