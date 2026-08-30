#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DATA = process.env.KAM_RESEARCH_OUT || 'research/kam-mainnet/data';
const ndjson = path.join(DATA, 'samples.ndjson');
if (!fs.existsSync(ndjson)) {
  console.error(`Missing ${ndjson}`);
  process.exit(1);
}
const samples = fs.readFileSync(ndjson, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
if (!samples.length) process.exit(1);

function percentile(values, p) {
  const a = values.filter(Number.isFinite).sort((x,y)=>x-y);
  if (!a.length) return null;
  const idx = (a.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return Number(a[lo].toFixed(2));
  return Number((a[lo] + (a[hi]-a[lo])*(idx-lo)).toFixed(2));
}
const rpcChecks = samples.flatMap(s => s.rpcChecks || []);
const rpcLatencies = rpcChecks.filter(x=>x.ok).map(x=>x.latencyMs);
const explorerLatencies = samples.map(s=>s.explorerCheck?.latencyMs).filter(Number.isFinite);
const healthy = samples.filter(s=>s.sampleHealthy).length;
const consistent = samples.filter(s=>s.explorerConsistent === true).length;
const consistencyEligible = samples.filter(s=>s.explorerConsistent !== null).length;
const blocks = samples.map(s=>s.rpcBlockNumber).filter(Number.isFinite);
const summary = {
  generatedAt: new Date().toISOString(),
  firstSampleAt: samples[0].timestamp,
  lastSampleAt: samples.at(-1).timestamp,
  sampleCount: samples.length,
  healthySamples: healthy,
  availabilityPct: Number((healthy / samples.length * 100).toFixed(3)),
  chainIdMatchPct: Number((samples.filter(s=>s.chainIdMatches).length / samples.length * 100).toFixed(3)),
  rpcLatencyMs: { median: percentile(rpcLatencies,.5), p95: percentile(rpcLatencies,.95), max: rpcLatencies.length ? Number(Math.max(...rpcLatencies).toFixed(2)) : null },
  explorerLatencyMs: { median: percentile(explorerLatencies,.5), p95: percentile(explorerLatencies,.95), max: explorerLatencies.length ? Number(Math.max(...explorerLatencies).toFixed(2)) : null },
  explorerConsistencyPct: consistencyEligible ? Number((consistent / consistencyEligible * 100).toFixed(3)) : null,
  firstBlock: blocks[0] ?? null,
  lastBlock: blocks.at(-1) ?? null,
  blockDelta: blocks.length > 1 ? blocks.at(-1)-blocks[0] : null,
  failedSamples: samples.filter(s=>!s.sampleHealthy).map(s=>({timestamp:s.timestamp, rpcBlockNumber:s.rpcBlockNumber, explorerBlockNumber:s.explorerBlockNumber}))
};
fs.writeFileSync(path.join(DATA,'summary.json'), JSON.stringify(summary,null,2)+'\n');
const csv = [
  ['timestamp','healthy','chain_id','rpc_block','explorer_block','explorer_delta','explorer_consistent'],
  ...samples.map(s=>[s.timestamp,s.sampleHealthy,s.chainId,s.rpcBlockNumber,s.explorerBlockNumber,s.explorerBlockDelta,s.explorerConsistent])
].map(r=>r.join(',')).join('\n')+'\n';
fs.writeFileSync(path.join(DATA,'samples.csv'), csv);
console.log(JSON.stringify(summary,null,2));
