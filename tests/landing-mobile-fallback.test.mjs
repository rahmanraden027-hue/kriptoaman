import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public landing has a responsive CSS safety net for mobile rendering', async () => {
  const styles = await read('src/components/landing/GlobalLandingStyles.jsx');
  assert.match(styles, /\.ka-landing header nav\{display:none;/);
  assert.match(styles, /@media \(max-width:1023px\)/);
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(styles, /flex-direction:column/);
  assert.match(styles, /#beranda \.ka-sec-title/);
});

test('desktop landing restores navigation and two-column hero', async () => {
  const styles = await read('src/components/landing/GlobalLandingStyles.jsx');
  assert.match(styles, /@media \(min-width:1024px\)/);
  assert.match(styles, /header nav\{display:flex/);
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
});
