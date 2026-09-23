import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [worker,flow,cert,listener,renew,finalize]=await Promise.all([
  read('chain/kam-mainnet/zvq-acme-bridge/worker.mjs'),
  read('.github/workflows/zvq-explorer-domain-origin-tls.yml'),
  read('scripts/issue-zvq-explorer-domain-cert.sh'),
  read('scripts/enable-zvq-explorer-domain-tls.sh'),
  read('scripts/renew-zvq-explorer-domain-cert.sh'),
  read('scripts/finalize-zvq-explorer-domain-tls.sh')
]);
test('Worker is limited to ACME static GET/HEAD and never proxies privileged API',()=>{
  assert.match(worker,/\.well-known\/acme-challenge/);
  assert.match(worker,/request\.method !== 'GET'/);
  assert.match(worker,/request\.method !== 'HEAD'/);
  assert.match(worker,/cache-control.*no-store/);
  assert.doesNotMatch(worker,/eth_sendRawTransaction|qbft_|\/api\/|\/rpc|private_key/i);
});
test('route is more specific than the existing homepage and API routes and requires exact external proof',()=>{
  assert.match(flow,/ROUTE: explorer\.kriptoaman\.com\/\.well-known\/acme-challenge\/\*/);
  assert.match(flow,/zevaryq-explorer-public-bridge-orbital-indexed-20260924/);
  assert.match(flow,/kam-mainnet-blockscout-api/);
  assert.match(flow,/independent_acme_upstream=verified_exact_bytes/);
  assert.match(flow,/public_http01=verified_exact_bytes/);
  assert.match(flow,/needs:\s*route-proof/);
  assert.match(flow,/clean-route-on-failure:/);
  assert.doesNotMatch(flow,/-X PATCH.*dns_records|CLOUDFLARE_DNS_API_TOKEN|cloudflare dns edit|docker compose down/i);
});
test('domain HTTPS is a separate SNI listener preserving original IP TLS with rollback',()=>{
  assert.match(cert,/--webroot --webroot-path/);
  assert.match(cert,/--cert-name zvq-explorer-domain/);
  assert.match(listener,/ZVQ_DOMAIN_TLS_V1/);
  assert.match(listener,/default_server/);
  assert.match(listener,/server_name explorer\.kriptoaman\.com/);
  assert.match(listener,/docker exec "\$NAME" nginx -t/);
  assert.match(listener,/cat "\$BACKUP" > "\$CONFIG"/);
  assert.match(flow,/trusted_origin_domain_tls=verified/);
  assert.match(flow,/simulated_primary_failure=runner_only/);
  assert.doesNotMatch(listener,/eth_sendRawTransaction|genesis|validator.*key|DELETE FROM/i);
});
test('local short-lived domain renewal is gated on independent public proof',()=>{
  assert.match(finalize,/if \[\[ "\$PROOF" != success \]\]/);
  assert.match(finalize,/OnCalendar=\*-\*-\* 04,16:00:00 UTC/);
  assert.match(finalize,/systemctl enable --now zvq-explorer-domain-renew\.timer/);
  assert.match(renew,/certbot\/certbot:v5\.7\.0 renew/);
  assert.match(renew,/nginx -s reload/);
});

test('NGINX domain rollout waits for a newly loaded SNI worker before declaring a TLS failure',()=>{
  assert.match(listener,/nginx -T/);
  assert.match(listener,/Bound container did not receive new SNI configuration/);
  assert.match(listener,/for attempt in \$\(seq 1 12\)/);
  assert.match(listener,/domain_sni_new_worker_verified_attempt=/);
  assert.match(listener,/test "\$verified" = true/);
});
