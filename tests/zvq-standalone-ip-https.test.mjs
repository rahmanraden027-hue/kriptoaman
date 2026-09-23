import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const stage=await readFile(new URL('../scripts/enable-zvq-origin-ip-tls.sh',import.meta.url),'utf8');
const renewal=await readFile(new URL('../scripts/renew-zvq-ip-cert.sh',import.meta.url),'utf8');
const final=await readFile(new URL('../scripts/finalize-zvq-origin-ip-tls.sh',import.meta.url),'utf8');
const workflow=await readFile(new URL('../.github/workflows/zvq-standalone-ip-https.yml',import.meta.url),'utf8');
test('trusted IP SAN and reserved 443 must be verified before an isolated TLS listener is created',()=>{
 assert.match(stage,/IP=146\.190\.93\.254/);
 assert.match(stage,/openssl x509.*subjectAltName/);
 assert.match(stage,/checkend 172800/);
 assert.match(stage,/test -z "\$\(ss -H -ltn/);
 assert.match(stage,/nginx:stable-alpine/);
 assert.match(stage,/nginx -t/);
 assert.match(stage,/--network host --restart unless-stopped/);
 assert.match(stage,/--read-only --cap-drop ALL/);
 assert.match(stage,/--security-opt no-new-privileges/);
 assert.match(stage,/--mount "type=bind,src=\/etc\/letsencrypt,dst=\/etc\/letsencrypt,readonly"/);
 assert.match(stage,/--network none/);
});
test('standalone fallback exposes only safe GET indexer endpoints, never raw RPC or admin',()=>{
 assert.match(stage,/location \^~ \/api\/v2\//);
 assert.match(stage,/location = \/rpc \{ return 403; \}/);
 assert.match(stage,/location \^~ \/api\/ \{ return 403; \}/);
 assert.match(stage,/location \/ \{ return 404; \}/);
 assert.match(stage,/limit_except GET \{ deny all; \}/);
 assert.match(workflow,/standalone_rpc=blocked/);
 assert.doesNotMatch(stage,/eth_sendRawTransaction|qbft_getValidators|docker compose down|wipe|reset.*genesis|Cloudflare API/i);
});
test('short-lived certificate is renewed independently with reload only on actual rotation',()=>{
 assert.match(renewal,/certbot\/certbot:v5\.7\.0/);
 assert.match(renewal,/renew --non-interactive --cert-name zvq-origin-ip/);
 assert.match(renewal,/--preferred-profile shortlived/);
 assert.match(renewal,/docker exec "\$NAME" nginx -s reload/);
 assert.match(final,/OnCalendar=\*-\*-\* 03,15:00:00 UTC/);
 assert.match(final,/systemctl enable --now zvq-origin-ip-renew\.timer/);
 assert.match(final,/systemctl start zvq-origin-ip-renew\.service/);
});
test('production rollout requires independent externally verified certificate and bounded rollback',()=>{
 assert.match(workflow,/github\.event_name == 'push'/);
 assert.match(workflow,/EXTERNAL_RESULT: \$\{\{ needs\.external\.result \}\}/);
 assert.match(workflow,/curl --noproxy '\*' --fail-with-body/);
 assert.match(workflow,/curl --noproxy '\*'.*origin/);
 assert.match(final,/if \[\[ "\$PROOF" != success \]\]/);
 assert.match(final,/docker rm -f "\$NAME"/);
 assert.match(stage,/ufw allow 443\/tcp/);
 assert.match(stage,/trap rollback ERR/);
 assert.doesNotMatch(workflow,/CLOUDFLARE_API_TOKEN|eth_sendRawTransaction|DELETE FROM|power_cycle/i);
});
