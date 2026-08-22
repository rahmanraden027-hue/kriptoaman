import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('global style layers keep the reviewed release order', async () => {
  const entry = await read('src/main.jsx');
  const imports = [
    "import '@/index.css'",
    "import '@/styles/workspace-polish.css'",
    "import '@/styles/admin-suite.css'",
    "import '@/styles/final-ui-2026.css'",
    "import '@/styles/final-ui-v2.css'",
    "import '@/styles/final-ui-v3.css'",
    "import '@/styles/final-ui-v4.css'",
    "import '@/styles/final-ui-v5.css'",
    "import '@/styles/final-ui-v6.css'",
    "import '@/styles/final-ui-v7.css'",
    "import '@/styles/final-ui-v8.css'",
    "import '@/styles/final-ui-v9.css'",
    "import '@/styles/world-class-ui.css'",
  ];

  let previous = -1;
  for (const item of imports) {
    const position = entry.indexOf(item);
    assert.ok(position > previous, `${item} must remain in the reviewed cascade order`);
    previous = position;
  }
});

test('no new final-ui version layer is added beyond the reviewed v9 baseline', async () => {
  const stylesDir = new URL('../src/styles/', import.meta.url);
  const files = await readdir(stylesDir);
  const versioned = files
    .filter((name) => /^final-ui-v\d+\.css$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  assert.deepEqual(versioned, [
    'final-ui-v2.css',
    'final-ui-v3.css',
    'final-ui-v4.css',
    'final-ui-v5.css',
    'final-ui-v6.css',
    'final-ui-v7.css',
    'final-ui-v8.css',
    'final-ui-v9.css',
  ]);
});

test('world-class layer retains responsive and reduced-motion guardrails', async () => {
  const worldUi = await read('src/styles/world-class-ui.css');
  assert.match(worldUi, /\.ka-global-topbar/);
  assert.match(worldUi, /\.ka-global-sidebar/);
  assert.match(worldUi, /\.ka-embedded-nav/);
  assert.match(worldUi, /env\(safe-area-inset-bottom/);
  assert.match(worldUi, /prefers-reduced-motion/);
});
