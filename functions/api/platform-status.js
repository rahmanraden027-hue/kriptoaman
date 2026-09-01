const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

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

export async function onRequestGet({ request }) {
  const origin = new URL(request.url).origin;
  const generatedAt = new Date().toISOString();
  const [market, networks, kam] = await Promise.all([
    readJson(`${origin}/api/market-snapshot?health=1`, 2500),
    readJson(`${origin}/api/network-health`, 2500),
    readJson(`${origin}/api/kam/network-status`, 5000),
  ]);

  const marketHealthy = Boolean(market.ok && market.payload?.healthy && Number(market.payload?.assetCount) > 0);
  const networkOnline = networks.ok ? Number(networks.payload?.summary?.online) : null;
  const networkTotal = networks.ok ? Number(networks.payload?.summary?.total) : null;
  const networksHealthy = Number.isFinite(networkOnline) && networkOnline > 0;
  const kamHealthy = Boolean(kam.ok && kam.payload?.verified === true && Number(kam.payload?.chainId) === 22028);

  const components = {
    market: {
      status: marketHealthy ? 'operational' : market.ok ? 'degraded' : 'unavailable',
      healthy: marketHealthy,
      assetCount: market.ok && Number(market.payload?.assetCount) > 0 ? Number(market.payload.assetCount) : null,
      source: market.ok ? market.payload?.source ?? null : null,
      capturedAt: market.ok ? market.payload?.capturedAt ?? null : null,
      stale: market.ok ? Boolean(market.payload?.stale) : null,
    },
    networks: {
      status: networksHealthy ? (Number(networks.payload?.summary?.offline) > 0 ? 'degraded' : 'operational') : networks.ok ? 'degraded' : 'unavailable',
      healthy: networksHealthy,
      online: Number.isFinite(networkOnline) ? networkOnline : null,
      total: Number.isFinite(networkTotal) ? networkTotal : null,
      offline: networks.ok && Number.isFinite(Number(networks.payload?.summary?.offline)) ? Number(networks.payload.summary.offline) : null,
      healthPct: networks.ok && Number.isFinite(Number(networks.payload?.summary?.health_pct)) ? Number(networks.payload.summary.health_pct) : null,
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

  return json({
    schemaVersion: '1.0',
    service: 'KriptoAman',
    overall,
    generatedAt,
    components,
    policy: {
      valuesAreLiveVerifiedOnly: true,
      unavailableMetricsUseNull: true,
      fabricatedMetrics: false,
    },
  }, overall === 'unavailable' ? 503 : 200);
}
