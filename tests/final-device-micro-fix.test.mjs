import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('primary route transitions reset the document viewport without changing routing', async () => {
  const app = await read('src/App.jsx');

  assert.match(app, /import \{ lazy, Suspense, useEffect \} from 'react'/);
  assert.match(app, /const \{ pathname \} = useLocation\(\)/);
  assert.match(app, /window\.requestAnimationFrame\(resetScroll\)/);
  assert.match(app, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/);
  assert.match(app, /document\.documentElement\.scrollTop = 0/);
  assert.match(app, /document\.body\.scrollTop = 0/);
  assert.match(app, /\}, \[pathname\]\)/);
});

test('ecosystem install CTA waits for intent and remains compact above mobile navigation', async () => {
  const prompt = await read('src/components/pwa/PWAInstallPrompt.jsx');

  assert.match(prompt, /const isServices = pathname === '\/Services'/);
  assert.match(prompt, /isServices && !scrolled/);
  assert.match(prompt, /bottom-\[calc\(6\.5rem\+env\(safe-area-inset-bottom,0px\)\)\]/);
  assert.match(prompt, /isPublicRoot \|\| isServices \|\| scrolled \|\| engaged \? 'w-11 px-0'/);
  assert.match(prompt, /isPublicRoot \|\| isServices \|\| scrolled \|\| engaged \? 'sr-only'/);
  assert.match(prompt, /min-h-11 min-w-11/);
});

test('Indonesian ecosystem copy no longer mixes generic English UI labels', async () => {
  const services = await read('src/pages/Services.jsx');

  for (const phrase of [
    "kicker: 'EKOSISTEM KRIPTOAMAN'",
    "unified: 'RUTE PRODUKSI'",
    "core: 'PRODUK INTI'",
    "main: 'Layanan Produksi'",
    "platformLayer: 'LAPISAN DATA'",
    "label: 'Intelijen Pasar'",
    "label: 'Jaringan ZEVARYQ'",
    "label: 'Status Sistem'",
  ]) assert.ok(services.includes(phrase), phrase);

  assert.match(services, /dataLayers: \['Data Pasar', 'On-chain', 'Bukti Jaringan', 'Identitas'\]/);
  assert.match(services, /dataLayers: \['Market Data', 'On-chain', 'Network Evidence', 'Identity'\]/);
  assert.match(services, /\{text\.dataLayers\.map\(\(label\) => \(/);

  const idBlock = services.slice(services.indexOf('  id: {'), services.indexOf('  en: {'));
  assert.doesNotMatch(idBlock, /PRODUCTION ROUTES|CORE PRODUCTS|Surface Produksi|Market Intelligence|ZEVARYQ Network|System Status/);
});

test('device micro-fix stays outside production data and chain behavior', async () => {
  const source = [
    await read('src/App.jsx'),
    await read('src/components/pwa/PWAInstallPrompt.jsx'),
    await read('src/pages/Services.jsx'),
  ].join('\n');

  assert.doesNotMatch(source, /eth_sendRawTransaction|eth_sendTransaction|private.?key|validator.?key|genesis/i);
  assert.equal(source.includes('rpc.kriptoaman.com'), false);
  assert.equal(source.includes('explorer.kriptoaman.com'), false);
});
