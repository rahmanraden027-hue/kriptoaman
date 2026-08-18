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

test('balance editing is hidden from users and enforced by an admin-only server endpoint', async () => {
  const [settings, editor, endpoint, authClient, wallet] = await Promise.all([
    read('src/pages/Settings.jsx'),
    read('src/components/wallet/AdminBalanceEditor.jsx'),
    read('functions/api/auth/admin/balance.js'),
    read('src/lib/kriptoAuth.js'),
    read('src/pages/Wallet.jsx'),
  ]);

  assert.match(settings, /adminOnly:\s*true/);
  assert.match(settings, /user\?\.role\s*===\s*'admin'/);
  assert.match(editor, /user\.role\s*!==\s*'admin'/);
  assert.doesNotMatch(editor, /auth\.updateMe\(\{\s*balances/);
  assert.match(editor, /updateAdminBalance/);
  assert.match(authClient, /\/api\/auth\/admin\/balance/);
  assert.match(endpoint, /user\.role\s*!==\s*'admin'/);
  assert.match(endpoint, /getActiveSession/);
  assert.match(endpoint, /status:\s*403/);
  assert.match(endpoint, /requireSameOrigin/);
  assert.match(endpoint, /Invalid balance values/);

  assert.match(wallet, /currentUser\?\.role\s*!==\s*'admin'/);
  assert.match(wallet, /kriptoAuth\.getAdminBalance\(\)/);
  assert.match(wallet, /currentUser\?\.role\s*===\s*'admin'/);
  assert.match(wallet, /Portofolio Admin/);
  assert.match(wallet, /KHUSUS ADMIN/);
  assert.match(wallet, /bukan saldo on-chain/);
});

test('admin user management uses first-party server data and contains no synthetic account counts', async () => {
  const [page, endpoint, authClient] = await Promise.all([
    read('src/pages/AdminUserBalances.jsx'),
    read('functions/api/auth/admin/users.js'),
    read('src/lib/kriptoAuth.js'),
  ]);

  assert.doesNotMatch(page, /asServiceRole/);
  assert.doesNotMatch(page, /PLATFORM_TOTAL_USERS|PLATFORM_KYC_PENDING|SAMPLE_EMAILS|SAMPLE_KYC_EMAILS/);
  assert.match(page, /kriptoAuth\.getAdminUsers/);
  assert.match(page, /kriptoAuth\.updateAdminUserKyc/);
  assert.match(endpoint, /getActiveSession/);
  assert.match(endpoint, /user\.role\s*!==\s*'admin'/);
  assert.match(endpoint, /requireSameOrigin/);
  assert.match(endpoint, /recordAdminAudit/);
  assert.match(endpoint, /user\.kyc\.update/);
  assert.match(authClient, /\/api\/auth\/admin\/users/);
});
