#!/usr/bin/env node

/**
 * Conservative HTTP load baseline for KriptoAman staging/preview only.
 * This script intentionally refuses known production hosts.
 * It does not test KAM RPC/explorer, wallets, KYC writes, registration writes,
 * or any other state-changing endpoint.
 */

const target = process.env.LOAD_TEST_TARGET;
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 10);
const requests = Number(process.env.LOAD_TEST_REQUESTS || 100);
const timeoutMs = Number(process.env.LOAD_TEST_TIMEOUT_MS || 10000);

if (!target) {
  console.error('LOAD_TEST_TARGET is required. Use a dedicated staging/preview origin.');
  process.exit(2);
}

let origin;
try {
  origin = new URL(target);
} catch {
  console.error('LOAD_TEST_TARGET must be a valid absolute URL.');
  process.exit(2);
}

if (origin.protocol !== 'https:') {
  console.error('Refusing load test: target must use HTTPS.');
  process.exit(2);
}

const hostname = origin.hostname.toLowerCase();
const blockedHosts = new Set([
  'kriptoaman.com',
  'www.kriptoaman.com',
  'rpc.kriptoaman.com',
  'explorer.kriptoaman.com',
]);

if (blockedHosts.has(hostname) || hostname.endsWith('.kriptoaman.com')) {
  console.error(`Refusing load test against production/company hostname: ${hostname}`);
  process.exit(2);
}

if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) {
  console.error('LOAD_TEST_CONCURRENCY must be an integer from 1 to 100.');
  process.exit(2);
}

if (!Number.isInteger(requests) || requests < 1 || requests > 10000) {
  console.error('LOAD_TEST_REQUESTS must be an integer from 1 to 10000.');
  process.exit(2);
}

const paths = ['/', '/login', '/api/auth/readiness'];
const samples = [];
let cursor = 0;

async function oneRequest(path) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(new URL(path, origin), {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'KriptoAman-Staging-Load-Baseline/1.0' },
    });
    const elapsed = performance.now() - started;
    await response.arrayBuffer();
    return { path, status: response.status, ms: elapsed, ok: response.status >= 200 && response.status < 400 };
  } catch (error) {
    return { path, status: 0, ms: performance.now() - started, ok: false, error: error?.name || 'request_error' };
  } finally {
    clearTimeout(timer);
  }
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= requests) return;
    samples.push(await oneRequest(paths[index % paths.length]));
  }
}

const wallStarted = performance.now();
await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, worker));
const wallMs = performance.now() - wallStarted;

const sorted = samples.map((s) => s.ms).sort((a, b) => a - b);
const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] || 0;
const failures = samples.filter((s) => !s.ok);
const summary = {
  target: origin.origin,
  requests: samples.length,
  concurrency,
  successRate: Number((((samples.length - failures.length) / samples.length) * 100).toFixed(2)),
  errorRate: Number(((failures.length / samples.length) * 100).toFixed(2)),
  throughputRps: Number((samples.length / (wallMs / 1000)).toFixed(2)),
  latencyMs: {
    p50: Number(percentile(0.50).toFixed(1)),
    p95: Number(percentile(0.95).toFixed(1)),
    p99: Number(percentile(0.99).toFixed(1)),
    max: Number((sorted.at(-1) || 0).toFixed(1)),
  },
  failuresByStatus: failures.reduce((acc, sample) => {
    const key = String(sample.status || sample.error || 'unknown');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}),
};

console.log(JSON.stringify(summary, null, 2));

// Baseline guardrails: a failed request makes the run fail. Latency is reported,
// not used as a release gate until staging measurements establish a realistic SLO.
if (failures.length > 0) process.exit(1);
