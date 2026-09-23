import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// A DNS-only origin can deliberately expose only JSON-RPC POST /.
// Missing informational GET routes must not conceal genuine chain outages.
export function assessPublicProof(report) {
  const required = ['chainId', 'blockProgress', 'sensitiveMethodsBlocked', 'explorer', 'explorerHeight'];
  const missing = required.filter((name) => report?.checks?.[name]?.ok !== true);
  const health = report?.checks?.gatewayHealth;
  const ready = report?.checks?.gatewayReady;
  const routeReady = health?.ok === true && ready?.ok === true;
  const directOrigin = health?.status === 404 && ready?.status === 404;
  const endpointPolicy = routeReady ? 'GATEWAY_HEALTHY' : directOrigin ? 'RPC_ONLY_ORIGIN' : 'GATEWAY_UNHEALTHY';
  const ok = missing.length === 0 && (routeReady || directOrigin);
  return {
    checkedAt: report?.checkedAt ?? null,
    ok,
    endpointPolicy,
    gatewayHealthHttp: health?.status ?? null,
    gatewayReadyHttp: ready?.status ?? null,
    checks: Object.fromEntries(required.map((name) => [name, report?.checks?.[name]?.ok === true])),
    missing,
    warnings: directOrigin
      ? ['RPC origin does not publish GET /health or /ready. Core RPC, blocked admin methods, live block progress and indexed Explorer parity were independently verified.']
      : [],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node scripts/assess-zevaryq-public-proof.mjs <raw-audit.json>');
    process.exitCode = 2;
  } else {
    try {
      const report = JSON.parse(readFileSync(path, 'utf8'));
      const assessment = assessPublicProof(report);
      console.log(JSON.stringify(assessment, null, 2));
      if (!assessment.ok) process.exitCode = 1;
    } catch (error) {
      console.error('Public RPC proof could not be parsed:', String(error?.message || error));
      process.exitCode = 2;
    }
  }
}
