import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/zevaryq-explorer-public-route-proof.yml', import.meta.url), 'utf8');

test('scheduled public proof checks exact approved design on public default and bypass URL', () => {
  assert.match(workflow, /cron: '41 \* \* \* \*'/);
  assert.match(workflow, /visual='blue-gold-orbital-20260924'/);
  assert.match(workflow, /for label in default bypass/);
  assert.match(workflow, /data-zvq-reference-visual/);
  assert.match(workflow, /'146\\.190\\.93\\.254'/);
  assert.match(workflow, /data-zevaryq-explorer-version/);
  assert.match(workflow, /\\^server: nginx/);
  assert.doesNotMatch(workflow, /grep -iq.*x-zevaryq-explorer-design/);
  assert.match(workflow, /class="triad"/);
  assert.match(workflow, /class="satellite-row"/);
  assert.match(workflow, /id="token-discovery"/);
});

test('production public proof checks RPC Chain ID, indexed blocks and both brand assets', () => {
  assert.match(workflow, /eth_chainId/);
  assert.match(workflow, /https:\\/\\/rpc\\.kriptoaman\\.com\\//);
  assert.match(workflow, /test "\\$blocked" = 403/);
  assert.match(workflow, /test "\$\(jq -er '\.result' <<<"\$chain"\)" = '0x560c'/);
  assert.match(workflow, /\/api\/v2\/blocks/);
  assert.match(workflow, /length > 0/);
  assert.match(workflow, /zevaryq-favicon.png/);
  assert.match(workflow, /zevaryq-emblem.webp/);
  assert.doesNotMatch(workflow, /genesis|validator private key|redis.*wipe|postgres.*reset/i);
});

test('local origin requires independently visible approved visual marker', () => {
  assert.match(workflow, /visual_approved=\$design/);
  assert.match(workflow, /\$label" == local-http/);
  assert.match(workflow, /\$design" != 1/);
  assert.match(workflow, /public_dns=/);
});
