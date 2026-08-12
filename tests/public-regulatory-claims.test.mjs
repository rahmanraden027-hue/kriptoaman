import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public metadata and trust surfaces avoid unverified trust and regulatory claims', async () => {
  const [html, trust, compliance, regulatory] = await Promise.all([
    read('index.html'),
    read('src/components/home/BappebtiTrustBadge.jsx'),
    read('src/components/regulatory/ComplianceBadge.jsx'),
    read('src/pages/RegulatoryDocs.jsx'),
  ]);

  for (const source of [html, trust, compliance, regulatory]) {
    assert.doesNotMatch(source, /Platform Kripto Terpercaya Indonesia/i);
    assert.doesNotMatch(source, /Platform Terpercaya Indonesia/i);
    assert.doesNotMatch(source, /Fully Regulated\s*&\s*Compliant/i);
    assert.doesNotMatch(source, /OJK Licensed/i);
    assert.doesNotMatch(source, /BI Registered/i);
    assert.doesNotMatch(source, /PCI DSS L1/i);
    assert.doesNotMatch(source, /ISO\/IEC 27001:2022 Information Security Certified/i);
    assert.doesNotMatch(source, /98% of customer assets/i);
    assert.doesNotMatch(source, /100M\+ IDR coverage/i);
  }

  assert.match(regulatory, /tidak boleh ditafsirkan sebagai persetujuan regulator/i);
  assert.match(regulatory, /bukti resmi dapat diverifikasi/i);
  assert.match(compliance, /tidak menampilkan klaim lisensi/i);
});
