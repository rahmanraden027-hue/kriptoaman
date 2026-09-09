import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('KAM Transaction Lab is registered as a public discoverable page', async () => {
  const [pages, app, network, sitemap] = await Promise.all([
    read('src/pages.config.js'),
    read('src/App.jsx'),
    read('src/pages/KAMNetwork.jsx'),
    read('public/sitemap.xml'),
  ]);
  assert.match(pages, /'KAMTransactionLab'/);
  assert.match(app, /'KAMTransactionLab'/);
  assert.match(network, /href="\/KAMTransactionLab"/);
  assert.match(sitemap, /\/KAMTransactionLab/);
});

test('transaction flow remains wallet-approved and constrained', async () => {
  const page = await read('src/pages/KAMTransactionLab.jsx');
  assert.match(page, /eth_requestAccounts/);
  assert.match(page, /wallet_switchEthereumChain/);
  assert.match(page, /wallet_addEthereumChain/);
  assert.match(page, /eth_sendTransaction/);
  assert.match(page, /MAX_TRIAL_KAM = '1'/);
  assert.match(page, /stage !== 'preview'/);
  assert.match(page, /!acknowledged/);
  assert.match(page, /Chain ID 22028/);
  assert.match(page, /explorer\.kriptoaman\.com/);
  assert.doesNotMatch(page, /eth_sendRawTransaction|personal_sign|eth_sign|privateKey|seedPhrase/);
});

test('transaction input validation rejects malformed targets and self-transfer', async () => {
  const page = await read('src/pages/KAMTransactionLab.jsx');
  assert.match(page, /\^0x\[a-fA-F0-9\]\{40\}\$/);
  assert.match(page, /recipient\.toLowerCase\(\) !== account\.toLowerCase\(\)/);
  assert.match(page, /amountWei > 0n/);
  assert.match(page, /amountWei <= parseKam\(MAX_TRIAL_KAM\)/);
  assert.match(page, /HASH_RE\.test/);
});
