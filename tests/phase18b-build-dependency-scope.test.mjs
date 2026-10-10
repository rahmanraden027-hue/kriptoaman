import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Tailwind animation plugin is build-only in the manifest and npm lockfile', async () => {
  const [manifest, lock] = await Promise.all([
    read('package.json').then(JSON.parse),
    read('package-lock.json').then(JSON.parse),
  ]);
  const version = '^1.0.7';
  assert.equal(manifest.dependencies['tailwindcss-animate'], undefined);
  assert.equal(manifest.devDependencies['tailwindcss-animate'], version);
  assert.equal(lock.packages[''].dependencies['tailwindcss-animate'], undefined);
  assert.equal(lock.packages[''].devDependencies['tailwindcss-animate'], version);
  assert.equal(lock.packages['node_modules/tailwindcss-animate']?.dev, true);
  for (const name of ['tailwindcss', 'braces', 'chokidar', 'fast-glob', 'micromatch']) {
    assert.equal(lock.packages[`node_modules/${name}`]?.dev, true, `${name} must be build-only in lockfile`);
  }
});

test('Tailwind plugin remains available to the Vite/PostCSS build and security gate remains fail-closed', async () => {
  const [config, audit] = await Promise.all([
    read('tailwind.config.js'),
    read('scripts/audit-production-deps.mjs'),
  ]);
  assert.match(config, /require\(["']tailwindcss-animate["']\)/);
  assert.match(audit, /--omit=dev/);
  assert.match(audit, /--audit-level=high/);
  assert.match(audit, /Production dependency audit found a high\/critical vulnerability/);
});
