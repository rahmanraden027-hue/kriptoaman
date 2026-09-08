import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('KAM Explorer SEO assets expose canonical crawl signals without indexing APIs', async () => {
  const [robots, sitemap] = await Promise.all([
    read('explorer-seo/robots.txt'),
    read('explorer-seo/sitemap.xml'),
  ]);

  assert.match(robots, /^User-agent: \*/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Disallow: \/api\/$/m);
  assert.match(robots, /^Sitemap: https:\/\/explorer\.kriptoaman\.com\/sitemap\.xml$/m);

  assert.match(sitemap, /<loc>https:\/\/explorer\.kriptoaman\.com\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/explorer\.kriptoaman\.com\/stats<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/explorer\.kriptoaman\.com\/developer\/starter<\/loc>/);
  assert.doesNotMatch(sitemap, /\/api\/v2\//);
});

test('SEO deployment is idempotent, path-stable, readiness-gated, cache-safe, and isolated to the Explorer proxy', async () => {
  const script = await read('scripts/apply-kam-explorer-seo.sh');

  assert.match(script, /KAM_EXPLORER_SEO_BEGIN/);
  assert.match(script, /KAM_EXPLORER_V2_BEGIN/);
  assert.match(script, /ROBOTS_SOURCE="\$\(realpath "\$ROBOTS_SOURCE"\)"/);
  assert.match(script, /SITEMAP_SOURCE="\$\(realpath "\$SITEMAP_SOURCE"\)"/);
  assert.match(script, /<link rel="canonical" href="\{canonical\}" \/>/);
  assert.match(script, /meta property="og:url" content="\{canonical\}" \/>/);
  assert.match(script, /meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/);
  assert.match(script, /location = \/robots\.txt/);
  assert.match(script, /location = \/sitemap\.xml/);
  assert.match(script, /data-kam-stats-version="2\.0\.0"/);
  assert.match(script, /Placeholder Counter/);
  assert.match(script, /amount in ETH/);
  assert.match(script, /docker run --rm --network none -i/);

  // Proxy replacement must never fan out into Blockscout dependencies.
  assert.match(script, /docker compose up -d --force-recreate --no-deps proxy/);
  assert.doesNotMatch(script, /docker compose up -d --force-recreate proxy/);
  assert.doesNotMatch(script, /docker compose (?:restart|up[^\n]*)(?:db|postgres|indexer|backend)/i);
  assert.doesNotMatch(script, /--privileged/);

  // A transient 502 immediately after proxy recreation must be absorbed by bounded readiness polling.
  assert.match(script, /wait_for_stats_ready\(\)/);
  assert.match(script, /wait_for_stats_ready 20/);
  assert.match(script, /--connect-timeout 3 --max-time 8/);
  assert.match(script, /seo_ready=\$\{STAMP\}_\$\{attempt\}/);
  assert.match(script, /x-kam-explorer-stats-version: \*2/);
  assert.match(script, /KAM Explorer proxy did not become ready with verified canonical stats/);

  // Every post-restart verification uses a cache-busting URL but still requires the canonical URL without query parameters.
  assert.match(script, /seo_verify=\$\{STAMP\}_\$RANDOM/);
  assert.match(script, /ROBOTS_URL="https:\/\/explorer\.kriptoaman\.com\/robots\.txt\?seo_verify=/);
  assert.match(script, /SITEMAP_URL="https:\/\/explorer\.kriptoaman\.com\/sitemap\.xml\?seo_verify=/);
  assert.match(script, /KAM Explorer SEO verification failed:/);
  assert.match(script, /seo_page_verified=\$path/);
  assert.match(script, /seo_asset_verified=\/robots\.txt/);
  assert.match(script, /seo_asset_verified=\/sitemap\.xml/);
});
