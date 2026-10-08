import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
const file=new URL('../chain/kam-mainnet/scripts/bootstrap-evidence-runner.sh',import.meta.url);
const script=await readFile(file,'utf8');
const workflow=await readFile(new URL('../.github/workflows/kam-private-mainnet-evidence.yml',import.meta.url),'utf8');

test('private runner bootstrap agrees with protected workflow and rejects mutation before RPC trust check',()=>{
 assert.match(script,/RPC_URL="\$\{KAM_PRIVATE_RPC_URL:-http:\/\/127\.0\.0\.1:8648\}"/);
 assert.match(workflow,/KAM_PRIVATE_RPC_URL:\s*http:\/\/127\.0\.0\.1:8648/);
 assert.match(workflow,/runs-on:\s*\[self-hosted, linux, x64, kam-mainnet-evidence\]/);
 const trust=script.indexOf('case "$'+'{RPC_URL}" in');
 const mutation=script.indexOf("apt-get update");
 const createAccount=script.indexOf('useradd --system');
 assert.ok(trust!==-1&&mutation!==-1&&trust<mutation&&trust<createAccount,'trust must precede host mutations');
 for(const proof of ['CHAIN_ID="$(rpc eth_chainId','VALIDATORS="$(rpc qbft_getValidatorsByBlockNumber',
   'BLOCK_2="$(rpc eth_blockNumber','Expected exactly 4 validators',
   'Expected at least 3 private peers','Block height did not advance']){
  const offset=script.indexOf(proof);
  assert.ok(offset!==-1&&offset<mutation,'network preflight must precede package installation: '+proof);
 }
 assert.ok(script.indexOf('for tool in curl jq')<mutation,'missing tools must fail without installation');
 assert.equal(script.includes('http://127.0.0.1:8545'),false,'do not fallback to management RPC port');
 assert.ok(script.includes("--noproxy '*'"),'local-only evidence must not traverse ambient HTTP proxy');
 assert.ok(script.includes('--connect-timeout 3 --max-time 10'),'RPC probes must have bounded duration');
 assert.ok(script.includes("'http://127.0.0.1:8648'|'http://localhost:8648'|'http://[::1]:8648'"));
});
test('malicious and nonconforming RPC URLs reject before any root/package step',()=>{
 for(const url of ['https://rpc.kriptoaman.com','http://127.0.0.1:8545','http://localhost:8648@attacker.example',
  'http://127.0.0.1:8648/path','http://example.org:8648','http://127.0.0.1:8648?x=1']){
  const p=spawnSync('bash',[file.pathname],{env:{...process.env,KAM_PRIVATE_RPC_URL:url},encoding:'utf8',timeout:4000});
  assert.notEqual(p.status,0,'expected unsafe url rejection: '+url);
  assert.match(p.stderr,/Refusing RPC endpoint/,url);
  assert.doesNotMatch(p.stderr,/apt-get|useradd/,url);
 }
});
