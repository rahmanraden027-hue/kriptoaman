import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const script=await readFile(new URL('../scripts/enable-zvq-origin-acme-webroot.sh',import.meta.url),'utf8');
const flow=await readFile(new URL('../.github/workflows/zvq-origin-acme-webroot.yml',import.meta.url),'utf8');
test('ACME location is only static files, exact NGINX root and bounded methods',()=>{
 assert.match(script,/location \^~ \/\.well-known\/acme-challenge\//);
 assert.match(script,/root \/etc\/nginx\/templates/);
 assert.match(script,/try_files \/kam-dashboard\$uri =404/);
 assert.match(script,/limit_except GET \{ deny all; \}/);
 assert.match(script,/location = \/ \{/);
 assert.match(script,/ZVQ_ACME_WEBROOT_V1/);
 assert.doesNotMatch(script,/api\/v2\/\*|eth_sendRawTransaction|DROP TABLE|docker compose down|ufw disable/i);
});
test('change preserves known-good Explorer, backs up NGINX and restores on failed probe',()=>{
 assert.match(script,/data-zvq-token-discovery="indexed-v2"/);
 assert.match(script,/data-zvq-reference-visual="blue-gold-orbital-20260924"/);
 assert.match(script,/cp -a "\$TEMPLATE" "\$BACKUP"/);
 assert.match(script,/trap rollback ERR/);
 assert.match(script,/cp -a "\$BACKUP" "\$TEMPLATE"/);
 assert.match(script,/docker exec "\$CURRENT_ID" nginx -t/);
 assert.match(script,/test "\$body" = "\$CONTENT"/);
 assert.match(flow,/runs-on: \[self-hosted, linux, x64, kam-explorer-host\]/);
 assert.match(flow,/if: github.event_name == 'push'/);
 assert.match(flow,/public_ip_acme_path=verified-exact-bytes/);
 assert.match(flow,/origin_temporary_acme_proof_removed=yes/);
 assert.match(flow,/sudo -n env GITHUB_RUN_ID="\$GITHUB_RUN_ID" bash scripts\/enable-zvq-origin-acme-webroot\.sh/);
});
