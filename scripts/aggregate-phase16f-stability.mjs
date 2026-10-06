import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import manifest from '../release/phase16f-long-run-stability.json' with { type: 'json' };

const sourceDir = resolve(process.env.PHASE16F_SOURCE_DIR || 'phase16f-source');
const evidenceDir = resolve(process.env.PHASE16F_EVIDENCE_DIR || 'phase16f-evidence');
const runsPath = join(sourceDir, 'runs.json');
const baselineStartRaw = process.env.PHASE16F_START_AT || '';
const nowMs = process.env.PHASE16F_NOW ? Date.parse(process.env.PHASE16F_NOW) : Date.now();

await mkdir(evidenceDir, { recursive: true });

const baselineStartMs = Date.parse(baselineStartRaw);
if (!Number.isFinite(baselineStartMs)) {
  throw new Error('PHASE16F_START_AT must be an ISO timestamp');
}
if (!Number.isFinite(nowMs) || nowMs <= baselineStartMs) {
  throw new Error('Phase 16F observation clock is invalid');
}

const runs = JSON.parse(await readFile(runsPath, 'utf8'));
if (!Array.isArray(runs)) throw new Error('Phase 16F run ledger must be an array');

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function runIdFromPath(path) {
  const parts = relative(sourceDir, path).split(/[\\/]+/);
  const numeric = parts.find(part => /^\d+$/.test(part));
  return numeric ? Number(numeric) : null;
}

const evidenceFiles = (await walk(sourceDir))
  .filter(path => path.endsWith('/' + manifest.sourceEvidenceFile) || path.endsWith('\\' + manifest.sourceEvidenceFile));

const observations = [];
for (const path of evidenceFiles) {
  try {
    const payload = JSON.parse(await readFile(path, 'utf8'));
    const checkedAtMs = Date.parse(payload?.checkedAt);
    const runId = runIdFromPath(path);
    if (!runId || !Number.isFinite(checkedAtMs)) continue;
    observations.push({ runId, checkedAtMs, payload, path: relative(sourceDir, path) });
  } catch {
    // Invalid evidence is excluded and becomes visible as a coverage gap.
  }
}

const dedupedObservations = [...new Map(
  observations
    .sort((a, b) => a.checkedAtMs - b.checkedAtMs)
    .map(item => [item.runId + ':' + item.checkedAtMs, item]),
).values()];

const failedConclusions = new Set(manifest.acceptance.failedRunConclusions);
const allowedResults = new Set(manifest.acceptance.allowedObservationResults);

function asMs(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hourBucket(ms) {
  return new Date(Math.floor(ms / 3_600_000) * 3_600_000).toISOString();
}

function metric(values, mode) {
  const finite = values.map(Number).filter(Number.isFinite);
  if (!finite.length) return null;
  return mode === 'min' ? Math.min(...finite) : Math.max(...finite);
}

function assessWindow(name, config) {
  const naturalStart = nowMs - Number(config.durationMs);
  const windowStartMs = Math.max(baselineStartMs, naturalStart);

  const windowRuns = runs.filter(run => {
    const created = asMs(run?.createdAt);
    return created != null && created >= windowStartMs && created <= nowMs && run?.status === 'completed';
  });

  const failedRuns = windowRuns.filter(run => failedConclusions.has(String(run?.conclusion || '').toLowerCase()));
  const successfulRunIds = new Set(
    windowRuns
      .filter(run => run?.conclusion === 'success')
      .map(run => Number(run.databaseId))
      .filter(Number.isFinite),
  );

  const windowEvidence = dedupedObservations.filter(item =>
    item.checkedAtMs >= windowStartMs
    && item.checkedAtMs <= nowMs
    && successfulRunIds.has(item.runId)
  );

  const invalidEvidence = windowEvidence.filter(item => !allowedResults.has(item.payload?.result));
  const warningEvidence = windowEvidence.filter(item => item.payload?.result === 'STABLE_WITH_WARNINGS');
  const buckets = new Set(windowEvidence.map(item => hourBucket(item.checkedAtMs)));
  const firstMs = windowEvidence[0]?.checkedAtMs ?? null;
  const lastMs = windowEvidence.at(-1)?.checkedAtMs ?? null;
  const spanMs = firstMs != null && lastMs != null ? Math.max(0, lastMs - firstMs) : 0;

  const successfulRuns = windowRuns.filter(run => run?.conclusion === 'success');
  const evidenceRunIds = new Set(windowEvidence.map(item => item.runId));
  const missingArtifacts = successfulRuns
    .map(run => Number(run.databaseId))
    .filter(Number.isFinite)
    .filter(id => !evidenceRunIds.has(id));

  const metrics = {
    minimumAssets: metric(windowEvidence.map(item => item.payload?.market?.totalAssets), 'min'),
    maximumMarketAgeMs: metric(windowEvidence.map(item => item.payload?.market?.ageMs), 'max'),
    maximumExplorerLagBlocks: metric(windowEvidence.flatMap(item => [
      item.payload?.chain?.explorerLag1,
      item.payload?.chain?.explorerLag2
    ]), 'max'),
    maximumNetworkProbeMs: metric(windowEvidence.flatMap(item => [
      item.payload?.latency?.networkProbe1,
      item.payload?.latency?.networkProbe2
    ]), 'max'),
    maximumOnChainLatencyMs: metric(windowEvidence.flatMap(item => [
      item.payload?.latency?.onChainLatency1,
      item.payload?.latency?.onChainLatency2
    ]), 'max'),
    firstRpcBlock: windowEvidence[0]?.payload?.chain?.rpcBlock1 ?? null,
    lastRpcBlock: windowEvidence.at(-1)?.payload?.chain?.rpcBlock2 ?? null,
  };

  if (failedRuns.length || invalidEvidence.length) {
    return {
      name,
      status: 'FAILED',
      windowStart: new Date(windowStartMs).toISOString(),
      windowEnd: new Date(nowMs).toISOString(),
      spanMs,
      hourlyBuckets: buckets.size,
      observations: windowEvidence.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.map(run => ({
        id: run.databaseId,
        createdAt: run.createdAt,
        conclusion: run.conclusion
      })),
      invalidEvidence: invalidEvidence.map(item => ({ runId: item.runId, result: item.payload?.result || null })),
      missingArtifacts,
      warningObservations: warningEvidence.length,
      metrics
    };
  }

  const coverageReady = spanMs >= Number(config.minimumSpanMs)
    && buckets.size >= Number(config.minimumHourlyBuckets);

  if (!coverageReady) {
    return {
      name,
      status: 'PENDING',
      windowStart: new Date(windowStartMs).toISOString(),
      windowEnd: new Date(nowMs).toISOString(),
      spanMs,
      requiredSpanMs: Number(config.minimumSpanMs),
      hourlyBuckets: buckets.size,
      requiredHourlyBuckets: Number(config.minimumHourlyBuckets),
      observations: windowEvidence.length,
      successfulRuns: successfulRuns.length,
      failedRuns: [],
      missingArtifacts,
      warningObservations: warningEvidence.length,
      metrics
    };
  }

  return {
    name,
    status: warningEvidence.length ? 'STABLE_WITH_WARNINGS' : 'STABLE',
    windowStart: new Date(windowStartMs).toISOString(),
    windowEnd: new Date(nowMs).toISOString(),
    spanMs,
    requiredSpanMs: Number(config.minimumSpanMs),
    hourlyBuckets: buckets.size,
    requiredHourlyBuckets: Number(config.minimumHourlyBuckets),
    observations: windowEvidence.length,
    successfulRuns: successfulRuns.length,
    failedRuns: [],
    missingArtifacts,
    warningObservations: warningEvidence.length,
    metrics
  };
}

const window24h = assessWindow('24h', manifest.windows['24h']);
const window72h = assessWindow('72h', manifest.windows['72h']);

let overallStatus = 'COLLECTING';
if (window24h.status === 'FAILED' || window72h.status === 'FAILED') {
  overallStatus = 'FAILED';
} else if (['STABLE', 'STABLE_WITH_WARNINGS'].includes(window72h.status)) {
  overallStatus = window72h.status === 'STABLE'
    ? 'LONG_RUN_STABLE'
    : 'LONG_RUN_STABLE_WITH_WARNINGS';
} else if (['STABLE', 'STABLE_WITH_WARNINGS'].includes(window24h.status)) {
  overallStatus = window24h.status === 'STABLE'
    ? '24H_STABLE'
    : '24H_STABLE_WITH_WARNINGS';
}

const summary = {
  phase: '16F',
  overallStatus,
  generatedAt: new Date(nowMs).toISOString(),
  baselineStartAt: new Date(baselineStartMs).toISOString(),
  sourcePhase: manifest.sourcePhase,
  architectureFrozen: manifest.architectureFrozen,
  visualBaseline: manifest.visualBaseline,
  windows: {
    '24h': window24h,
    '72h': window72h
  },
  mutationPolicy: manifest.mutationPolicy
};

await writeFile(
  join(evidenceDir, 'phase16f-long-run-stability.json'),
  JSON.stringify(summary, null, 2) + '\n'
);

console.log('PHASE16F_LONG_RUN_STATUS=' + overallStatus);
console.log(JSON.stringify(summary, null, 2));

if (overallStatus === 'FAILED') process.exitCode = 2;
