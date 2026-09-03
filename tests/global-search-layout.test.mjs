import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('global search launcher is docked in the app top bar instead of floating over page content', async () => {
  const [layout, workspace] = await Promise.all([
    read('src/Layout.jsx'),
    read('src/components/workspace/WorkspaceExperience.jsx'),
  ]);

  assert.match(layout, /Search,/);
  assert.match(layout, /window\.dispatchEvent\(new Event\('ka:open-global-search'\)\)/);
  assert.match(layout, /aria-label=\{language === 'en' \? 'Open global search' : 'Buka pencarian global'\}/);
  assert.match(workspace, /window\.addEventListener\('ka:open-global-search', onDockedSearchOpen\)/);
  assert.match(workspace, /window\.removeEventListener\('ka:open-global-search', onDockedSearchOpen\)/);
  assert.doesNotMatch(workspace, /fixed bottom-\[calc\(6\.7rem\+env\(safe-area-inset-bottom,0px\)\)\] right-4/);
});

test('keyboard shortcut remains available after removing the floating launcher', async () => {
  const workspace = await read('src/components/workspace/WorkspaceExperience.jsx');
  assert.match(workspace, /event\.ctrlKey \|\| event\.metaKey/);
  assert.match(workspace, /event\.key\.toLowerCase\(\) === 'k'/);
  assert.match(workspace, /setOpen\(true\)/);
});
