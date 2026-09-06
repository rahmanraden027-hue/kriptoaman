import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const helper = await readFile(new URL('../src/lib/skamAuthorityRevocationBuilder.js', import.meta.url), 'utf8');
const panel = await readFile(new URL('../src/components/skam/SKAMAuthorityRevokePanel.jsx', import.meta.url), 'utf8');
const wrapper = await readFile(new URL('../src/pages/AdminSKAMLaunchV2.jsx', import.meta.url), 'utf8');
const pagesConfig = await readFile(new URL('../src/pages.config.js', import.meta.url), 'utf8');

const operator = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const mint = 'Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi';

test('authority builder is pinned to live sKAM identity', () => {
  assert.match(helper, new RegExp(operator));
  assert.match(helper, new RegExp(mint));
  assert.match(helper, /1_000_000_000n \* 10n \*\* 9n/);
  assert.match(helper, /TOKEN_INSTRUCTION_SET_AUTHORITY = 6/);
  assert.match(helper, /AUTHORITY_MINT_TOKENS = 0/);
  assert.match(helper, /AUTHORITY_FREEZE_ACCOUNT = 1/);
  assert.match(helper, /Uint8Array\.of\(TOKEN_INSTRUCTION_SET_AUTHORITY, authorityType, 0\)/);
});

test('Phantom revoke flow requires inspection, simulation, confirmation and wallet approval', () => {
  assert.match(panel, /phantom\.connect\(\)/);
  assert.match(panel, /simulateUnsignedTransaction/);
  assert.match(panel, /signAndSendTransaction/);
  assert.match(panel, /Pencabutan bersifat permanen/);
  assert.match(panel, /Setelah dicabut, authority ini tidak dapat dipulihkan/);
  assert.match(panel, /mintAuthority !== null \|\| verified\.state\.freezeAuthority !== null/);
  assert.doesNotMatch(panel, /secretKey|seed phrase|recovery phrase|private key/i);
});

test('existing admin route stays protected while using hardened wrapper', () => {
  assert.match(wrapper, /AdminSKAMLaunch/);
  assert.match(wrapper, /SKAMAuthorityRevokePanel/);
  assert.match(pagesConfig, /AdminSKAMLaunch: 'AdminSKAMLaunchV2'/);
});
