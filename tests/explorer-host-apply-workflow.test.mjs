import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/kam-explorer-host-apply.yml', import.meta.url), 'utf8');

test('Explorer host apply is manual and pinned to a dedicated self-hosted label', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /APPLY_EXPLORER_FRONTEND_ONLY/);
  assert.match(workflow, /runs-on: \[self-hosted, linux, x64, kam-explorer-host\]/);
});

test('Explorer host finalization captures public evidence before and after the host apply', () => {
  assert.match(workflow, /public-preflight:/);
  assert.match(workflow, /public-post-verify:/);
  assert.match(workflow, /explorer-preflight\.json/);
  assert.match(workflow, /explorer-presentation-before\.txt/);
  assert.match(workflow, /needs: public-preflight/);
  assert.match(workflow, /needs: apply-explorer-frontend/);
  assert.match(workflow, /explorer-public-after\.json/);
  assert.match(workflow, /explorer-presentation-after\.txt/);
  assert.match(workflow, /Placeholder Counter/);
  assert.match(workflow, /Gas tracker/);
});

test('Explorer host apply uses only the reviewed frontend helper and public diagnostic', () => {
  assert.match(workflow, /scripts\/apply-kam-explorer-branding\.sh/);
  assert.match(workflow, /scripts\/diagnose-blockscout\.mjs/);
  for (const forbidden of [
    'ssh ',
    'scp ',
    'rsync ',
    'docker compose restart backend',
    'docker compose restart indexer',
    'docker compose restart db',
    'qbft_',
    'eth_sendTransaction',
    'eth_sendRawTransaction',
  ]) {
    assert.doesNotMatch(workflow, new RegExp(forbidden));
  }
});
