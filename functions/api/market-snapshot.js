import { primarySession, readSession } from '../_shared/d1-session.js';
import {
  PROVIDER_COOLDOWN_MS,
  PROVIDER_FAILURE_THRESHOLD,
  ensureMarketProviderCircuitSchema,
  readMarketProviderCircuit,
  recordMarketProviderFailure,
  recordMarketProviderSuccess,
} from '../_shared/market-provider-circuit.js';

const MARKET_ASSET_LIMIT = 5000;
const MIN_ACCEPTED_ASSETS = 4500;
const SNAPSHOT_FRESH_MS = 15 * 60 * 1000;
const SNAPSHOT_REFRESH_AHEAD_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12 * 1000;
const RETRY_DELAYS_MS = [250, 750];
const COINGECKO_RETRY_DELAYS_MS = [750, 2000, 5000];
const COINGECKO_PAGE_SIZE = 250;
const COINGECKO_PUBLIC_PAGE_DELAY_MS = 350;
const MARKET_CHUNK_SIZE = 100;
const CHUNK_WRITE_BATCH_SIZE = 10;
const PRIMARY_SNAPSHOT_ID = 'global';
const BACKUP_SNAPSHOT_ID = 'global-backup';

const SNAPSHOT_SCHEMA = `
CREATE TABLE IF NOT EXISTS market_snapshots (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  asset_count INTEGER NOT NULL CHECK (asset_count >= 2001),
  captured_at INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const CHUNK_SCHEMA = `
CREATE TABLE IF NOT EXISTS market_snapshot_chunks (
  snapshot_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  source TEXT NOT NULL,
  captured_at INTEGER NOT NULL,
  asset_count INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (snapshot_id, chunk_index)
)`;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

let refreshInFlight = null;
let chunkBackfillInFlight = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, ...extraHeaders },
});

async function fetchJson(url, {
  provider = 'Market provider',
  requestHeaders = {},
  retryDelays = RETRY_DELAYS_MS,
} = {}) {
  let lastError;
  const maxAttempts = retryDelays.length + 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'KriptoAman-Market-Snapshot/4.1',
          ...requestHeaders,
        },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${provider} request failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1) break;
      const retryDelay = retryDelays[attempt];
      if (Number.isFinite(retryDelay)) await sleep(retryDelay);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error(`${provider} request failed`);
}

function normalizeUniqueCoins(rows, mapRow) {
  const seen = new Set();
  return rows
    .map(mapRow)
    .filter((coin) => {
      const symbol = String(coin?.symbol || '').toUpperCase();
      if (!symbol || seen.has(symbol)) return false;
      seen.add(symbol);
      coin.symbol = symbol;
      return true;
    })
    .slice(0, MARKET_ASSET_LIMIT);
}

async function fetchCoinLore() {
  const starts = Array.from({ length: Math.ceil(MARKET_ASSET_LIMIT / 100) }, (_, index) => index * 100);
  const rows = [];
  for (let index = 0; index < starts.length; index += 5) {
    const results = await Promise.allSettled(
      starts.slice(index, index + 5).map((start) =>
        fetchJson(`https://api.coinlore.net/api/tickers/?start=${start}&limit=100`, {
          provider: 'CoinLore',
        })),
    );
    rows.push(...results
      .filter((result) => result.status === 'fulfilled' && Array.isArray(result.value?.data))
      .flatMap((result) => result.value.data));
  }

  const data = normalizeUniqueCoins(rows, (item, index) => ({
    id: `coinlore-${item.id || item.symbol || index}`,
    symbol: item.symbol || '',
    name: item.name || item.nameid || item.symbol || '',
    image: '',
    current_price: Number(item.price_usd),
    price_change_percentage_24h: Number(item.percent_change_24h),
    market_cap: Number(item.market_cap_usd),
    total_volume: Number(item.volume24),
    high_24h: null,
    low_24h: null,
    market_cap_rank: Number(item.rank) || index + 1,
    sparkline_in_7d: { price: [] },
  }));

  if (data.length < MIN_ACCEPTED_ASSETS) {
    throw new Error(`CoinLore returned only ${data.length} unique assets`);
  }
  return data;
}

function coinGeckoConfig(env = {}) {
  if (env.COINGECKO_PRO_API_KEY) {
    return {
      baseUrl: 'https://pro-api.coingecko.com/api/v3',
      requestHeaders: { 'x-cg-pro-api-key': env.COINGECKO_PRO_API_KEY },
      authenticated: true,
      tier: 'pro',
    };
  }

  const demoKey = env.COINGECKO_DEMO_API_KEY || env.COINGECKO_API_KEY;
  if (demoKey) {
    return {
      baseUrl: 'https://api.coingecko.com/api/v3',
      requestHeaders: { 'x-cg-demo-api-key': demoKey },
      authenticated: true,
      tier: 'demo',
    };
  }

  return {
    baseUrl: 'https://api.coingecko.com/api/v3',
    requestHeaders: {},
    authenticated: false,
    tier: 'public-keyless',
  };
}

async function fetchCoinGecko(env = {}) {
  const config = coinGeckoConfig(env);
  const rows = [];
  const pageCount = Math.ceil(MARKET_ASSET_LIMIT / COINGECKO_PAGE_SIZE);

  for (let page = 1; page <= pageCount; page += 1) {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: String(COINGECKO_PAGE_SIZE),
      page: String(page),
      sparkline: 'false',
      price_change_percentage: '24h',
      precision: 'full',
    });

    const payload = await fetchJson(`${config.baseUrl}/coins/markets?${params.toString()}`, {
      provider: `CoinGecko ${config.tier}`,
      requestHeaders: config.requestHeaders,
      retryDelays: COINGECKO_RETRY_DELAYS_MS,
    });

    if (!Array.isArray(payload)) {
      throw new Error(`CoinGecko ${config.tier} returned invalid market data`);
    }
    rows.push(...payload);
    if (payload.length < COINGECKO_PAGE_SIZE || rows.length >= MARKET_ASSET_LIMIT) break;

    if (!config.authenticated) await sleep(COINGECKO_PUBLIC_PAGE_DELAY_MS);
  }

  const data = normalizeUniqueCoins(rows, (item, index) => ({
    id: item.id || `coingecko-${item.symbol || index}`,
    symbol: item.symbol || '',
    name: item.name || item.symbol || '',
    image: item.image || '',
    current_price: Number(item.current_price),
    price_change_percentage_24h: Number(
      item.price_change_percentage_24h_in_currency ?? item.price_change_percentage_24h,
    ),
    market_cap: Number(item.market_cap),
    total_volume: Number(item.total_volume),
    high_24h: Number.isFinite(Number(item.high_24h)) ? Number(item.high_24h) : null,
    low_24h: Number.isFinite(Number(item.low_24h)) ? Number(item.low_24h) : null,
    market_cap_rank: Number(item.market_cap_rank) || index + 1,
    sparkline_in_7d: { price: [] },
  }));

  if (data.length < MIN_ACCEPTED_ASSETS) {
    throw new Error(`CoinGecko ${config.tier} returned only ${data.length} unique assets`);
  }
  return data;
}

async function fetchMarketData(db, env = {}) {
  const failures = [];
  const providers = [
    ['coinlore', () => fetchCoinLore()],
    ['coingecko', () => fetchCoinGecko(env)],
  ];

  for (const [source, fetchProvider] of providers) {
    const circuit = await readMarketProviderCircuit(db, source);
    const now = Date.now();
    if (circuit.openUntil > now) {
      failures.push({
        source,
        message: 'provider circuit is open',
        circuitOpenUntil: circuit.openUntil,
        consecutiveFailures: circuit.consecutiveFailures,
      });
      console.warn('Market provider circuit open; skipping provider', {
        source,
        openUntil: circuit.openUntil,
        consecutiveFailures: circuit.consecutiveFailures,
      });
      continue;
    }

    try {
      const data = await fetchProvider();
      await recordMarketProviderSuccess(db, source, Date.now());
      return { source, data, failures };
    } catch (error) {
      const nextCircuit = await recordMarketProviderFailure(db, source, error, Date.now());
      failures.push({
        source,
        message: error?.message || String(error),
        circuitOpenUntil: nextCircuit.openUntil || null,
        consecutiveFailures: nextCircuit.consecutiveFailures,
      });
      console.error('Market provider refresh failed; trying failover', {
        source,
        error: error?.message || String(error),
        circuitOpenUntil: nextCircuit.openUntil || null,
        consecutiveFailures: nextCircuit.consecutiveFailures,
      });
    }
  }

  throw new Error(`All market providers failed: ${failures.map((item) => `${item.source}: ${item.message}`).join(' | ')}`);
}

async function ensureSchemas(db) {
  await db.prepare(SNAPSHOT_SCHEMA).run();
  await db.prepare(CHUNK_SCHEMA).run();
  await ensureMarketProviderCircuitSchema(db);
}

async function readSnapshotMetadata(db, snapshotId = PRIMARY_SNAPSHOT_ID) {
  return db.prepare(
    'SELECT source, asset_count, captured_at FROM market_snapshots WHERE id = ?',
  ).bind(snapshotId).first();
}

async function readSnapshot(db, snapshotId = PRIMARY_SNAPSHOT_ID) {
  return db.prepare(
    'SELECT source, asset_count, captured_at, payload FROM market_snapshots WHERE id = ?',
  ).bind(snapshotId).first();
}

function decodeSnapshot(row, snapshotId = PRIMARY_SNAPSHOT_ID) {
  if (!row) return null;
  try {
    const data = JSON.parse(row.payload);
    const assetCount = Number(row.asset_count);
    const capturedAt = Number(row.captured_at);
    if (!Array.isArray(data)
      || data.length < MIN_ACCEPTED_ASSETS
      || !Number.isFinite(assetCount)
      || assetCount !== data.length
      || !Number.isFinite(capturedAt)
      || capturedAt <= 0) {
      return null;
    }
    return { ...row, snapshot_id: snapshotId, data };
  } catch {
    return null;
  }
}

async function readBestSnapshot(db) {
  const primary = decodeSnapshot(await readSnapshot(db, PRIMARY_SNAPSHOT_ID), PRIMARY_SNAPSHOT_ID);
  if (primary) return primary;
  return decodeSnapshot(await readSnapshot(db, BACKUP_SNAPSHOT_ID), BACKUP_SNAPSHOT_ID);
}

async function readPrimaryOrBackupMetadata(db) {
  const primary = await readSnapshotMetadata(db, PRIMARY_SNAPSHOT_ID);
  if (primary) return { ...primary, snapshot_id: PRIMARY_SNAPSHOT_ID };
  const backup = await readSnapshotMetadata(db, BACKUP_SNAPSHOT_ID);
  return backup ? { ...backup, snapshot_id: BACKUP_SNAPSHOT_ID } : null;
}

async function readBackupDurability(db) {
  try {
    const backup = await readSnapshotMetadata(db, BACKUP_SNAPSHOT_ID);
    const assetCount = Number(backup?.asset_count || 0);
    const capturedAt = Number(backup?.captured_at || 0);
    return {
      backupAvailable: assetCount >= MIN_ACCEPTED_ASSETS && capturedAt > 0,
      backupAssetCount: assetCount || 0,
      backupCapturedAt: capturedAt || null,
      backupAgeMs: capturedAt > 0 ? Math.max(0, Date.now() - capturedAt) : null,
    };
  } catch {
    return {
      backupAvailable: false,
      backupAssetCount: 0,
      backupCapturedAt: null,
      backupAgeMs: null,
    };
  }
}

async function copyPrimarySnapshotToBackup(db) {
  const primaryRow = await readSnapshot(db, PRIMARY_SNAPSHOT_ID);
  const current = decodeSnapshot(primaryRow, PRIMARY_SNAPSHOT_ID);
  if (!current) return false;

  await db.prepare(`
    INSERT INTO market_snapshots (id, source, asset_count, captured_at, payload, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      source = excluded.source,
      asset_count = excluded.asset_count,
      captured_at = excluded.captured_at,
      payload = excluded.payload,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    BACKUP_SNAPSHOT_ID,
    current.source,
    Number(current.asset_count),
    Number(current.captured_at),
    primaryRow.payload,
  ).run();
  return true;
}

async function readChunkCoverage(db, snapshot) {
  const expectedChunks = Math.ceil(Number(snapshot?.asset_count || 0) / MARKET_CHUNK_SIZE);
  if (!expectedChunks) {
    return { ready: false, chunkCount: 0, expectedChunks: 0, capturedAt: null };
  }

  try {
    const row = await db.prepare(`
      SELECT
        COUNT(*) AS chunk_count,
        MIN(captured_at) AS min_captured_at,
        MAX(captured_at) AS max_captured_at
      FROM market_snapshot_chunks
      WHERE snapshot_id = ?
    `).bind(PRIMARY_SNAPSHOT_ID).first();
    const chunkCount = Number(row?.chunk_count || 0);
    const minCapturedAt = Number(row?.min_captured_at || 0);
    const maxCapturedAt = Number(row?.max_captured_at || 0);
    const snapshotCapturedAt = Number(snapshot?.captured_at || 0);
    return {
      ready: chunkCount >= expectedChunks
        && snapshotCapturedAt > 0
        && minCapturedAt === snapshotCapturedAt
        && maxCapturedAt === snapshotCapturedAt,
      chunkCount,
      expectedChunks,
      capturedAt: snapshotCapturedAt || null,
    };
  } catch {
    return { ready: false, chunkCount: 0, expectedChunks, capturedAt: Number(snapshot?.captured_at || 0) || null };
  }
}

async function persistChunks(db, data, capturedAt, source = 'coinlore', snapshotId = PRIMARY_SNAPSHOT_ID) {
  const chunkCount = Math.ceil(data.length / MARKET_CHUNK_SIZE);
  const statements = [];
  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
    const chunk = data.slice(chunkIndex * MARKET_CHUNK_SIZE, (chunkIndex + 1) * MARKET_CHUNK_SIZE);
    statements.push(db.prepare(`
      INSERT INTO market_snapshot_chunks (snapshot_id, chunk_index, source, captured_at, asset_count, payload, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(snapshot_id, chunk_index) DO UPDATE SET
        source = excluded.source,
        captured_at = excluded.captured_at,
        asset_count = excluded.asset_count,
        payload = excluded.payload,
        updated_at = CURRENT_TIMESTAMP
    `).bind(snapshotId, chunkIndex, source, capturedAt, data.length, JSON.stringify(chunk)));
  }

  for (let offset = 0; offset < statements.length; offset += CHUNK_WRITE_BATCH_SIZE) {
    const group = statements.slice(offset, offset + CHUNK_WRITE_BATCH_SIZE);
    if (typeof db.batch === 'function') await db.batch(group);
    else {
      for (const statement of group) await statement.run();
    }
  }

  await db.prepare(
    'DELETE FROM market_snapshot_chunks WHERE snapshot_id = ? AND chunk_index >= ?',
  ).bind(snapshotId, chunkCount).run();
}

async function refreshSnapshot(dbBinding, env = {}) {
  const db = primarySession(dbBinding);
  await ensureSchemas(db);
  const { source, data } = await fetchMarketData(db, env);
  const capturedAt = Date.now();
  const backupCreated = await copyPrimarySnapshotToBackup(db);

  await db.prepare(`
    INSERT INTO market_snapshots (id, source, asset_count, captured_at, payload, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      source = excluded.source,
      asset_count = excluded.asset_count,
      captured_at = excluded.captured_at,
      payload = excluded.payload,
      updated_at = CURRENT_TIMESTAMP
  `).bind(PRIMARY_SNAPSHOT_ID, source, data.length, capturedAt, JSON.stringify(data)).run();
  await persistChunks(db, data, capturedAt, source, PRIMARY_SNAPSHOT_ID);
  return {
    source,
    asset_count: data.length,
    captured_at: capturedAt,
    snapshot_id: PRIMARY_SNAPSHOT_ID,
    backupCreated,
    data,
  };
}

async function refreshSnapshotSingleFlight(db, env = {}) {
  if (!refreshInFlight) {
    refreshInFlight = refreshSnapshot(db, env).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function backfillChunksFromPersistedSnapshot(dbBinding) {
  if (!chunkBackfillInFlight) {
    chunkBackfillInFlight = (async () => {
      const db = primarySession(dbBinding);
      await ensureSchemas(db);
      const snapshot = await readBestSnapshot(db);
      if (!snapshot) throw new Error('Persisted market snapshot is unavailable for chunk backfill');
      await persistChunks(
        db,
        snapshot.data,
        Number(snapshot.captured_at),
        snapshot.source || 'coinlore',
        PRIMARY_SNAPSHOT_ID,
      );
      return readChunkCoverage(db, snapshot);
    })().finally(() => {
      chunkBackfillInFlight = null;
    });
  }
  return chunkBackfillInFlight;
}

function metadataFor(snapshot, requestId, refreshPerformed, refreshScheduled, durability = {}) {
  const ageMs = Math.max(0, Date.now() - Number(snapshot.captured_at));
  const stale = ageMs > SNAPSHOT_FRESH_MS;
  const refreshDue = ageMs >= SNAPSHOT_FRESH_MS - SNAPSHOT_REFRESH_AHEAD_MS;
  return {
    healthy: snapshot.asset_count >= MIN_ACCEPTED_ASSETS && ageMs <= SNAPSHOT_FRESH_MS * 4,
    source: snapshot.source,
    assetCount: snapshot.asset_count,
    collectionLimit: MARKET_ASSET_LIMIT,
    capturedAt: snapshot.captured_at,
    ageMs,
    stale,
    refreshDue,
    refreshPerformed,
    refreshScheduled,
    refreshMode: 'single-flight-background',
    providerFailover: ['coinlore', 'coingecko'],
    providerCircuit: {
      persistence: 'd1',
      failureThreshold: PROVIDER_FAILURE_THRESHOLD,
      cooldownMs: PROVIDER_COOLDOWN_MS,
      recoveryMode: 'cooldown-then-probe',
    },
    durability: {
      primarySnapshotId: PRIMARY_SNAPSHOT_ID,
      backupSnapshotId: BACKUP_SNAPSHOT_ID,
      backupMode: 'rolling-full-row',
      recoverySnapshot: snapshot.snapshot_id === BACKUP_SNAPSHOT_ID,
      ...durability,
    },
    chunkSize: MARKET_CHUNK_SIZE,
    requestId,
  };
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const requestId = crypto.randomUUID();
  if (!env.AUTH_DB) {
    return json({ error: 'Market snapshot database is not configured', code: 'MARKET_DB_MISSING', requestId }, 503, { 'Retry-After': '30' });
  }

  try {
    const url = new URL(request.url);
    const healthOnly = url.searchParams.get('health') === '1';
    const forceRefresh = healthOnly && url.searchParams.get('refresh') === '1';
    const readDb = readSession(env.AUTH_DB);

    if (healthOnly) {
      let metadataRow = await readPrimaryOrBackupMetadata(readDb).catch(() => null);
      if (!metadataRow) {
        const initialized = await refreshSnapshotSingleFlight(env.AUTH_DB, env);
        metadataRow = initialized;
      }

      let durability = await readBackupDurability(readDb);
      let meta = metadataFor(metadataRow, requestId, false, false, durability);
      let chunkCoverage = null;
      let chunkBackfilled = false;

      if (forceRefresh && meta.refreshDue) {
        metadataRow = await refreshSnapshotSingleFlight(env.AUTH_DB, env);
        durability = await readBackupDurability(readSession(env.AUTH_DB));
        meta = metadataFor(metadataRow, requestId, true, false, durability);
      }

      if (forceRefresh) {
        const primaryDb = primarySession(env.AUTH_DB);
        await ensureSchemas(primaryDb);
        chunkCoverage = await readChunkCoverage(primaryDb, metadataRow);
        if (!chunkCoverage.ready) {
          chunkCoverage = await backfillChunksFromPersistedSnapshot(env.AUTH_DB);
          chunkBackfilled = true;
        }
      } else if (meta.refreshDue && typeof context.waitUntil === 'function') {
        context.waitUntil(refreshSnapshotSingleFlight(env.AUTH_DB, env).catch((error) => {
          console.error('Background market snapshot refresh failed', { requestId, error });
        }));
        meta = metadataFor(metadataRow, requestId, false, true, durability);
      }

      return json({
        ...meta,
        ...(forceRefresh ? {
          chunkReady: Boolean(chunkCoverage?.ready),
          chunkCount: Number(chunkCoverage?.chunkCount || 0),
          expectedChunks: Number(chunkCoverage?.expectedChunks || 0),
          chunkBackfilled,
        } : {}),
      }, 200, { 'X-KriptoAman-Market-Read': 'metadata-only' });
    }

    let snapshot = await readBestSnapshot(readDb);
    if (!snapshot) snapshot = await refreshSnapshotSingleFlight(env.AUTH_DB, env);
    const durability = await readBackupDurability(readDb);
    let meta = metadataFor(snapshot, requestId, false, false, durability);

    if (meta.refreshDue && typeof context.waitUntil === 'function') {
      context.waitUntil(refreshSnapshotSingleFlight(env.AUTH_DB, env).catch((error) => {
        console.error('Background market snapshot refresh failed', { requestId, error });
      }));
      meta = metadataFor(snapshot, requestId, false, true, durability);
    }

    return json({ ...meta, data: snapshot.data });
  } catch (error) {
    console.error('Market snapshot unavailable', { requestId, error });
    return json({ error: 'Market snapshot unavailable', code: 'MARKET_SNAPSHOT_FAILED', requestId }, 503, { 'Retry-After': '30' });
  }
}
