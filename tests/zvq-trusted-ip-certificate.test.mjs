import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const s=await readFile(new URL('../scripts/issue-zvq-production-ip-cert.sh',import.meta.url),'utf8');
const w=await readFile(new URL('../.github/workflows/zvq-trusted-ip-certificate.yml',import.meta.url),'utf8');
test('persistent trusted cert issuance only after isolated staging preflight',()=>{
 assert.match(s,/certbot\/certbot:v5\.7\.0/);
 assert.match(s,/\/var\/lib\/zvq-origin-ip-tls/);
 assert.match(s,/--preferred-profile shortlived/);
 assert.match(s,/--ip-address "\$IP"/);
 assert.match(s,/--webroot --webroot-path/);
 assert.doesNotMatch(s,/--staging/);
 assert.match(s,/ZVQ_ACME_WEBROOT_V1/);
 assert.match(s,/stat -c '%a'/);
 assert.match(s,/install -d -m 0700/);
 assert.match(s,/openssl x509.*subjectAltName/);
});
test('no direct exposure, DNS, chain, validator, or destructive database changes during issuance',()=>{
 assert.doesNotMatch(s,/ufw allow|iptables|api\.cloudflare\.com|--publish|-p 443|docker compose up|--network host.*nginx|reset genesis|eth_sendRawTransaction|DELETE FROM/i);
 assert.match(w,/if: github\.event_name == 'push'/);
 assert.match(w,/sudo -n bash scripts\/issue-zvq-production-ip-cert\.sh/);
 assert.match(w,/group: zvq-trusted-ip-certificate/);
});
