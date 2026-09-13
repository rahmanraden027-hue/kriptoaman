import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public landing renders without waiting for account session detection', async () => {
  const app = await read('src/App.jsx');

  assert.match(app, /const AUTH_OPTIONAL_PATHS = new Set/);
  assert.match(app, /'\/'/);
  assert.match(app, /const canRenderWithoutAuth = AUTH_OPTIONAL_PATHS\.has\(pathname\)/);
  assert.match(app, /if \(!canRenderWithoutAuth && \(isLoadingPublicSettings \|\| isLoadingAuth\)\)/);
});

test('protected routes retain their authentication loading gate', async () => {
  const app = await read('src/App.jsx');

  assert.match(app, /<Route element=\{<ProtectedRoute/);
  assert.match(app, /<Route path="\/dashboard"/);
});
