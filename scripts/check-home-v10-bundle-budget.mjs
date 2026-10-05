import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const distDir = resolve('dist');
const html = readFileSync(join(distDir, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)]
  .map(match => match[1])
  .filter((value, index, values) => values.indexOf(value) === index);

assert.ok(refs.length > 0, 'built index must reference initial JS/CSS assets');

const files = refs.map(ref => {
  const path = join(distDir, ref.replace(/^\//, ''));
  const content = readFileSync(path);
  return {
    ref,
    type: ref.endsWith('.css') ? 'css' : 'js',
    bytes: statSync(path).size,
    gzipBytes: gzipSync(content, { level: 9 }).length,
  };
});

const totals = files.reduce((acc, file) => {
  acc[file.type].bytes += file.bytes;
  acc[file.type].gzipBytes += file.gzipBytes;
  return acc;
}, {
  js: { bytes: 0, gzipBytes: 0 },
  css: { bytes: 0, gzipBytes: 0 },
});

const budgets = {
  js: { bytes: 1_600_000, gzipBytes: 550_000 },
  css: { bytes: 500_000, gzipBytes: 120_000 },
  totalGzipBytes: 650_000,
};

const totalGzipBytes = totals.js.gzipBytes + totals.css.gzipBytes;

assert.ok(totals.js.bytes <= budgets.js.bytes,
  `initial JS raw budget exceeded: ${totals.js.bytes} > ${budgets.js.bytes}`);
assert.ok(totals.js.gzipBytes <= budgets.js.gzipBytes,
  `initial JS gzip budget exceeded: ${totals.js.gzipBytes} > ${budgets.js.gzipBytes}`);
assert.ok(totals.css.bytes <= budgets.css.bytes,
  `initial CSS raw budget exceeded: ${totals.css.bytes} > ${budgets.css.bytes}`);
assert.ok(totals.css.gzipBytes <= budgets.css.gzipBytes,
  `initial CSS gzip budget exceeded: ${totals.css.gzipBytes} > ${budgets.css.gzipBytes}`);
assert.ok(totalGzipBytes <= budgets.totalGzipBytes,
  `initial payload gzip budget exceeded: ${totalGzipBytes} > ${budgets.totalGzipBytes}`);

const report = {
  checkedAt: new Date().toISOString(),
  scope: 'HomeV10 initial document assets only',
  files,
  totals,
  totalGzipBytes,
  budgets,
};

const evidenceDir = resolve(process.env.HOME_V10_EVIDENCE_DIR || 'home-v10-evidence');
mkdirSync(evidenceDir, { recursive: true });
writeFileSync(join(evidenceDir, 'bundle-budget.json'), JSON.stringify(report, null, 2));

console.log('HOME_V10_BUNDLE_BUDGET=PASS');
console.log(JSON.stringify(report, null, 2));
