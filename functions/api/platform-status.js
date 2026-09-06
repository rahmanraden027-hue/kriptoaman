import { primarySession, readSession } from '../_shared/d1-session.js';

const STATUS_TTL_MS = 30_000;
const DURABLE_STATUS_TTL_MS = 45_000;
const MIN_PUBLIC_MARKET_ASSETS = 4500;
const MARKET_SNAPSHOT_FRESH_MS = 15 * 60 * 1000;
const MARKET_SNAPSHOT_HEALTH_MAX_AGE_MS = MARKET_SNAPSHOT_FRESH_MS * 4;
const COMPONENT_STATUS_TIMEOUT_MS = 700;
const MARKET_STALE_REFRESH_TIMEOUT_MS = 20_000;

const DURABLE_STATUS_SCHEMA = `
CREATE TABLE IF NOT EXISTS platform_status_snapshots (
  id TEXT PRIMARY KEY,
  captured_at INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
  'X-Content-Type-Options': 'nosniff',
};

let cachedStatus = null;
let cachedStatusAt = 0;
let statusInFlight = null;
let durableSchemaReady = false;

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const withDelivery = (body, aggregateRead, snapshotAgeMs = 0, backgroundRefresh = false) => ({
  ...body,
  delivery: {
    aggregateRead,
    snapshotAgeMs,
    backgroundRefresh,
  },
});

async function readJson(url, timeoutMs = COMPONENT_STATUS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    return { ok: false, status: 0, payload: null, error: error?.name === 'AbortError' ? 'timeout' : 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

async function readMarketMetadata(env, origin) {
  if (env?.AUTH_DB) {
    try {
      const db = readSession(env.AUTH_DB);
      const row = await db.prepare(
        'SELECT source, asset_count, captured_at FROM market_snapshots WHERE id = ?',
      ).bind('global').first();
      if (row) {
        const assetCount = Number(row.asset_count);
        const capturedAt = Number(row.captured_at);
        const ageMs = Number.isFinite(capturedAt) ? Math.max(0, Date.now() - capturedAt) : null;
        const stale = !Number.isFinite(ageMs) || ageMs > MARKET_SNAPSHOT_FRESH_MS;
        const directResult = {
          ok: true,
          status: 200,
          readMode: 'd1-direct',
          payload: {
            healthy: Number.isFinite(assetCount)
              && assetCount >= MIN_PUBLIC_MARKET_ASSETS
              && Number.isFinite(ageMs)
              && ageMs <= MARKET_SNAPSHOT_HEALTH_MAX_AGE_MS,
            source: row.source ?? null,
            assetCount,
            capturedAt,
            ageMs,
            stale,
          },
        };

        if (!stale) return directResult;

        const refreshed = await readJson(
          `${origin}/api/market-snapshot?health=1&refresh=1`,
          MARKET_STALE_REFRESH_TIMEOUT_MS,
        );
        const refreshedAssetCount = Number(refreshed.payload?.assetCount);
        const refreshVerified = Boolean(
          refreshed.ok
            && refreshed.payload?.healthy === true
            && refreshed.payload?.stale === false
            && Number.isFinite(refreshedAssetCount)
            && refreshedAssetCount >= MIN_PUBLIC_MARKET_ASSETS,
        );

        if (refreshVerified) {
          return {
            ...refreshed,
            readMode: 'http-refresh',
            refreshAttempted: true,
            refreshRecovered: true,
          };
        }

        return {
          ...directResult,
          refreshAttempted: true,
          refreshRecovered: false,
          refreshError: refreshed.error
            ?? (refreshed.ok ? 'refresh_unhealthy_or_stale' : `http_${refreshed.status || 0}`),
        };
      }
    } catch (error) {
      console.error('Direct market metadata read failed; using HTTP fallback', {
        error: error?.message || String(error),
      });
    }
  }

  const fallback = await readJson(`${origin}/api/market-snapshot?health=1`);
  return { ...fallback, readMode: 'http-fallback' };
}

function isVerifiedOperationalBody(body, now = Date.now()) {
  const market = body?.components?.market;
  const networks = body?.components?.networks;
  const kam = body?.components?.kam;
  const marketCapturedAt = Number(market?.capturedAt);
  const marketAgeMs = Number.isFinite(marketCapturedAt) ? Math.max(0, now - marketCapturedAt) : Infinity;
  const networkOnline = Number(networks?.online);
  const networkMinimumTarget = Number(networks?.minimumActiveTarget);

  return Boolean(
    body?.overall === 'operational'
      && market?.healthy === true
      && Number(market?.assetCount) >= MIN_PUBLIC_MARKET_ASSETS
      && marketAgeMs <= MARKET_SNAPSHOT_FRESH_MS
      && networks?.healthy === true
      && Number.isFinite(networkOnline)
      && Number.isFinite(networkMinimumTarget)
      && networkOnline >= networkMinimumTarget
      && kam?.healthy === true
      && Number(kam?.chainId) === 22028,
  );
}

async function readDurableStatus(env) {
  if (!env?.AUTH_DB) return null;
  try {
    const db = readSession(env.AUTH_DB);
    const row = await db.prepare(
      'SELECT captured_at, payload FROM platform_status_snapshots WHERE id = ?',
    ).bind('global').first();
    if (!row) return null;

    const capturedAt = Number(row.captured_at);
    const snapshotAgeMs = Number.isFinite(capturedAt) ? Math.max(0, Date.now() - capturedAt) : Infinity;
    if (snapshotAgeMs > DURABLE_STATUS_TTL_MS) return null;

    const body = JSON.parse(row.payload);
    if (!isVerifiedOperationalBody(body)) return null;

    const marketCapturedAt = Number(body.components.market.capturedAt);
    const marketAgeMs = Math.max(0, Date.now() - marketCapturedAt);
    return {
      status: 200,
      body: withDelivery({
        ...body,
        components: {
          ...body.components,
          market: {
            ...body.components.market,
            ageMs: marketAgeMs,
            stale: false,
          },
        },
      }, 'd1-last-verified', snapshotAgeMs, true),
    };
  } catch {
    return null;
  }
}

async function ensureDurableSchema(db) {
  if (durableSchemaReady) return;
  await db.prepare(DURABLE_STATUS_SCHEMA).run();
  durableSchemaReady = true;
}

async function persistDurableStatus(env, result) {
  if (!env?.AUTH_DB || result?.status !== 200 || !isVerifiedOperationalBody(result.body)) return false;
  try {
    const db = primarySession(env.AUTH_DB);
    await ensureDurableSchema(db);
    const capturedAt = Date.now();
    const payload = JSON.stringify(withDelivery(result.body, 'live-verified', 0, false));
    await db.prepare(`
      INSERT INTO platform_status_snapshots (id, captured_at, payload, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        captured_at = excluded.captured_at,
        payload = excluded.payload,
        updated_at = CURRENT_TIMESTAMP
    `).bind('global', capturedAt, payload).run();
    return true;
  } catch (error) {
    console.error('Unable to persist durable platform status snapshot', {
      error: error?.message || String(error),
    });
    return false;
  }
}

async function buildStatus(request, env) {
  const origin = new URL(request.url).origin;
  const generatedAt = new Date().toISOString();
  const [market, networks, kam] = await Promise.all([
    readMarketMetadata(env, origin),
    readJson(`${origin}/api/network-health`),
    readJson(`${origin}/api/kam/network-status`),
  ]);

  const marketAssetCount = market.ok ? Number(market.payload?.assetCount) : NaN;
  const marketFresh = market.ok && market.payload?.stale === false;
  const marketHealthy = Boolean(
    market.ok
      && market.payload?.healthy === true
      && Number.isFinite(marketAssetCount)
      && marketAssetCount >= MIN_PUBLIC_MARKET_ASSETS
      && marketFresh,
  );
  const networkOnline = networks.ok ? Number(networks.payload?.summary?.online) : null;
  const networkTotal = networks.ok ? Number(networks.payload?.summary?.total) : null;
  const networkDegraded = networks.ok ? Number(networks.payload?.summary?.degraded || 0) : null;
  const networkMinimumTarget = networks.ok ? Number(networks.payload?.summary?.minimum_active_target || 12) : null;
  const networksHealthy = Boolean(
    Number.isFinite(networkOnline)
      && Number.isFinite(networkMinimumTarget)
      && networkOnline >= networkMinimumTarget,
  );
  const kamHealthy = Boolean(kam.ok && kam.payload?.verified === true && Number(kam.payload?.chainId) === 22028);

  const components = {
    market: {
      status: marketHealthy ? 'operational' : market.ok ? 'degraded' : 'unavailable',
      healthy: marketHealthy,
      assetCount: Number.isFinite(marketAssetCount) && marketAssetCount > 0 ? marketAssetCount : null,
      source: market.ok ? market.payload?.source ?? null : null,
      capturedAt: market.ok ? market.payload?.capturedAt ?? null : null,
      ageMs: market.ok && Number.isFinite(Number(market.payload?.ageMs)) ? Number(market.payload.ageMs) : null,
      stale: market.ok ? Boolean(market.payload?.stale) : null,
      readMode: market.readMode ?? null,
      refreshAttempted: Boolean(market.refreshAttempted),
      refreshRecovered: market.refreshAttempted ? Boolean(market.refreshRecovered) : null,
      refreshError: market.refreshAttempted && !market.refreshRecovered ? market.refreshError ?? 'refresh_failed' : null,
    },
    networks: {
      status: networksHealthy ? (Number(networks.payload?.summary?.offline) > 0 ? 'degraded' : 'operational') : networks.ok ? 'degraded' : 'unavailable',
      healthy: networksHealthy,
      online: Number.isFinite(networkOnline) ? networkOnline : null,
      total: Number.isFinite(networkTotal) ? networkTotal : null,
      degraded: Number.isFinite(networkDegraded) ? networkDegraded : null,
      offline: networks.ok && Number.isFinite(Number(networks.payload?.summary?.offline)) ? Number(networks.payload.summary.offline) : null,
      healthPct: networks.ok && Number.isFinite(Number(networks.payload?.summary?.health_pct)) ? Number(networks.payload.summary.health_pct) : null,
      minimumActiveTarget: Number.isFinite(networkMinimumTarget) ? networkMinimumTarget : null,
      meetsMinimumActiveTarget: networksHealthy,
      checkedAt: networks.ok ? networks.payload?.checked_at ?? null : null,
      readError: networks.ok ? null : networks.error ?? 'unavailable',
    },
    kam: {
      status: kamHealthy ? 'operational' : kam.ok ? 'degraded' : 'unavailable',
      healthy: kamHealthy,
      chainId: kamHealthy ? 22028 : null,
      blockNumber: kamHealthy && Number.isFinite(Number(kam.payload?.blockNumber)) ? Number(kam.payload.blockNumber) : null,
      checkedAt: kam.ok ? kam.payload?.checkedAt ?? null : null,
      readError: kam.ok ? null : kam.error ?? 'unavailable',
    },
  };

  const healthyCount = Object.values(components).filter((item) => item.healthy).length;
  const overall = healthyCount === 3 ? 'operational' : healthyCount > 0 ? 'degraded' : 'unavailable';

  return {
    status: overall === 'unavailable' ? 503 : 200,
    body: withDelivery({
      schemaVersion: '1.0',
      service: 'KriptoAman',
      overall,
      generatedAt,
      components,
      policy: {
        valuesAreLiveVerifiedOnly: true,
        unavailableMetricsUseNull: true,
        fabricatedMetrics: false,
        aggregateCacheTtlMs: STATUS_TTL_MS,
        durableVerifiedAggregateMaxAgeMs: DURABLE_STATUS_TTL_MS,
        edgeCache: true,
        durableAggregateCache: true,
        componentStatusTimeoutMs: COMPONENT_STATUS_TIMEOUT_MS,
        componentTimeoutDegradesRatherThanFabricates: true,
        marketOperationalMinAssets: MIN_PUBLIC_MARKET_ASSETS,
        marketOperationalRequiresFreshSnapshot: true,
        marketSnapshotFreshMs: MARKET_SNAPSHOT_FRESH_MS,
        marketStaleSelfHeal: true,
        marketStaleSelfHealTimeoutMs: MARKET_STALE_REFRESH_TIMEOUT_MS,
        directMarketMetadataRead: true,
        networkHealthyRequiresMinimumTarget: true,
      },
    }, 'live-verified', 0, false),
  };
}

async function startLiveRefresh(request, env) {
  if (!statusInFlight) {
    statusInFlight = buildStatus(request, env)
      .then((result) => {
        cachedStatus = result;
        cachedStatusAt = Date.now();
        return result;
      })
      .finally(() => {
        statusInFlight = null;
      });
  }
  return statusInFlight;
}

async function getFreshStatus(request, env) {
  const now = Date.now();
  if (cachedStatus && now - cachedStatusAt < STATUS_TTL_MS) {
    return {
      ...cachedStatus,
      body: withDelivery(cachedStatus.body, 'memory-last-verified', now - cachedStatusAt, false),
    };
  }
  return startLiveRefresh(request, env);
}

const scheduleBackground = (waitUntil, task) => {
  if (typeof waitUntil === 'function') waitUntil(task);
  else task.catch(() => undefined);
};

export async function onRequestGet({ request, waitUntil, env }) {
  const edgeCache = globalThis.caches?.default;
  const cacheKey = new Request(new URL(request.url).origin + '/api/platform-status', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (edgeCache) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) {
      const headers = new Headers(hit.headers);
      headers.set('X-KriptoAman-Status-Cache', 'HIT');
      return new Response(hit.body, { status: hit.status, headers });
    }
  }

  const memoryNow = Date.now();
  let result = cachedStatus && memoryNow - cachedStatusAt < STATUS_TTL_MS
    ? {
        ...cachedStatus,
        body: withDelivery(cachedStatus.body, 'memory-last-verified', memoryNow - cachedStatusAt, false),
      }
    : null;

  if (!result) {
    const durable = await readDurableStatus(env);
    if (durable) {
      result = durable;
      scheduleBackground(
        waitUntil,
        startLiveRefresh(request, env).then((fresh) => persistDurableStatus(env, fresh)),
      );
    } else {
      result = await getFreshStatus(request, env);
      scheduleBackground(waitUntil, persistDurableStatus(env, result));
    }
  }

  const response = json(result.body, result.status, { 'X-KriptoAman-Status-Cache': 'MISS' });

  if (
    edgeCache
      && result.status === 200
      && result.body?.delivery?.aggregateRead === 'live-verified'
  ) {
    scheduleBackground(waitUntil, edgeCache.put(cacheKey, response.clone()));
  }

  return response;
}
