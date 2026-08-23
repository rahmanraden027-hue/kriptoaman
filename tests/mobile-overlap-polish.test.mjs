import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('mobile shell reserves safe space around fixed ticker and bottom navigation', async () => {
  const css = await read('src/styles/mobile-overlap-final.css');
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /padding-bottom:\s*calc\(7\.5rem/);
  assert.match(css, /ka-global-topbar \+ div\.fixed\.left-0\.right-0\.z-40/);
});

test('mobile touch scrolling remains available without the bright page scrollbar', async () => {
  const css = await read('src/styles/mobile-overlap-final.css');
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(css, /body::\-webkit-scrollbar/);
  assert.doesNotMatch(css, /overflow:\s*hidden\s*!important/);
});

test('final mobile polish is loaded after the existing UI layers', async () => {
  const entry = await read('src/main.jsx');
  const worldClass = entry.indexOf("@/styles/world-class-ui.css");
  const mobileFinal = entry.indexOf("@/styles/mobile-overlap-final.css");
  assert.ok(worldClass >= 0 && mobileFinal > worldClass);
});
