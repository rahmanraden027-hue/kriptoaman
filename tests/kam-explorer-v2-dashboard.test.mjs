import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../explorer-dashboard/index.html', import.meta.url), 'utf8');
const stats = await readFile(new URL('../explorer-dashboard/stats.html', import.meta.url), 'utf8');
const tokens = await readFile(new URL('../explorer-dashboard/tokens.html', import.meta.url), 'utf8');
const developer = await readFile(new URL('../explorer-dashboard/developer.html', import.meta.url), 'utf8');
const docs = await readFile(new URL('../explorer-dashboard/developer-docs.html', import.meta.url), 'utf8');
const examples = await readFile(new URL('../explorer-dashboard/developer-examples.html', import.meta.url), 'utf8');
const verify = await readFile(new URL('../explorer-dashboard/developer-verify.html', import.meta.url), 'utf8');
const networkConfig = JSON.parse(await readFile(new URL('../explorer-dashboard/developer-network.json', import.meta.url), 'utf8'));
const addresses = await readFile(new URL('../explorer-dashboard/addresses.html', import.meta.url), 'utf8');
const validators = await readFile(new URL('../explorer-dashboard/validators.html', import.meta.url), 'utf8');
const contracts = await readFile(new URL('../explorer-dashboard/contracts.html', import.meta.url), 'utf8');
const status = await readFile(new URL('../explorer-dashboard/status.html', import.meta.url), 'utf8');
const deploy = await readFile(new URL('../scripts/deploy-kam-explorer-v2.sh', import.meta.url), 'utf8');

const finalSurfaces = [html, stats, tokens, developer, docs, examples, verify, addresses, validators, contracts, status];

test('KAM Explorer V2 uses verified live data surfaces', () => {
  assert.match(html, /data-kam-explorer-version="2\.0\.0"/);
  assert.match(html, /\/api\/v2\/blocks/);
  assert.match(html, /\/api\/v2\/transactions/);
  assert.match(html, /\/api\/v2\/stats/);
  assert.match(html, /Unavailable data is shown as unavailable—not invented/);
});

test('KAM Statistics V2 uses verified public core data and no placeholder Stats dependency', () => {
  assert.match(stats, /data-kam-stats-version="2\.0\.0"/);
  assert.match(stats, /\/api\/v2\/blocks/);
  assert.match(stats, /\/api\/v2\/transactions/);
  assert.match(stats, /\/api\/v2\/stats/);
  assert.match(stats, /Verified-data policy/);
  assert.equal(stats.includes('Placeholder Counter'), false);
  assert.equal(stats.includes('localhost:8080'), false);
  assert.equal(stats.includes('/api/v1/'), false);
});

test('KAM Token Registry V2 identifies canonical WKAM without deleting indexed contracts', () => {
  assert.match(tokens, /data-kam-tokens-version="2\.0\.0"/);
  assert.match(tokens, /0x0d8848CE88BB09a81a4248Efdd574d50B98b544A/);
  assert.match(tokens, /Canonical WKAM/);
  assert.match(tokens, /\/api\/v2\/tokens\?type=ERC-20/);
  assert.match(tokens, /Other indexed contracts are retained for transparency and are not deleted or rewritten/);
});

test('Developer Center exposes canonical network onboarding and public APIs without secrets', () => {
  assert.match(developer, /data-kam-developer-version="1\.0\.0"/);
  assert.match(developer, /wallet_addEthereumChain/);
  assert.match(developer, /chainId:'0x560c'/);
  assert.match(developer, /KriptoAman Mainnet/);
  assert.match(developer, /https:\/\/rpc\.kriptoaman\.com/);
  assert.match(developer, /\/api\/v2\/smart-contracts\/verification\/config/);
  assert.match(developer, /no private key is requested/i);
});

test('Developer docs separate public endpoint facts from internal activation gates', () => {
  assert.match(docs, /data-kam-developer-docs-version="1\.0\.0"/);
  assert.match(docs, /Chain ID 22028/);
  assert.match(docs, /https:\/\/rpc\.kriptoaman\.com/);
  assert.match(docs, /\/developer\/network\.json/);
  assert.match(docs, /internal network-promotion gates/i);
  assert.match(docs, /does not expose validator administration/i);
});

test('Developer examples provide safe quickstarts and wallet onboarding', () => {
  assert.match(examples, /data-kam-developer-examples-version="1\.0\.0"/);
  assert.match(examples, /ethers v6/);
  assert.match(examples, /viem/);
  assert.match(examples, /wallet_addEthereumChain/);
  assert.match(examples, /0x560c/);
  assert.match(examples, /never request a seed phrase or private key/i);
});

test('Machine-readable developer network config is canonical and does not promote internal readiness state', () => {
  assert.equal(networkConfig.schemaVersion, '1.0.0');
  assert.equal(networkConfig.networkName, 'KriptoAman Mainnet');
  assert.equal(networkConfig.chainId, 22028);
  assert.equal(networkConfig.chainIdHex, '0x560c');
  assert.deepEqual(networkConfig.rpcUrls, ['https://rpc.kriptoaman.com']);
  assert.deepEqual(networkConfig.blockExplorerUrls, ['https://explorer.kriptoaman.com']);
  assert.equal(networkConfig.nativeCurrency.symbol, 'KAM');
  assert.equal(networkConfig.nativeCurrency.decimals, 18);
  assert.equal(networkConfig.publicDeveloperAccess, true);
  assert.equal(networkConfig.security.privateKeysRequired, false);
  assert.match(networkConfig.activationStatusNote, /does not by itself modify separate internal network-promotion\/readiness gates/i);
});

test('Contract verification guide probes only public verification capabilities', () => {
  assert.match(verify, /data-kam-developer-verify-version="1\.0\.0"/);
  assert.match(verify, /\/api\/v2\/smart-contracts\/verification\/config/);
  assert.match(verify, /\/api\/v2\/smart-contracts/);
  assert.match(verify, /Never submit secrets/i);
  assert.match(verify, /private key/);
});

test('Addresses surface uses observed public evidence instead of a fabricated holder ranking', () => {
  assert.match(addresses, /data-kam-addresses-version="1\.0\.0"/);
  assert.match(addresses, /\/api\/v2\/addresses\//);
  assert.match(addresses, /\/api\/v2\/transactions/);
  assert.match(addresses, /Export CSV/);
  assert.match(addresses, /not a fabricated holder ranking/i);
});

test('Proposer observatory clearly distinguishes observed proposers from authoritative validator claims', () => {
  assert.match(validators, /data-kam-validators-version="1\.0\.0"/);
  assert.match(validators, /\/api\/v2\/blocks/);
  assert.match(validators, /does not claim stake weight, validator uptime/i);
  assert.match(validators, /share of sample/i);
});

test('Contracts center reads verified-contract and verification-config APIs', () => {
  assert.match(contracts, /data-kam-contracts-version="1\.0\.0"/);
  assert.match(contracts, /\/api\/v2\/smart-contracts/);
  assert.match(contracts, /\/api\/v2\/smart-contracts\/verification\/config/);
  assert.match(contracts, /Verified/);
});

test('Network status uses public endpoint evidence and treats browser RPC CORS separately', () => {
  assert.match(status, /data-kam-status-version="1\.0\.0"/);
  assert.match(status, /\/api\/v2\/blocks/);
  assert.match(status, /\/api\/v2\/transactions/);
  assert.match(status, /may intentionally restrict browser CORS/i);
  assert.match(status, /indexed block freshness/i);
});

test('KAM public final surfaces do not ship known mockup-only KPI values', () => {
  for (const fake of ['879,719', '3,942 TPS', '21 / 21', '10,000,000,000 KAM', '$1,245,332', 'Placeholder Counter']) {
    for (const surface of finalSurfaces) assert.equal(surface.includes(fake), false, `mockup-only value must not be shipped: ${fake}`);
  }
});

test('deployment is exact-route, narrow, nginx-safe, rollback-safe and avoids curl-pipe false failures', () => {
  assert.match(deploy, /KAM_EXPLORER_V2_BEGIN/);
  const routes = [
    ['/', 'index.html'],
    ['/stats', 'stats.html'],
    ['/tokens', 'tokens.html'],
    ['/developer', 'developer.html'],
    ['/developers', 'developer.html'],
    ['/developer/docs', 'developer-docs.html'],
    ['/developer/examples', 'developer-examples.html'],
    ['/developer/verify', 'developer-verify.html'],
    ['/addresses', 'addresses.html'],
    ['/validators', 'validators.html'],
    ['/contracts', 'contracts.html'],
    ['/status', 'status.html'],
  ];
  for (const [path, file] of routes) {
    assert.equal(deploy.includes(`route('${path}', '${file}'`), true, `exact route declaration missing: ${path}`);
    assert.equal(deploy.includes(`try_files /kam-dashboard/${file} =404;`) || deploy.includes(`route('${path}', '${file}'`), true, `served file missing: ${file}`);
  }
  assert.equal(deploy.includes("json_route('/developer/network.json', 'developer-network.json'"), true);
  assert.match(deploy, /location = \{path\}/);
  assert.match(deploy, /X-KAM-Explorer-Developer-Version/);
  assert.match(deploy, /X-KAM-Developer-Docs-Version/);
  assert.match(deploy, /X-KAM-Developer-Examples-Version/);
  assert.match(deploy, /X-KAM-Developer-Verify-Version/);
  assert.match(deploy, /X-KAM-Developer-Network-Version/);
  assert.match(deploy, /X-KAM-Explorer-Addresses-Version/);
  assert.match(deploy, /X-KAM-Explorer-Contracts-Version/);
  assert.match(deploy, /docker run --rm --network none -i/);
  assert.match(deploy, /-v "\$PROXY_DIR:\/target"/);
  assert.match(deploy, /cp -a \/target\/\$BACKUP_NAME \/target\/default\.conf\.template/);
  assert.match(deploy, /docker compose up -d --force-recreate proxy/);
  assert.match(deploy, /curl -fsSL .* -o "\$VERIFY_BODY"/);
  assert.doesNotMatch(deploy, /curl[^\n]*\|\s*grep/);
  assert.doesNotMatch(deploy, /--privileged/);
  assert.doesNotMatch(deploy, /genesis|treasury|private.?key/i);
  assert.match(deploy, /\/tx\/\$KNOWN_TX/);
  assert.match(deploy, /\/token\/\$CANONICAL_WKAM/);
});
