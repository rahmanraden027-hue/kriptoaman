import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const s=await readFile(new URL('../scripts/issue-zvq-production-ip-cert.sh',import.meta.url),'utf8');
const w=await readFile(new URL('../.github/workflows/zvq-production-ip-cert.yml',import.meta.url),'utf8');
test('short-lived production IP certificate is isolated from public routing and private consensus',()=>{
 assert.match(s,/certbot\/certbot:v5\.7\.0/);
 assert.match(s,/--preferred-profile shortlived/);
 assert.match(s,/--webroot --webroot-path \/var\/www\/html/);
 assert.match(s,/--ip-address "\$IP"/);
 assert.match(s,/--cert-name zvq-origin-ip/);
 assert.match(s,/IP Address:\$IP/);
 assert.match(s,/noout -checkend 259200/);
 assert.doesNotMatch(s,/--staging|ufw allow|docker run -d|docker compose up|cloudflare\.com|eth_sendRawTransaction/);
});
test('issuance waits for push and existing current origin ACME path',()=>{
 assert.match(w,/github\.event_name == 'push'/);
 assert.match(w,/ZVQ_TLS_RUN_ID="\$GITHUB_RUN_ID"/);
 assert.match(s,/ZVQ_ACME_WEBROOT_V1/);
 assert.match(s,/data-zvq-token-discovery="indexed-v2"/);
 assert.doesNotMatch(w,/secrets\./);
});
