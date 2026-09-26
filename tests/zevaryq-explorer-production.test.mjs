import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext, Script } from 'node:vm';

const html = await readFile(new URL('../explorer-dashboard/zevaryq-production.html', import.meta.url), 'utf8');
const deploy = await readFile(new URL('../scripts/deploy-zevaryq-explorer.sh', import.meta.url), 'utf8');

test('Zevaryq production identity and chain are explicit', () => {
  assert.match(html, /data-zevaryq-explorer-version="1\.1\.2"/);
  assert.match(html, /ZEVARYQ EXPLORER/);
  assert.match(html, /http-equiv="Cache-Control" content="no-store, max-age=0, must-revalidate"/);
  assert.match(html, /UI dashboard 2\.0\.0 · Base release 1\.1\.2/);
  assert.match(html, /Zevaryq Network/);
  assert.match(html, /ZVQ Mainnet/);
  assert.match(html, /Chain ID <b>22028/);
  assert.equal(html.includes("EXPECTED_CHAIN='0x560c'"), true);
});

test('complete ZVQ identity is visible in header, hero and satellite view', () => {
  assert.equal((html.match(/class="earth-brandmark"/g) || []).length, 2);
  assert.match(html, /class="logo logo-zvq"[^>]+><img class="official-emblem"[^>]+zevaryq-emblem\.webp/);
  assert.equal((html.match(/class="official-emblem"/g) || []).length, 3);
  assert.doesNotMatch(html, /<img class="earth-logo"/);
  assert.doesNotMatch(html, /data:image\/(webp|png);base64/);
  assert.ok(Buffer.byteLength(html) < 100_000, 'Explorer HTML must not embed its 3 emblem images or favicon');
  assert.match(html, /rel="icon"[^>]+zevaryq-favicon\.png/);
  assert.match(html, /class="brand-gold">ZEVARYQ/);
  assert.doesNotMatch(html, /<span class="logo">ZV<\/span>/);
  assert.match(html, /\.earth:after\{content:none\}/);
  assert.doesNotMatch(html, /content:"ZV"/);
  assert.match(html, /not live satellite telemetry/);
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
  assert.match(html, /Live Blockchain Mesh/);
  assert.match(html, /id="refreshData"/);
  assert.match(html, /parent_hash\.toLowerCase\(\)===parent\.hash\.toLowerCase\(\)/);
  assert.ok(html.includes("const data=await getJSON(RPC,options,12000)"), 'browser RPC stays same-origin');
  assert.ok(!html.includes("for(const url of [RPC,'https://rpc.kriptoaman.com'])"), 'do not retry through blocked cross-origin CORS');
  assert.ok(html.includes('rpcNextProbeAt'), 'failed RPC requests must back off without throttling indexed data');
  assert.match(html, /if\(state\.probing\)return/);
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
  assert.match(deploy, /public_explorer_release=current-v1\.1\.2/);
  assert.match(deploy, /public_explorer_release=stale-default-url/);
  assert.ok(deploy.indexOf('trap - ERR') < deploy.indexOf('public_code='), 'origin rollback must be disabled before public-cache diagnosis');
  assert.match(deploy, /grep -q 'class="logo logo-zvq"' "\$body"/);
  assert.match(deploy, /grep -q 'class="earth-brandmark"' "\$body"/);
  assert.equal(deploy.includes('0x560c'), true);
  assert.equal(deploy.includes('kriptoaman.com/*'), false);
  assert.doesNotMatch(deploy, /genesis|validator private|postgres.*reset|redis.*reset/i);
});



test('the live Explorer proxy can only be recreated by a confirmed manual deployment', async () => {
  const workflow = await readFile(new URL('../.github/workflows/zevaryq-explorer-production.yml', import.meta.url), 'utf8');
  assert.match(workflow, /deploy:\\n    # Safety:[\\s\\S]*?if: github\\.event_name == 'workflow_dispatch' && inputs\\.confirm_explorer_only == 'DEPLOY-ZEVARYQ-EXPLORER'/);
  assert.doesNotMatch(workflow, /if: [^\\n]*github\\.event_name == 'push'/);
  assert.match(deploy, /docker compose up -d --force-recreate --no-deps proxy/);
  assert.match(workflow, /test "\\\$\\{\\{ inputs\\.confirm_explorer_only \\\}\\}" = "DEPLOY-ZEVARYQ-EXPLORER"/);
});

test('legacy KAM deployment cannot overwrite protected ZEVARYQ homepage', async () => {
  const legacy = await readFile(new URL('../scripts/deploy-kam-explorer-v2.sh', import.meta.url), 'utf8');
  const v2Workflow = await readFile(new URL('../.github/workflows/kam-explorer-v2-deploy.yml', import.meta.url), 'utf8');
  const priorityWorkflow = await readFile(new URL('../.github/workflows/kam-explorer-priority-upgrade.yml', import.meta.url), 'utf8');
  const guard = legacy.indexOf('Protected ZEVARYQ homepage installed');
  const legacyWrite = legacy.indexOf('cat > /target/kam-dashboard/index.html');
  assert.ok(guard >= 0 && legacyWrite > guard, 'legacy deploy must reject ZVQ before writing homepage');
  assert.equal(v2Workflow.split("if: ${{ github.event_name == 'workflow_dispatch' }}").length - 1, 3);
  assert.ok(v2Workflow.includes("!explorer-dashboard/zevaryq-production.html"));
  assert.ok(v2Workflow.includes("!explorer-dashboard/assets/**"));
  assert.equal(priorityWorkflow.split("if: ${{ github.event_name == 'workflow_dispatch' }}").length - 1, 3);
  assert.doesNotMatch(priorityWorkflow, /^  workflow_run:/m);
});


test('indexed Blockscout data renders independently while browser RPC preflight is blocked', () => {
  assert.match(html, /const probeRpc=async\(\)=>/);
  assert.match(html, /const probeIndexer=async\(\)=>/);
  assert.match(html, /await Promise\.all\(\[probeRpc\(\),probeIndexer\(\)\]\)/);
  assert.match(html, /finally\{renderStatic\(\);if\(state\.blocks\.length\)renderBlocks\(\);renderImmune\(\);\}/);
  assert.match(html, /if\(state\.api\)state\.lastGoodBlocksAt=Date\.now\(\)/);
});

test('indexed Blockscout data remains visible if browser JSON-RPC preflight fails', () => {
  assert.match(html, /hasIndexedHeight/);
  assert.match(html, /latestBlockSource=state\.rpc/);
  assert.match(html, /state\.api\?'INDEXED':'STALE'/);
  assert.match(html, /Blockscout indexed blocks available/);
  assert.match(html, /Cached indexed history/);
  assert.match(html, /calculatedSource=state\.api/);
  assert.match(html, /\['Data Freshness',freshness\(\),state\.api\?'INDEXED':state\.blocks\.length\?'STALE'/);
  assert.match(html, /Browser RPC verification unavailable/);
});


test('gas price is exact and human-readable, and mesh links verify adjacent height', () => {
  assert.match(html, /function formatGasPrice\(hex\)/);
  assert.match(html, /wei<1_000_000n/);
  assert.equal((html.match(/formatGasPrice\(state\.gas\)/g) || []).length, 2);
  assert.doesNotMatch(html, /Number\(BigInt\(state\.gas\)\)\/1e9/);
  assert.match(html, /Number\(b\.height\)===Number\(parent\.height\)\+1/);
  assert.match(html, /Number\(b\.height\)===Number\(latest\[i\+1\]\.height\)\+1/);
});

test('consensus parser accepts only a unique four-address QBFT header candidate', () => {
  const from = html.indexOf('function qbftValidatorsFromExtraData(');
  const to = html.indexOf('async function refreshConsensus(', from);
  assert.ok(from >= 0 && to > from, 'pure proof helpers must be present');
  const proof = runInNewContext(html.slice(from, to) + ';({qbftValidatorsFromExtraData,verifiedFinalizedBlock})');
  const address = n => '94' + n.toString(16).padStart(2, '0').repeat(20);
  const validators = [1, 2, 3, 4].map(address).join('');
  // Fixture encodes a four-address list, empty vote, empty round and empty seals.
  const extra = '0xf859f854' + validators + '8080c0';
  const members = proof.qbftValidatorsFromExtraData(extra);
  assert.deepEqual(Array.from(members), [1, 2, 3, 4].map(n => '0x' + n.toString(16).padStart(2, '0').repeat(20)));
  assert.equal(proof.qbftValidatorsFromExtraData('0x'), null);
  assert.equal(proof.qbftValidatorsFromExtraData(extra + 'ff'), null, 'RLP cannot contain trailing bytes');
  const duplicate = '0xf859f854' + [1, 1, 3, 4].map(address).join('') + '8080c0';
  assert.equal(proof.qbftValidatorsFromExtraData(duplicate), null, 'duplicate validator addresses must be rejected');
  assert.doesNotMatch(html, /rpc\('qbft_getValidatorsByBlockNumber'/, 'public consensus namespace must remain blocked');
});

test('finality requires a supported finalized tag and a matching canonical block hash', () => {
  const from = html.indexOf('function qbftValidatorsFromExtraData(');
  const to = html.indexOf('async function refreshConsensus(', from);
  const proof = runInNewContext(html.slice(from, to) + ';({qbftValidatorsFromExtraData,verifiedFinalizedBlock})');
  const block = { number: '0x64', hash: '0x' + 'a'.repeat(64), timestamp: '0x65' };
  const verified = proof.verifiedFinalizedBlock(block, { ...block }, 105);
  assert.equal(verified.number, 100);
  assert.equal(verified.timestamp, 101);
  assert.equal(proof.verifiedFinalizedBlock(block, { ...block, hash: '0x' + 'b'.repeat(64) }, 105), null);
  assert.equal(proof.verifiedFinalizedBlock(block, { ...block }, 99), null);
  assert.equal(proof.verifiedFinalizedBlock({ ...block, hash: '' }, block, 105), null);
  assert.match(html, /eth_getBlockByNumber',\['finalized',false\]/);
  assert.doesNotMatch(html, /eth_getBlockByNumber',\['safe',false\]/, 'safe tag is not a finalized tag');
  assert.match(html, /state\.validators=\[\];state\.validatorSource=null;state\.finalized=null/);
  assert.match(html, /consensusProbeAt>=60000/);
});


test('evidence panels preserve current Explorer production security and identity contracts', () => {
 assert.match(html, /data-zevaryq-features="immune-token-v1"/);
 for (const id of ['immune-monitor','immune','immune-checked','token-discovery','tokens','token-note']) {
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/Read-only observations from current RPC/);
 assert.match(html,/observational dashboard cannot block attacks or guarantee network security/);
 assert.match(html,/state\.api\?state\.blocks\[0\]:null/);
 assert.match(html,/state\.rpc&&state\.api&&Number\.isSafeInteger\(state\.head\)/);
 assert.match(html,/delta>=0&&delta<=6/);
 assert.match(html,/secs<=90/);
 assert.doesNotMatch(html,/transactions\?type=token_creation',\{\},10000/);
 assert.match(html,/\/transactions\?type=contract_creation/);
 assert.match(html,/API\+'\/tokens\?type=ERC-20'/);
 assert.match(html,/data-zvq-token-discovery="indexed-v2"/);
 assert.match(html,/API\+'\/tokens\/'\+encodeURIComponent/);
 assert.match(html,/\^ERC-\?20\$/);
 assert.match(html,/Token discovery evidence unavailable/);
 assert.doesNotMatch(html,/data:image\/(?:webp|png);base64/);
 assert.ok(Buffer.byteLength(html)<100_000);
});
test('new Explorer inline JavaScript parses, filters indexed token addresses and preserves finality helpers', () => {
 const script=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
 assert.ok(script);
 assert.doesNotThrow(()=>new Script(script));
 const from=script.indexOf('function indexedTokenAddress('),to=script.indexOf('function renderTokens(',from);
 assert.ok(from>=0&&to>from);
 const tokenAddress=runInNewContext(script.slice(from,to)+';indexedTokenAddress');
 const address='0x'+'a'.repeat(40);
 assert.equal(tokenAddress({created_contract:{hash:address}}),address);
 assert.equal(tokenAddress({created_contract:{hash:'0xabc'}}),null);
 assert.equal(tokenAddress({token:{address_hash:address}}),null,'transfer metadata is not proof of token creation');
 assert.match(script,/function qbftValidatorsFromExtraData/);
 assert.match(script,/function verifiedFinalizedBlock/);
 assert.match(script,/renderImmune\(\)/);
 assert.match(script,/setInterval\(probeTokens,60000\)/);
});
