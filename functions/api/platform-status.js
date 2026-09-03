import { readSession } from '../_shared/d1-session.js';

const STATUS_TTL_MS = 30_000;
const MIN_PUBLIC_MARKET_ASSETS = 4500;
const MARKET_SNAPSHOT_FRESH_MS = 15 * 60 * 1000;
const MARKET_SNAPSHOT_HEALTH_MAX_AGE_MS = MARKET_SNAPSHOT_FRESH_MS * 4;
const NETWORK_HEALTH_TIMEOUT_MS = 5000;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
  'X-Content-Type-Options': 'nosniff',
};

let cachedStatus = null;
let cachedStatusAt = 0;
let statusInFlight = null;

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

async function readJson(url, timeoutMs = 2500) {
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
        return {
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
      }
    } catch (error) {
      console.error('Direct market metadata read failed; using HTTP fallback', {
        error: error?.message || String(error),
      });
    }
  }

  const fallback = await readJson(`${origin}/api/market-snapshot?health=1`, 1800);
  return { ...fallback, readMode: 'http-fallback' };
}

async function buildStatus(request, env) {
  const origin = new URL(request.url).origin;
  const generatedAt = new Date().toISOString();
  const [market, networks, kam] = await Promise.all([
    readMarketMetadata(env, origin),
    readJson(`${origin}/api/network-health`, NETWORK_HEALTH_TIMEOUT_MS),
    readJson(`${origin}/api/kam/network-status`, 5000),
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
    },
    kam: {
      status: kamHealthy ? 'operational' : kam.ok ? 'degraded' : 'unavailable',
      healthy: kamHealthy,
      chainId: kamHealthy ? 22028 : null,
      blockNumber: kamHealthy && Number.isFinite(Number(kam.payload?.blockNumber)) ? Number(kam.payload.blockNumber) : null,
      checkedAt: kam.ok ? kam.payload?.checkedAt ?? null : null,
    },
  };

  const healthyCount = Object.values(components).filter((item) => item.healthy).length;
  const overall = healthyCount === 3 ? 'operational' : healthyCount > 0 ? 'degraded' : 'unavailable';

  return {
    status: overall === 'unavailable' ? 503 : 200,
    body: {
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
        edgeCache: true,
        marketOperationalMinAssets: MIN_PUBLIC_MARKET_ASSETS,
        marketOperationalRequiresFreshSnapshot: true,
        marketSnapshotFreshMs: MARKET_SNAPSHOT_FRESH_MS,
        directMarketMetadataRead: true,
        networkHealthTimeoutMs: NETWORK_HEALTH_TIMEOUT_MS,
        networkHealthyRequiresMinimumTarget: true,
      },
    },
  };
}

async function getFreshStatus(request, env) {
  const now = Date.now();
  if (cachedStatus && now - cachedStatusAt < STATUS_TTL_MS) return cachedStatus;

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

  const result = await getFreshStatus(request, env);
  const response = json(result.body, result.status, { 'X-KriptoAman-Status-Cache': 'MISS' });

  if (edgeCache && result.status === 200) {
    const cachedResponse = response.clone();
    const task = edgeCache.put(cacheKey, cachedResponse);
    if (typeof waitUntil === 'function') waitUntil(task);
    else await task;
  }

  return response;
}
