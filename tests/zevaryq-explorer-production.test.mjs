import vm from 'node:vm';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../explorer-dashboard/zevaryq-production.html', import.meta.url), 'utf8');
const deploy = await readFile(new URL('../scripts/deploy-zevaryq-explorer.sh', import.meta.url), 'utf8');

test('Zevaryq production identity and chain are explicit', () => {
  assert.match(html, /data-zevaryq-explorer-version="1\.1\.0"/);
  assert.match(html, /ZEVARYQ EXPLORER/);
  assert.match(html, /Zevaryq Network/);
  assert.match(html, /ZVQ Mainnet/);
  assert.match(html, /Chain ID <b>22028/);
  assert.equal(html.includes("EXPECTED_CHAIN='0x560c'"), true);
});

test('premium Zevaryq emblem is wired to header, hero, satellite view and favicon', () => {
  assert.equal((html.match(/\/zevaryq-assets\/zevaryq-emblem\.webp/g) || []).length, 3);
  assert.match(html, /rel="icon"[^>]+zevaryq-favicon\.png/);
  assert.match(html, /class="brand-gold">ZEVARYQ/);
  assert.doesNotMatch(html, /<span class="logo">ZV<\/span>/);
  assert.match(html, /\.earth:after\{content:none\}/);
});

test('required production panels and search routes exist', () => {
  for (const marker of [
    'Satellite Network View', 'Consensus & Finality', 'Global Node Topology',
    'Network Performance', 'Infrastructure Status', 'Security Intelligence',
    'Network Activity Flow', 'Mempool & Fee Intelligence',
    'Validator Intelligence', 'Realtime Block Stream', 'Latest Blocks',
  ]) assert.equal(html.includes(marker), true, 'missing panel: ' + marker);
  for (const route of ['/block/', '/tx/', '/address/']) {
    assert.equal(html.includes(route), true, 'missing route: ' + route);
  }
  assert.equal(html.includes('setInterval(probe,12000)'), true);
});

test('unverified values fail closed', () => {
  for (const fake of ['21 / 21', '128+ nodes', '3.4 TPS', '1,236 pending transactions', '100% Secure']) {
    assert.equal(html.includes(fake), false, 'mockup-only value shipped: ' + fake);
  }
  assert.match(html, /Topology data unavailable/);
  assert.match(html, /Mempool telemetry unavailable/);
  assert.match(html, /No values are estimated/);
});

test('deployment is narrow and rollback safe', () => {
  assert.equal(deploy.includes('kam-dashboard/index.html'), true);
  assert.match(deploy, /rollback/);
  assert.equal(deploy.includes('0x560c'), true);
  assert.equal(deploy.includes('kriptoaman.com/*'), false);
  assert.doesNotMatch(deploy, /genesis|validator private|postgres.*reset|redis.*reset/i);
});


test('connected ledger, immune monitor and token discovery are evidence-gated', () => {
 for (const id of ['connected-ledger','immune-network','token-discovery','ledger','immune','tokens']) {
  assert.match(html, new RegExp('id="'+id+'"'));
 }
 assert.match(html, /b\.parent_hash\.toLowerCase\(\)===next\.hash\.toLowerCase\(\)/);
 assert.match(html, /Number\(b\.height\)===Number\(next\.height\)\+1/);
 assert.match(html, /observed!==EXPECTED_CHAIN/);
 assert.match(html, /Math\.abs\(delta\)<=6/);
 assert.match(html, /secs<=90/);
 assert.match(html, /transactions\?type=token_creation/);
 assert.match(html, /API\+'\/tokens\/'\+encodeURIComponent/);
 assert.match(html, /ERC-\?20/);
 assert.match(html, /No synthetic blockchain connections|no synthetic blockchain connections/);
 assert.match(html, /No token price, liquidity, audit approval or trading availability is implied/);
});
test('browser dashboard script parses and probes fail closed', () => {
 const { Script } = requireScriptHelpers();
 const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script);
 assert.doesNotThrow(() => new Script(script));
 assert.match(script,/state\.blocks=indexed\.slice\(\)/);
 assert.match(script,/state\.rpc=!!rpcResult\?\.ok/);
 assert.match(script,/state\.tokens=\[\];state\.tokenError=true/);
});
function requireScriptHelpers(){return {Script: vm.Script};}
