import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('private routes are protected and marked noindex', async () => {
  const [app, headers, robots] = await Promise.all([
    read('src/App.jsx'),
    read('public/_headers'),
    read('public/robots.txt'),
  ]);

  const publicSet = app.match(/const PUBLIC_PAGE_KEYS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
  assert.doesNotMatch(publicSet, /PlatformDocs/);
  assert.match(headers, /\/Admin\*[\s\S]*X-Robots-Tag: noindex, nofollow, noarchive/);
  assert.match(headers, /\/PlatformDocs\*[\s\S]*X-Robots-Tag: noindex, nofollow, noarchive/);
  assert.match(headers, /\/Settings\*[\s\S]*X-Robots-Tag: noindex, nofollow, noarchive/);
  assert.match(robots, /Disallow: \/api\//);
  assert.doesNotMatch(robots, /Disallow: \/Admin/);
});

test('regulatory and security UI avoids unsupported claims and synthetic activity', async () => {
  const [trust, compliance, regulatory, security] = await Promise.all([
    read('src/components/home/BappebtiTrustBadge.jsx'),
    read('src/components/regulatory/ComplianceBadge.jsx'),
    read('src/pages/RegulatoryDocs.jsx'),
    read('src/pages/SecurityHub.jsx'),
  ]);

  const combined = [trust, compliance, regulatory, security].join('\n');
  assert.doesNotMatch(combined, /Platform Terpercaya Indonesia/i);
  assert.doesNotMatch(combined, /Fully Regulated\s*&\s*Compliant/i);
  assert.doesNotMatch(combined, /OJK Licensed/i);
  assert.doesNotMatch(combined, /BI Registered/i);
  assert.doesNotMatch(combined, /PCI DSS L1/i);
  assert.doesNotMatch(combined, /iPhone 15 Pro/i);
  assert.doesNotMatch(combined, /Laptop Kantor/i);
  assert.doesNotMatch(combined, /Math\.random/i);
  assert.match(regulatory, /bukti resmi dapat diverifikasi/i);
  assert.match(security, /sesi login nyata|bersumber dari data nyata/i);
  assert.match(security, /bukan jaminan tingkat keamanan/i);
});
