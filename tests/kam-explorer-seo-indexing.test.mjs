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

test('SEO deployment is idempotent, canonicalizes verified surfaces, and preserves the Explorer V2 boundary', async () => {
  const script = await read('scripts/apply-kam-explorer-seo.sh');

  assert.match(script, /KAM_EXPLORER_SEO_BEGIN/);
  assert.match(script, /KAM_EXPLORER_V2_BEGIN/);
  assert.match(script, /<link rel="canonical" href="\{canonical\}" \/>/);
  assert.match(script, /meta property="og:url" content="\{canonical\}" \/>/);
  assert.match(script, /meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/);
  assert.match(script, /location = \/robots\.txt/);
  assert.match(script, /location = \/sitemap\.xml/);
  assert.match(script, /data-kam-stats-version="2\.0\.0"/);
  assert.match(script, /Placeholder Counter/);
  assert.match(script, /amount in ETH/);
  assert.match(script, /docker run --rm --network none -i/);
  assert.match(script, /docker compose up -d --force-recreate proxy/);
  assert.doesNotMatch(script, /--privileged/);
  assert.doesNotMatch(script, /docker compose (?:restart|up[^\n]*)(?:db|postgres|indexer|backend)/i);
});
