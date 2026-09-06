import { writeFile } from 'node:fs/promises';

const ORIGIN = (process.env.KA_SLO_ORIGIN || 'https://kriptoaman.com').replace(/\/$/, '');
const SAMPLES = Math.max(3, Math.min(12, Number(process.env.KA_SLO_SAMPLES || 6)));
const ENDPOINTS = [
  { name: 'homepage', path: '/', targetP95Ms: 1500, hardP95Ms: 3000, json: false },
  { name: 'market-hot', path: '/api/market-hot', targetP95Ms: 750, hardP95Ms: 2000, json: true },
  { name: 'market-page', path: '/api/market-snapshot-page?page=0&limit=100', targetP95Ms: 1000, hardP95Ms: 2500, json: true },
  { name: 'platform-status', path: '/api/platform-status', targetP95Ms: 1000, hardP95Ms: 2500, json: true },
  { name: 'network-health', path: '/api/network-health', targetP95Ms: 750, hardP95Ms: 2500, json: true },
  { name: 'kam-network-status', path: '/api/kam/network-status', targetP95Ms: 1000, hardP95Ms: 3000, json: true },
  { name: 'scaling-readiness', path: '/api/scaling-readiness', targetP95Ms: 1000, hardP95Ms: 2500, json: true },
];

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

function diagnosticBody(body) {
  if (!body || typeof body !== 'object') return null;
  return {
    overall: body.overall ?? null,
    healthy: body.healthy ?? null,
    summary: body.summary ?? null,
    delivery: body.delivery ?? null,
    checked_at: body.checked_at ?? body.checkedAt ?? null,
  };
}

async function sampleEndpoint(endpoint) {
  const samples = [];
  for (let i = 0; i < SAMPLES; i += 1) {
    const started = performance.now();
    let status = 0;
    let ok = false;
    let body = null;
    let error = null;
    let responseHeaders = null;
    try {
      const response = await fetch(`${ORIGIN}${endpoint.path}`, {
        headers: { Accept: endpoint.json ? 'application/json' : 'text/html,*/*' },
        signal: AbortSignal.timeout(10_000),
      });
      status = response.status;
      ok = response.ok;
      responseHeaders = {
        cache: response.headers.get('x-kriptoaman-network-cache')
          || response.headers.get('x-kriptoaman-status-cache')
          || response.headers.get('cf-cache-status')
          || null,
        delivery: response.headers.get('x-kriptoaman-network-delivery') || null,
        ray: response.headers.get('cf-ray') || null,
      };
      if (endpoint.json) body = await response.json().catch(() => null);
      else await response.arrayBuffer();
    } catch (err) {
      error = err?.name || 'fetch_error';
    }
    samples.push({
      latencyMs: Math.round(performance.now() - started),
      status,
      ok,
      error,
      responseHeaders,
      body,
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  const latencies = samples.filter((s) => s.ok).map((s) => s.latencyMs);
  const failures = samples.filter((s) => !s.ok).length;
  const failureSamples = samples
    .filter((s) => !s.ok)
    .map((s) => ({
      latencyMs: s.latencyMs,
      status: s.status,
      error: s.error,
      responseHeaders: s.responseHeaders,
      body: diagnosticBody(s.body),
    }));
  return {
    name: endpoint.name,
    path: endpoint.path,
    samples: samples.length,
    failures,
    errorRate: samples.length ? failures / samples.length : 1,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    maxMs: latencies.length ? Math.max(...latencies) : null,
    targetP95Ms: endpoint.targetP95Ms,
    hardP95Ms: endpoint.hardP95Ms,
    targetMet: failures === 0 && percentile(latencies, 95) != null && percentile(latencies, 95) <= endpoint.targetP95Ms,
    hardGateMet: failures / samples.length < 0.05 && percentile(latencies, 95) != null && percentile(latencies, 95) <= endpoint.hardP95Ms,
    failureSamples,
    latestBody: samples.findLast((s) => s.ok)?.body || null,
  };
}

const results = [];
for (const endpoint of ENDPOINTS) results.push(await sampleEndpoint(endpoint));

const market = results.find((r) => r.name === 'market-hot')?.latestBody;
const network = results.find((r) => r.name === 'network-health')?.latestBody;
const scaling = results.find((r) => r.name === 'scaling-readiness')?.latestBody;
const hardFailures = results.filter((r) => !r.hardGateMet);
const targetMisses = results.filter((r) => !r.targetMet);

const report = {
  checkedAt: new Date().toISOString(),
  origin: ORIGIN,
  sampleCountPerEndpoint: SAMPLES,
  status: hardFailures.length ? 'hard_failure' : targetMisses.length ? 'within_hard_gate_target_optimization_needed' : 'target_met',
  slo: {
    availabilityTarget: '>=99.9% rolling objective',
    requestErrorTarget: '<1%',
    cachedPublicApiP95TargetMs: 500,
    endpointTargetsAreTransitional: true,
    marketHotFreshnessTargetMs: 60_000,
    networkMinimumLiveTarget: 12,
    networkFullCoverageTarget: 21,
  },
  current: {
    marketHotHealthy: market?.healthy === true,
    marketHotAgeMs: Number(market?.ageMs ?? -1),
    networkOnline: Number(network?.summary?.online || 0),
    networkTotal: Number(network?.summary?.total || 0),
    networkDegraded: Number(network?.summary?.degraded || 0),
    d1SessionsApiAvailable: scaling?.components?.d1?.sessionsApiAvailable === true,
    d1ReadReplicationAccountState: scaling?.components?.d1?.readReplicationAccountState || 'unknown',
    queueConfigured: scaling?.components?.asyncRefreshQueue?.configured === true,
  },
  endpointResults: results.map(({ latestBody, ...rest }) => rest),
  targetMisses: targetMisses.map((r) => r.name),
  hardFailures: hardFailures.map((r) => r.name),
};

const failureLines = report.endpointResults
  .filter((r) => r.failureSamples?.length)
  .flatMap((r) => r.failureSamples.map((sample) =>
    `- ${r.name}: status=${sample.status} error=${sample.error ?? 'none'} latency=${sample.latencyMs}ms cache=${sample.responseHeaders?.cache ?? 'none'} delivery=${sample.responseHeaders?.delivery ?? 'none'} ray=${sample.responseHeaders?.ray ?? 'none'} body=${JSON.stringify(sample.body)}`,
  ));

const md = [
  '# KriptoAman Production SLO Proof',
  '',
  `- Checked: ${report.checkedAt}`,
  `- Status: **${report.status}**`,
  `- Market hot age: ${report.current.marketHotAgeMs} ms`,
  `- Multi-chain: ${report.current.networkOnline}/${report.current.networkTotal} live; degraded ${report.current.networkDegraded}`,
  `- D1 Sessions API: ${report.current.d1SessionsApiAvailable ? 'available' : 'not detected'}`,
  `- D1 read replication account state: ${report.current.d1ReadReplicationAccountState}`,
  `- Async refresh queue binding: ${report.current.queueConfigured ? 'configured' : 'not configured'}`,
  '',
  '| Endpoint | p50 | p95 | max | errors | target | hard gate |',
  '|---|---:|---:|---:|---:|---:|---|',
  ...report.endpointResults.map((r) => `| ${r.name} | ${r.p50Ms ?? '—'} ms | ${r.p95Ms ?? '—'} ms | ${r.maxMs ?? '—'} ms | ${(r.errorRate * 100).toFixed(1)}% | ${r.targetP95Ms} ms | ${r.hardGateMet ? 'PASS' : 'FAIL'} |`),
  '',
  `Target misses: ${report.targetMisses.length ? report.targetMisses.join(', ') : 'none'}`,
  `Hard failures: ${report.hardFailures.length ? report.hardFailures.join(', ') : 'none'}`,
  '',
  '## Failed sample diagnostics',
  ...(failureLines.length ? failureLines : ['- none']),
].join('\n');

await writeFile('production-slo-proof.json', `${JSON.stringify(report, null, 2)}\n`);
await writeFile('production-slo-proof.md', `${md}\n`);
console.log(JSON.stringify(report));
if (hardFailures.length) process.exit(2);
