import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const script=await readFile(new URL('../scripts/verify-zvq-staging-ip-cert.sh',import.meta.url),'utf8');
const workflow=await readFile(new URL('../.github/workflows/zvq-staging-ip-cert-proof.yml',import.meta.url),'utf8');
test('IP certificate proof is staging-only and cleans its generated account key',()=>{
 assert.match(script,/certbot\/certbot:v5\.7\.0/);
 assert.match(script,/certonly --staging --non-interactive/);
 assert.match(script,/--preferred-profile shortlived --webroot/);
 assert.match(script,/--ip-address "\$IP"/);
 assert.match(script,/trap cleanup EXIT/);
 assert.match(script,/rm -rf -- "\$STAGE"/);
 assert.match(script,/IP Address:\$IP/);
 assert.doesNotMatch(script,/ufw allow|docker run -d|docker compose up|--force-recreate|cloudflare.com\/client\/v4/);
});
test('isolated runner job preserves run ID under sudo',()=>{
 assert.match(workflow,/github\.event_name == 'push'/);
 assert.match(workflow,/ZVQ_ACME_RUN_ID="\$GITHUB_RUN_ID"/);
 assert.match(workflow,/kam-explorer-host/);
 assert.doesNotMatch(workflow,/secrets\.|environment: production/);
});
