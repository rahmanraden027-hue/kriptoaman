import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
const workflow=await readFile(new URL('../.github/workflows/zvq-explorer-dns-only-cutover.yml',import.meta.url),'utf8');
test('no DNS modification until direct domain TLS, indexed data, existing IP fallback and chain ID pass',()=>{
  assert.match(workflow,/direct_origin_preflight=trusted_tls_plus_real_blocks/);
  assert.match(workflow,/needs: preflight/);
  assert.match(workflow,/blue-gold-orbital-20260924/);
  assert.match(workflow,/index.*v2/);
  assert.match(workflow,/0x560c/);
  assert.match(workflow,/146\.190\.93\.254/);
});
test('only exact Explorer A record is eligible for DNS-only cutover, with explicit scoped permission',()=>{
  assert.match(workflow,/CLOUDFLARE_DNS_API_TOKEN/);
  assert.match(workflow,/dns_cutover_blocked=dns_read_permission_required/);
  assert.match(workflow,/length==1 and \.\[0\]\.type=="A"/);
  assert.match(workflow,/-X PATCH/);
  assert.match(workflow,/proxied:false,ttl:120/);
  assert.match(workflow,/name:\$host,type:"A",content:\$ip/);
});
test('DNS rollback is conditional, protects concurrent operators and cannot alter chain or RPC',()=>{
  assert.match(workflow,/needs\.external\.result != 'success'/);
  assert.match(workflow,/concurrent_change_detected; refusing_override/);
  assert.match(workflow,/previous_record_restored/);
  assert.match(workflow,/dns_only=externally_verified/);
  assert.doesNotMatch(workflow,/eth_sendRawTransaction|DELETE FROM|validator_key|reset.*genesis|docker compose down/i);
});
