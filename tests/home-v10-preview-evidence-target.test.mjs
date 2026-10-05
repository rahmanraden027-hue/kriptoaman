import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/home-v10-preview-evidence.yml', import.meta.url), 'utf8');

test('HomeV10 PR evidence evaluates the built candidate instead of guessed branch hosting', () => {
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /vite preview --host 127\.0\.0\.1 --port 4173/);
  assert.match(workflow, /target='http:\/\/127\.0\.0\.1:4173\/preview\/home-v10'/);
  assert.doesNotMatch(workflow, /github\.head_ref/);
  assert.doesNotMatch(workflow, /kriptoaman\.pages\.dev/);
});

test('manual HomeV10 evidence can still target the production preview route', () => {
  assert.match(workflow, /target='https:\/\/kriptoaman\.com\/preview\/home-v10'/);
  assert.match(workflow, /github\.event_name.*pull_request/);
});
