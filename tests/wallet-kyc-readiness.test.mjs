import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('external wallet UI uses real providers and contains no synthetic wallet data', async () => {
  const [panel, external, provider] = await Promise.all([
    read('src/components/wallet/WalletConnectPanel.jsx'),
    read('src/components/wallet/ExternalWalletConnections.jsx'),
    read('src/components/web3/Web3Provider.jsx'),
  ]);

  assert.doesNotMatch(panel, /Math\.random|generateAddress|generateWCUri|wc:/);
  assert.match(external, /window\.phantom\?\.solana/);
  assert.match(external, /phantom\.connect\(\)/);
  assert.match(provider, /eip6963:requestProvider/);
  assert.match(provider, /eth_requestAccounts/);
  assert.match(provider, /options\.silent \? 'eth_accounts'/);
  assert.match(external, /Signing and transactions remain disabled/);
});

test('KYC readiness checks server bindings and database without exposing secret values', async () => {
  const [readiness, page, start, didit] = await Promise.all([
    read('functions/api/kyc/readiness.js'),
    read('src/pages/KYC.jsx'),
    read('functions/api/kyc/start.js'),
    read('server/kyc/didit.js'),
  ]);

  for (const binding of ['AUTH_DB', 'SESSION_SECRET', 'DIDIT_API_KEY', 'DIDIT_WORKFLOW_ID', 'DIDIT_WEBHOOK_SECRET']) {
    assert.match(readiness, new RegExp(binding));
  }
  assert.match(readiness, /SELECT 1 AS ok/);
  assert.match(readiness, /no-store, no-cache/);
  assert.doesNotMatch(readiness, /value:\s*env\./);
  assert.match(page, /\/api\/kyc\/readiness/);
  assert.match(page, /verify\.didit\.me/);
  assert.match(page, /verification\.didit\.me/);
  assert.match(start, /email_verified/);
  assert.match(didit, /X-Signature-V2/);
  assert.match(didit, /constantTimeEqual/);
});
