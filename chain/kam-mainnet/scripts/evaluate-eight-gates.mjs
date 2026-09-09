import { readFile } from 'node:fs/promises';

const path = new URL('../eight-gate-readiness.json', import.meta.url);
const manifest = JSON.parse(await readFile(path, 'utf8'));
const entries = Object.entries(manifest.gates || {});
const passed = entries.filter(([, gate]) => gate.passed === true).map(([name]) => name);
const blocked = entries.filter(([, gate]) => gate.passed !== true).map(([name, gate]) => ({ name, required: gate.required || 'Reviewed evidence required' }));
const ready = manifest.status === 'mainnet-candidate-not-public'
  && manifest.policy?.allGatesRequired === true
  && entries.length === 8
  && blocked.length === 0;

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  network: manifest.network,
  chainId: manifest.chainId,
  status: manifest.status,
  passed,
  blocked,
  ready,
  decision: ready ? 'ELIGIBLE_FOR_REVIEWED_PROMOTION_COMMIT' : 'REMAIN_MAINNET_CANDIDATE'
}, null, 2));

if (!ready) process.exitCode = 1;
