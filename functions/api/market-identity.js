import { readSession } from '../_shared/d1-session.js';

const PAGE_SIZE = 100;
const MAX_PAGE = 50;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120, stale-if-error=900',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const clean = value => String(value ?? '').trim();

export function deriveProviderAssetIdentity({ source, id, symbol, name } = {}) {
  const provider = clean(source).toLowerCase();
  const legacyId = clean(id);
  const normalizedSymbol = clean(symbol).toUpperCase();
  const normalizedName = clean(name);

  let providerAssetId = legacyId;
  if (provider === 'coinlore' && legacyId.toLowerCase().startsWith('coinlore-')) {
    providerAssetId = legacyId.slice('coinlore-'.length);
  }

  const sourceAssetKey = provider && providerAssetId
    ? `provider:${provider}:${providerAssetId}`
    : null;

  return {
    legacyId: legacyId || null,
    symbol: normalizedSymbol || null,
    name: normalizedName || null,
    provider: provider || null,
    providerAssetId: providerAssetId || null,
    sourceAssetKey,
    identityScope: sourceAssetKey ? 'provider-scoped' : 'unresolved',
    canonicalAcrossProviders: false,
  };
}

export function assessProviderIdentity(rows = [], source = 'unknown') {
  const data = Array.isArray(rows) ? rows : [];
  const seenKeys = new Set();
  let resolved = 0;
  let duplicateSourceAssetKeys = 0;

  for (const item of data) {
    const identity = deriveProviderAssetIdentity({ source, ...item });
    if (!identity.sourceAssetKey) continue;
    resolved += 1;
    if (seenKeys.has(identity.sourceAssetKey)) duplicateSourceAssetKeys += 1;
    else seenKeys.add(identity.sourceAssetKey);
  }

  const coveragePct = data.length > 0
    ? Math.round((resolved / data.length) * 10000) / 100
    : 0;

  return {
    resolved,
    total: data.length,
    providerIdentityCoveragePct: coveragePct,
    duplicateSourceAssetKeys,
  };
}

export async function onRequestGet({ env, request }) {
  const requestId = crypto.randomUUID();
  if (!env.AUTH_DB) {
    return json({
      error: 'Market database is not configured',
      code: 'MARKET_DB_MISSING',
      requestId,
    }, 503, { 'Retry-After': '30' });
  }

  try {
    const url = new URL(request.url);
    const requestedPage = Number.parseInt(url.searchParams.get('page') || '1', 10);
    const page = Number.isFinite(requestedPage)
      ? Math.max(1, Math.min(MAX_PAGE, requestedPage))
      : 1;
    const chunkIndex = page - 1;

    const db = readSession(env.AUTH_DB);
    const row = await db.prepare(`
      SELECT source, captured_at, asset_count, payload
      FROM market_snapshot_chunks
      WHERE snapshot_id = ? AND chunk_index = ?
    `).bind('global', chunkIndex).first();

    if (!row?.payload) {
      return json({
        error: 'Market identity page unavailable',
        code: 'MARKET_IDENTITY_PAGE_EMPTY',
        page,
        requestId,
      }, 404);
    }

    let data;
    try {
      data = JSON.parse(row.payload);
    } catch {
      return json({
        error: 'Market identity source is invalid',
        code: 'MARKET_IDENTITY_SOURCE_INVALID',
        page,
        requestId,
      }, 503, { 'Retry-After': '30' });
    }

    if (!Array.isArray(data)) {
      return json({
        error: 'Market identity source is invalid',
        code: 'MARKET_IDENTITY_SOURCE_INVALID',
        page,
        requestId,
      }, 503, { 'Retry-After': '30' });
    }

    const identities = data.map(item => deriveProviderAssetIdentity({
      source: row.source,
      id: item?.id,
      symbol: item?.symbol,
      name: item?.name,
    }));
    const assessment = assessProviderIdentity(data, row.source);
    const totalAssets = Number(row.asset_count) || 0;

    return json({
      schemaVersion: '1.0',
      migrationStatus: 'phase-1-provider-scoped',
      source: row.source || 'unknown',
      capturedAt: Number(row.captured_at) || null,
      page,
      pageSize: PAGE_SIZE,
      totalAssets,
      totalPages: Math.max(1, Math.ceil(totalAssets / PAGE_SIZE)),
      assessment,
      identities,
      policy: {
        currentSnapshotDeduplication: 'legacy-symbol',
        sourceAssetKeyPrimaryBasis: 'provider+providerAssetId',
        canonicalAcrossProviders: false,
        symbolCollisionVisibility: 'not-assessable-after-legacy-symbol-deduplication',
        nextMigrationGate: 'canonical-registry-plus-consumer-regression',
      },
      interpretation: 'Provider-scoped identity sidecar for migration and data lineage. It does not yet assert that records from different providers represent the same canonical asset.',
      requestId,
    }, 200, {
      'X-KriptoAman-Market-Identity': 'provider-scoped-v1',
    });
  } catch (error) {
    console.error('Market identity unavailable', { requestId, error });
    return json({
      error: 'Market identity unavailable',
      code: 'MARKET_IDENTITY_FAILED',
      requestId,
    }, 503, { 'Retry-After': '30' });
  }
}
