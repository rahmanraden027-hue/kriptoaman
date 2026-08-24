import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin readiness uses live evidence and avoids unsupported certification claims', async () => {
  const page = await read('src/pages/ReadinessCheck.jsx');
  for (const endpoint of [
    '/api/market-snapshot?health=1',
    '/api/network-health',
    '/api/kyc/readiness',
    '/api/kam/network-status',
    '/api/auth/me',
  ]) assert.equal(page.includes(endpoint), true, `missing endpoint: ${endpoint}`);

  for (const unsupported of [
    'OJK License',
    'BI AML/CFT Registration',
    'ISO 27001 Certification',
    'PCI DSS Compliance',
    '98% of customer assets',
    '10K concurrent users',
  ]) assert.equal(page.includes(unsupported), false, `unsupported claim returned: ${unsupported}`);

  assert.match(page, /Verified System Readiness/);
  assert.match(page, /Belum Diverifikasi/);
  assert.match(page, /mainnet-candidate/);
});
