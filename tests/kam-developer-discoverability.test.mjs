import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/KAMDeveloper.jsx', import.meta.url), 'utf8');

test('KAM developer console preserves internal readiness language', () => {
  assert.equal(source.includes("name: 'KriptoAman Mainnet Candidate'"), true);
  assert.equal(source.includes('mainnet-candidate-not-public'), true);
  assert.equal(source.includes('Session uptime and request analytics shown here are browser-session telemetry, not formal 24-hour production-readiness evidence.'), true);
});

test('verified public developer surfaces are discoverable from the main developer console', () => {
  assert.match(source, /const DEVELOPER_CENTER = `\$\{NETWORK\.explorer\}\/developer`;/);
  assert.match(source, /const LIVE_STARTER = `\$\{NETWORK\.explorer\}\/developer\/starter`;/);
  assert.equal(source.includes('Open Live dApp Starter'), true);
  assert.equal(source.includes('Open Developer Center'), true);
  assert.equal(source.includes('<h3 className="mt-3 font-black">Live dApp Starter</h3>'), true);
});

test('discoverability change stays read-only-first', () => {
  assert.equal(source.includes('eth_sendTransaction'), false);
  assert.equal(source.includes('eth_sendRawTransaction'), false);
  assert.equal(source.includes('private key'), false);
  assert.equal(source.includes('seed phrase'), false);
  assert.equal(source.includes("method: 'wallet_addEthereumChain'"), true);
});
