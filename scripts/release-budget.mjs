#!/usr/bin/env node

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');
const MB = 1024 * 1024;
const budgets = {
  totalDistBytes: Number(process.env.KA_MAX_DIST_MB || 35) * MB,
  totalJsBytes: Number(process.env.KA_MAX_JS_MB || 20) * MB,
  largestJsBytes: Number(process.env.KA_MAX_JS_CHUNK_MB || 8) * MB,
};

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function mb(bytes) {
  return Number((bytes / MB).toFixed(2));
}

let files;
try {
  files = await walk(root);
} catch {
  console.error('dist/ not found. Run npm run build before release-budget.mjs.');
  process.exit(1);
}

const sized = await Promise.all(files.map(async (file) => ({ file, size: (await stat(file)).size })));
const js = sized.filter(({ file }) => /\.m?js$/i.test(file));
const totalDistBytes = sized.reduce((sum, item) => sum + item.size, 0);
const totalJsBytes = js.reduce((sum, item) => sum + item.size, 0);
const largestJs = js.sort((a, b) => b.size - a.size)[0] || { file: null, size: 0 };

const checks = [
  { name: 'total-dist', value: totalDistBytes, limit: budgets.totalDistBytes },
  { name: 'total-js', value: totalJsBytes, limit: budgets.totalJsBytes },
  { name: 'largest-js-chunk', value: largestJs.size, limit: budgets.largestJsBytes },
];

const failed = checks.filter((check) => check.value > check.limit);
const report = {
  ok: failed.length === 0,
  generatedAt: new Date().toISOString(),
  budgetsMb: {
    totalDist: mb(budgets.totalDistBytes),
    totalJs: mb(budgets.totalJsBytes),
    largestJsChunk: mb(budgets.largestJsBytes),
  },
  actualMb: {
    totalDist: mb(totalDistBytes),
    totalJs: mb(totalJsBytes),
    largestJsChunk: mb(largestJs.size),
  },
  largestJsChunk: largestJs.file ? path.relative(root, largestJs.file) : null,
  fileCount: sized.length,
  jsFileCount: js.length,
  failures: failed.map((check) => ({ name: check.name, actualMb: mb(check.value), limitMb: mb(check.limit) })),
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
