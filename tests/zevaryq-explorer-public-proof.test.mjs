import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow=await readFile(new URL('../.github/workflows/zevaryq-explorer-public-route-proof.yml',import.meta.url),'utf8');
test('public and dedicated origin probes reject stale explorer evidence panels',()=>{
 assert.match(workflow,/data-zevaryq-features="immune-token-v1"/);
 assert.match(workflow,/id="immune-monitor"/);
 assert.match(workflow,/id="token-discovery"/);
 assert.match(workflow,/PUBLIC_FEATURE_MISSING=1/);
 assert.match(workflow,/PUBLIC_FEATURE_MISSING: '0'/);
 assert.match(workflow,/local-http && \( "\$status" != 200 \|\| "\$feature" != 1 \)/);
 assert.match(workflow,/zvq_feature=immune-token-v1-\$GITHUB_RUN_ID/);
 assert.match(workflow,/Blockscout route \$route returned HTTP \$status/);
 assert.match(workflow,/ROUTE_PROOF_COMPLETE: read-only/);
 assert.doesNotMatch(workflow,/eth_sendRawTransaction|docker compose up|DELETE FROM|reset genesis|private.?key/i);
});
