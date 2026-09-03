import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [, , inputPath, jsonOutputPath, markdownOutputPath] = process.argv;

if (!inputPath || !jsonOutputPath || !markdownOutputPath) {
  console.error('Usage: node scripts/summarize-network-health.mjs <input.json> <summary.json> <summary.md>');
  process.exit(64);
}

function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1));
  return sorted[index];
}

function providerFingerprint(networks) {
  const material = networks
    .map((network) => `${network.name}:${network.provider || 'none'}:${network.status || 'unknown'}`)
    .sort()
    .join('|');
  return createHash('sha256').update(material).digest('hex').slice(0, 16);
}

const raw = await readFile(inputPath, 'utf8');
const payload = JSON.parse(raw);
const networks = Array.isArray(payload?.networks) ? payload.networks : [];
const total = Number(payload?.summary?.total ?? networks.length ?? 0);
const online = Number(payload?.summary?.online ?? networks.filter((network) => network.status === 'online').length);
const degraded = Number(payload?.summary?.degraded ?? networks.filter((network) => network.status === 'degraded').length);
const offline = Number(payload?.summary?.offline ?? networks.filter((network) => network.status === 'offline').length);
const target = Number(payload?.summary?.minimum_active_target ?? 12);

if (target !== 12) {
  console.error(`Unexpected minimum active target: ${target}. Expected 12.`);
  process.exit(65);
}

const onlineNetworks = networks.filter((network) => network.status === 'online');
const latencies = onlineNetworks
  .map((network) => Number(network.latency))
  .filter((latency) => Number.isFinite(latency) && latency >= 0);
const slowest = onlineNetworks
  .filter((network) => Number.isFinite(Number(network.latency)))
  .sort((a, b) => Number(b.latency) - Number(a.latency))
  .slice(0, 5)
  .map((network) => ({
    name: network.name,
    latencyMs: Number(network.latency),
    provider: network.provider || null,
  }));
const unavailable = networks
  .filter((network) => network.status !== 'online')
  .map((network) => ({
    name: network.name,
    status: network.status || 'unknown',
    providersTried: Array.isArray(network.providers_tried) ? network.providers_tried : [],
    lastKnownGood: network.last_known_good || null,
  }));
const selectedProviders = Object.fromEntries(
  networks
    .filter((network) => network.name)
    .map((network) => [network.name, network.provider || null]),
);
const fullCoverage = total > 0 && online === total && degraded === 0 && offline === 0;
const meetsMinimum = online >= target;
const status = fullCoverage ? 'full_coverage' : meetsMinimum ? 'operational_with_degradation' : 'below_minimum';
const summary = {
  status,
  fullCoverage,
  meetsMinimum,
  checkedAt: payload?.checked_at || new Date().toISOString(),
  total,
  online,
  degraded,
  offline,
  minimumActiveTarget: target,
  healthPct: total ? Math.round((online / total) * 10000) / 100 : 0,
  latencyMs: {
    samples: latencies.length,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    max: latencies.length ? Math.max(...latencies) : null,
  },
  slowest,
  selectedProviders,
  providerFingerprint: providerFingerprint(networks),
  unavailable,
  evidencePolicy: {
    freshProbeRequired: true,
    lastKnownGoodCountsAsOnline: false,
    fullCoverageRequiresAllNetworksOnline: true,
    hardFailureBelowMinimum: true,
  },
};

const providerRows = networks
  .map((network) => `| ${network.name} | ${network.status || 'unknown'} | ${network.latency ?? '—'} | ${network.provider || '—'} |`)
  .join('\n');
const markdown = `# KriptoAman Multi-chain Stability Proof\n\n- Status: **${status}**\n- Coverage: **${online}/${total} online** (${summary.healthPct}%)\n- Degraded: **${degraded}**\n- Offline: **${offline}**\n- Hard minimum: **${target}**\n- Latency p50 / p95 / max: **${summary.latencyMs.p50 ?? '—'} / ${summary.latencyMs.p95 ?? '—'} / ${summary.latencyMs.max ?? '—'} ms**\n- Provider fingerprint: \`${summary.providerFingerprint}\`\n- Checked at: ${summary.checkedAt}\n\n| Network | Status | Latency ms | Selected provider |\n| --- | --- | ---: | --- |\n${providerRows}\n`;

await writeFile(jsonOutputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
await writeFile(markdownOutputPath, markdown, 'utf8');

console.log(JSON.stringify(summary));
if (!fullCoverage && meetsMinimum) {
  console.log(`::warning::Multi-chain coverage is ${online}/${total}; hard minimum ${target} is still satisfied.`);
}
if (!meetsMinimum) {
  console.error(`Multi-chain coverage ${online}/${total} is below hard minimum ${target}.`);
  process.exit(2);
}
