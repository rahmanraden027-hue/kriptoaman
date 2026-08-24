import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('landing body keeps compact mobile rhythm and safe-area padding', async () => {
  const styles = await read('src/components/landing/GlobalLandingStyles.jsx');
  assert.match(styles, /padding-bottom:max\(24px,env\(safe-area-inset-bottom\)\)/);
  assert.match(styles, /#fitur\{padding-top:32px!important;padding-bottom:24px!important;/);
  assert.match(styles, /#fitur \+ section\{padding-top:16px!important;padding-bottom:24px!important;/);
  assert.match(styles, /#keamanan\{padding-top:36px!important;padding-bottom:36px!important;/);
});

test('platform statistic cards remain bounded on narrow phones', async () => {
  const styles = await read('src/components/landing/GlobalLandingStyles.jsx');
  assert.match(styles, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(styles, /min-height:108px/);
  assert.match(styles, /font-size:clamp\(20px,6\.6vw,30px\)/);
});
