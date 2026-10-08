import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const probe=await readFile(new URL('../scripts/probe-zvq-four-scope-public.mjs',import.meta.url),'utf8');
const workflow=await readFile(new URL('../.github/workflows/zvq-four-scope-public-evidence.yml',import.meta.url),'utf8');
test('Four-scope observations have strict source and readiness boundaries',()=>{
 for(const required of ['scopes.validators','scopes.finality','scopes.tokens','scopes.liquidity','next_page_params',
  'eth_chainId','eth_blockNumber','eth_getBlockByNumber','finalized',
  'finalized tag + canonical hash','EXPECTED_VALIDATORS', 'fullFourScopeVerified',
  'READ_ONLY_NOT_RELEASE_APPROVAL','four-scope.json','UNVERIFIED'])
  if(required!=='EXPECTED_VALIDATORS')assert.ok(probe.includes(required),required);
 assert.match(probe,/expectedValidatorCount:4/);
 assert.match(probe,/readyForFullLaunch:false/);
 assert.match(probe,/report\.fullFourScopeVerified=false/);
 assert.match(probe,/privateEvidenceRequired:true/);
 assert.match(probe,/completeHistoricalERC20Index:'UNVERIFIED'/);
 assert.match(probe,/commercialTradingApproved:false/);
 assert.match(probe,/historicalReceiptsReconciled:false/);
});
test('No trading, privileged RPC, secrets, private mutation or schedule escalation',()=>{
 assert.match(workflow,/permissions:\s*\n\s*contents: read/);
 assert.match(workflow,/runs-on: ubuntu-latest/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/upload-artifact@v4/);
 assert.doesNotMatch(probe+workflow,/eth_sendRawTransaction|eth_sendTransaction|personal_listAccounts|admin_peers|debug_traceTransaction|qbft_getValidatorsByBlockNumber|private.?key|seed.?phrase|sudo|docker exec|deploy-zvq|self-hosted|wallet\.request/i);
 assert.ok(probe.includes("!['eth_chainId','eth_blockNumber','eth_getBlockByNumber'].includes(method)"));
});
