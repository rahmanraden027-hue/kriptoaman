import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const starter = await readFile(new URL('../explorer-dashboard/developer-starter.html', import.meta.url), 'utf8');
const developer = await readFile(new URL('../explorer-dashboard/developer.html', import.meta.url), 'utf8');
const docs = await readFile(new URL('../explorer-dashboard/developer-docs.html', import.meta.url), 'utf8');
const deploy = await readFile(new URL('../scripts/deploy-kam-developer-starter.sh', import.meta.url), 'utf8');

test('live KAM starter is canonical and browser-safe', () => {
  assert.match(starter, /data-kam-developer-starter-version="1\.0\.0"/);
  assert.match(starter, /KriptoAman Mainnet/);
  assert.match(starter, /Chain ID 22028/);
  assert.match(starter, /0x560c/);
  assert.equal(starter.includes('https://rpc.kriptoaman.com'), true);
  assert.equal(starter.includes('https://explorer.kriptoaman.com'), true);
  assert.match(starter, /readJson\('\/developer\/network\.json'\)/);
  assert.match(starter, /readJson\('\/api\/v2\/blocks'\)/);
  assert.match(starter, /readJson\('\/api\/v2\/stats'\)/);
  assert.match(starter, /browser CORS as chain health/i);
});

test('wallet onboarding stays user-approved and read-only-first', () => {
  assert.match(starter, /wallet_switchEthereumChain/);
  assert.match(starter, /wallet_addEthereumChain/);
  assert.match(starter, /eth_requestAccounts/);
  assert.match(starter, /eth_chainId/);
  assert.match(starter, /unknown chain 4902/i);
  assert.doesNotMatch(starter, /eth_sendTransaction/);
  assert.doesNotMatch(starter, /eth_sendRawTransaction/);
  assert.doesNotMatch(starter, /localStorage\.setItem/);
  assert.doesNotMatch(starter, /sessionStorage\.setItem/);
  assert.match(starter, /never asks for a seed phrase, private key/i);
});

test('Developer Center and Docs make the live starter directly discoverable', () => {
  assert.match(developer, /href="\/developer\/starter"/);
  assert.match(developer, /Run Live dApp Starter/);
  assert.match(docs, /href="\/developer\/starter"/);
  assert.match(docs, /KAM Live dApp Starter/);
  assert.match(docs, /GitHub starter folder/);
});

test('live starter does not ship fabricated KPI claims', () => {
  for (const fake of ['3,942 TPS', '21 / 21', '10,000,000,000 KAM', '$1,245,332', 'Placeholder Counter']) {
    assert.equal(starter.includes(fake), false, `fabricated or mock-only value must not ship: ${fake}`);
  }
});

test('starter deployment is exact-route, isolated and rollback-safe', () => {
  assert.match(deploy, /KAM_DEVELOPER_STARTER_BEGIN/);
  assert.match(deploy, /location = \/developer\/starter/);
  assert.match(deploy, /try_files \/kam-dashboard\/developer-starter\.html =404/);
  assert.match(deploy, /X-KAM-Developer-Starter-Version/);
  assert.match(deploy, /Content-Security-Policy/);
  assert.match(deploy, /connect-src 'self'/);
  assert.match(deploy, /cp -a \/target\/\$BACKUP_NAME \/target\/default\.conf\.template/);
  assert.match(deploy, /docker run --rm --network none -i/);
  assert.match(deploy, /docker compose up -d --force-recreate proxy/);
  assert.match(deploy, /data-kam-developer-starter-version/);
  assert.match(deploy, /x-kam-developer-starter-version/);
  assert.doesNotMatch(deploy, /curl[^\n]*\|\s*grep/);
  assert.doesNotMatch(deploy, /--privileged/);
});
