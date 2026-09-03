import { d1SessionCapabilities } from '../_shared/d1-session.js';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=180',
  'X-Content-Type-Options': 'nosniff',
};

export async function onRequestGet({ env } = {}) {
  const d1 = d1SessionCapabilities(env?.AUTH_DB);
  const edgeCacheAvailable = Boolean(globalThis.caches?.default);
  const queueBindingConfigured = Boolean(env?.MARKET_REFRESH_QUEUE && typeof env.MARKET_REFRESH_QUEUE.send === 'function');
  const coordinatorBindingConfigured = Boolean(env?.MARKET_REFRESH_COORDINATOR);

  let databaseReachable = false;
  let databaseLatencyMs = null;
  if (env?.AUTH_DB) {
    const started = Date.now();
    try {
      const db = typeof env.AUTH_DB.withSession === 'function'
        ? env.AUTH_DB.withSession('first-unconstrained')
        : env.AUTH_DB;
      const row = await db.prepare('SELECT 1 AS ok').first();
      databaseReachable = Number(row?.ok) === 1;
      databaseLatencyMs = Date.now() - started;
    } catch {
      databaseReachable = false;
    }
  }

  const response = {
    schemaVersion: '1.0',
    readyForReadScaling: databaseReachable && edgeCacheAvailable && d1.sessionsApiAvailable,
    components: {
      edgeCache: { available: edgeCacheAvailable },
      d1: { ...d1, reachable: databaseReachable, latencyMs: databaseLatencyMs },
      asyncRefreshQueue: {
        configured: queueBindingConfigured,
        status: queueBindingConfigured ? 'available' : 'account-binding-required',
      },
      refreshCoordinator: {
        configured: coordinatorBindingConfigured,
        status: coordinatorBindingConfigured ? 'available' : 'optional-until-benchmark-requires',
      },
    },
    policy: {
      accountFeaturesNeverInferredFromSourceCode: true,
      queueRequiredOnlyAfterMeasuredContention: true,
      readReplicationRequiresCloudflareAccountEnablement: true,
      sessionsApiPrepared: d1.sessionsApiAvailable,
    },
    checkedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), { status: 200, headers: HEADERS });
}
