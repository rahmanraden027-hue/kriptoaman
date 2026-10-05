import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 10L.5 sitemap promotes ZEVARYQ and excludes legacy KAM production URLs', async () => {
  const sitemap = await read('public/sitemap.xml');
  assert.ok(sitemap.includes('https://kriptoaman.com/ZEVARYQ'));
  assert.ok(sitemap.includes('https://kriptoaman.com/Enterprise'));
  assert.doesNotMatch(sitemap, /<loc>https:\/\/kriptoaman\.com\/KAM/);
  assert.doesNotMatch(sitemap, /kam-mainnet-architecture/);
  assert.doesNotMatch(sitemap, /news\/kam-campaign-2026/);
  assert.doesNotMatch(sitemap, /https:\/\/kriptoaman\.com\/enterprise</);
});

test('Phase 10L.5 server headers noindex legacy KAM archive surfaces', async () => {
  const headers = await read('public/_headers');
  assert.match(headers, /\/KAM\*[^]*X-Robots-Tag: noindex, follow, noarchive/);
  assert.match(headers, /\/news\/kam-campaign-2026[^]*X-Robots-Tag: noindex, follow, noarchive/);
  assert.match(headers, /\/research\/kam-mainnet-architecture[^]*X-Robots-Tag: noindex, follow, noarchive/);
});

test('Phase 10L.5 dynamic SEO explicitly indexes current ZEVARYQ identity', async () => {
  const seo = await read('src/lib/RouteSeo.jsx');
  assert.match(seo, /'\/ZEVARYQ': \{/);
  assert.match(seo, /ZEVARYQ Mainnet \(ZVQ\) — Verified Network Identity/);
  assert.match(seo, /Chain ID 22028 \(0x560c\)/);
  assert.match(seo, /twitter:card', 'summary'/);
  assert.match(seo, /og:image:width', '1024'/);
  assert.match(seo, /og:image:height', '1024'/);
});

test('Phase 10L.5 research points current network identity to ZEVARYQ', async () => {
  const research = await read('src/pages/Research.jsx');
  assert.ok(research.includes('https://kriptoaman.com/ZEVARYQ'));
  assert.match(research, /to="\/ZEVARYQ"/);
  assert.doesNotMatch(research, /Current ZEVARYQ Documentation/);
  assert.doesNotMatch(research, /to="\/KAMNetworkDocs"/);
});

test('Phase 10L.5 labels legacy KAM publications as non-indexed historical archives', async () => {
  const [paper, campaign] = await Promise.all([
    read('src/pages/KAMResearchPaper.jsx'),
    read('src/pages/KAMCampaignNews.jsx'),
  ]);
  assert.match(paper, /Historical Archive — KAM Mainnet Architecture/);
  assert.match(paper, /noindex,follow,noarchive/);
  assert.match(paper, /current production network identity is ZEVARYQ Mainnet/);
  assert.match(campaign, /Historical Archive — Kampanye Global KAM 2026/);
  assert.match(campaign, /noindex,follow,noarchive/);
  assert.match(campaign, /migrasi identitas jaringan ke ZEVARYQ Mainnet \(ZVQ\)/);
});
