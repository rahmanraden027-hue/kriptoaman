// Read-only live browser proof of ZVQ Developer wallet onboarding.
// ALL EVM wallet calls use an injected in-page mock. No real wallet,
// signing, private keys, transactions, configuration writes or server changes.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const origin = 'https://explorer.kriptoaman.com';
const chrome = process.env.ZVQ_CHROME;
const library = process.env.PLAYWRIGHT_CORE;
const output = process.env.ZVQ_WALLET_PROOF_DIR;
if (!chrome || !library || !output) {
  throw Error('Chrome, pinned Playwright and artifact output are required');
}
const { chromium } = await import(library);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true, executablePath: chrome,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const specs = [
  { name: 'android-360', width: 360, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

async function networkConfig(page) {
  const response = await page.request.get(origin + '/developer/network.json', {
    timeout: 15000, failOnStatusCode: true,
  });
  assert.equal(response.status(), 200);
  const network = await response.json();
  assert.equal(network.chainId, 22028);
  assert.equal(network.chainIdHex, '0x560c');
  assert.equal(network.networkName, 'ZEVARYQ Mainnet');
  assert.equal(network.nativeCurrency.symbol, 'ZVQ');
  assert.equal(network.security.privateKeysRequired, false);
  assert.deepEqual(network.rpcUrls, ['https://rpc.kriptoaman.com']);
  assert.deepEqual(network.blockExplorerUrls, [origin]);
  return network;
}

function expectedWalletConfig(network) {
  return {
    chainId: network.chainIdHex,
    chainName: network.networkName,
    nativeCurrency: network.nativeCurrency,
    rpcUrls: network.rpcUrls,
    blockExplorerUrls: network.blockExplorerUrls,
  };
}

try {
  for (const spec of specs) {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: 1, isMobile: spec.width < 500,
      hasTouch: spec.width < 500,
    });
    const page = await context.newPage();
    const errors = [];
    const unexpectedWrites = [];
    const evidence = { spec, walletType: 'browser-only simulation',
      requests: [], checks: [], errors, unexpectedWrites };
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => {
      try {
        const url = new URL(request.url());
        if (url.origin === origin && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
          unexpectedWrites.push({ method: request.method(), path: url.pathname });
        }
      } catch {
        // Ignore non-HTTP resource URLs in the browser.
      }
    });
    try {
      const response = await page.goto(origin + '/developer', {
        waitUntil: 'domcontentloaded', timeout: 25000,
      });
      assert.equal(response?.status(), 200, 'Developer page HTTP');
      await page.locator('main[data-kam-developer-version="1.0.0"]').waitFor();
      const network = await networkConfig(page);
      const noInjectedWallet = await page.evaluate(() => !window.ethereum?.request);
      assert.equal(noInjectedWallet, true, 'No real wallet may be used in CI');
      await page.locator('#addWallet').click();
      await page.waitForFunction(() =>
        document.querySelector('#walletState')?.textContent?.includes('No injected EVM wallet detected'),
      null, { timeout: 5000 });
      evidence.checks.push('no-wallet fallback renders without secret prompts');

      // A synthetic EIP-1193 provider records ONLY the network-add request.
      await page.evaluate(() => {
        window.__zvqWalletCalls = [];
        Object.defineProperty(window, 'ethereum', {
          configurable: true,
          value: { request: async request => {
            window.__zvqWalletCalls.push(request);
            return null;
          } },
        });
      });
      await page.locator('#addWallet').click();
      await page.waitForFunction(() =>
        document.querySelector('#walletState')?.textContent?.includes('request sent to your wallet'),
      null, { timeout: 5000 });
      const addCalls = await page.evaluate(() => window.__zvqWalletCalls);
      assert.deepEqual(addCalls, [{
        method: 'wallet_addEthereumChain',
        params: [expectedWalletConfig(network)],
      }], 'Only the canonical user-approved network-add request is allowed');
      evidence.requests.push('wallet_addEthereumChain: canonical Chain ID 22028');
      evidence.checks.push('network-add payload matches live network.json');

      // Refusal must be visible; the UI may not report success on rejection.
      await page.evaluate(() => {
        window.ethereum.request = async () => {
          throw Object.assign(new Error('Simulated user rejection'), { code: 4001 });
        };
      });
      await page.locator('#addWallet').click();
      await page.waitForFunction(() =>
        document.querySelector('#walletState')?.textContent?.includes('Simulated user rejection'),
      null, { timeout: 5000 });
      evidence.checks.push('wallet rejection displays error without claiming approval');

      await page.evaluate(() => {
        window.__zvqCopied = [];
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: async text => { window.__zvqCopied.push(text); } },
        });
      });
      await page.locator('button[data-copy="https://rpc.kriptoaman.com"]').first().click();
      await page.waitForFunction(() => window.__zvqCopied?.length > 0,
        null, { timeout: 5000 });
      const copied = await page.evaluate(() => window.__zvqCopied);
      assert.deepEqual(copied, [network.rpcUrls[0]]);
      evidence.checks.push('Copy RPC uses canonical endpoint');

      const starterResponse = await page.goto(origin + '/developer/starter', {
        waitUntil: 'domcontentloaded', timeout: 25000,
      });
      assert.equal(starterResponse?.status(), 200, 'Live starter HTTP');
      await page.locator('main[data-kam-developer-starter-version="1.0.0"]').waitFor();
      assert.equal(await page.evaluate(() => !window.ethereum?.request), true);
      await page.locator('#verifyExplorer').click();
      await page.waitForFunction(() =>
        ['Verified', 'Verification failed'].includes(
          document.querySelector('#configState')?.textContent),
      null, { timeout: 16000 });
      const state = await page.locator('#configState').innerText();
      assert.equal(state, 'Verified', 'Live starter must verify public read-only APIs');
      const blockStatus = await page.locator('#blocksState').innerText();
      assert.equal(blockStatus, 'Available', 'Live indexed blocks must exist');
      evidence.checks.push('starter live Explorer config and block APIs verified');

      await page.locator('#switchWallet').click();
      await page.waitForFunction(() =>
        document.querySelector('#output')?.textContent?.includes('No injected EVM wallet detected'),
      null, { timeout: 5000 });
      evidence.checks.push('starter no-wallet fallback renders');

      // Simulate unknown-chain (4902), network addition, and chain recheck.
      await page.evaluate(() => {
        window.__zvqStarterCalls = [];
        Object.defineProperty(window, 'ethereum', {
          configurable: true,
          value: { request: async request => {
            window.__zvqStarterCalls.push(request);
            if (request.method === 'wallet_switchEthereumChain') {
              throw Object.assign(new Error('Unknown chain'), { code: 4902 });
            }
            if (request.method === 'eth_chainId') return '0x560c';
            if (request.method === 'eth_requestAccounts') {
              return ['0x1111111111111111111111111111111111111111'];
            }
            if (request.method === 'wallet_addEthereumChain') return null;
            throw Error('Unexpected EIP-1193 method in simulated provider');
          } },
        });
      });
      await page.locator('#switchWallet').click();
      await page.waitForFunction(() =>
        document.querySelector('#output')?.textContent?.includes(
          'Wallet network request completed. Current chain: 0x560c'),
      null, { timeout: 5000 });
      let calls = await page.evaluate(() => window.__zvqStarterCalls);
      assert.deepEqual(calls, [
        { method: 'wallet_switchEthereumChain', params: [{ chainId: '0x560c' }] },
        { method: 'wallet_addEthereumChain', params: [expectedWalletConfig(network)] },
        { method: 'eth_chainId' },
      ]);
      evidence.requests.push('starter: switch, add unknown chain 4902, read chain');
      evidence.checks.push('starter wallet-add 4902 recovery matches live network.json');

      await page.locator('#connectWallet').click();
      await page.waitForFunction(() =>
        document.querySelector('#walletChain')?.textContent?.includes('ZVQ · 0x560c'),
      null, { timeout: 5000 });
      calls = await page.evaluate(() => window.__zvqStarterCalls);
      assert.deepEqual(calls.slice(-2).map(item => item.method),
        ['eth_requestAccounts', 'eth_chainId']);
      assert.deepEqual([...new Set(calls.map(item => item.method))].sort(),
        ['eth_chainId', 'eth_requestAccounts',
          'wallet_addEthereumChain', 'wallet_switchEthereumChain'].sort());
      evidence.requests.push('starter: simulated account request and chain read');
      evidence.checks.push('starter no private keys, signing or transaction methods');

      assert.deepEqual(unexpectedWrites, [], 'Browser must never POST to Explorer APIs');
      assert.deepEqual(errors, [], 'No uncaught browser exceptions');
      await page.screenshot({
        path: join(output, spec.name + '-starter.png'),
        fullPage: true, animations: 'disabled',
      });
      await writeFile(join(output, spec.name + '-wallet-proof.json'),
        JSON.stringify(evidence, null, 2));
      console.log('ZVQ_DEVELOPER_WALLET_BROWSER_PASS ' + spec.name + ' ' +
        JSON.stringify({ checks: evidence.checks.length, walletType: evidence.walletType,
          unexpectedWrites: unexpectedWrites.length, pageErrors: errors.length }));
    } catch (error) {
      evidence.error = String(error);
      await page.screenshot({
        path: join(output, spec.name + '-failure.png'),
        fullPage: true, animations: 'disabled',
      }).catch(() => {});
      await writeFile(join(output, spec.name + '-failure.json'),
        JSON.stringify(evidence, null, 2));
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}