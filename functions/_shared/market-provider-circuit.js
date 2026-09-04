export const PROVIDER_FAILURE_THRESHOLD = 3;
export const PROVIDER_COOLDOWN_MS = 10 * 60 * 1000;

const PROVIDER_CIRCUIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS market_provider_circuit (
  provider TEXT PRIMARY KEY,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  open_until INTEGER NOT NULL DEFAULT 0,
  last_failure_at INTEGER,
  last_success_at INTEGER,
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const fallbackState = (provider) => ({
  provider,
  consecutiveFailures: 0,
  openUntil: 0,
  lastFailureAt: null,
  lastSuccessAt: null,
  lastError: null,
});

const normalizeState = (provider, row) => ({
  provider,
  consecutiveFailures: Number(row?.consecutive_failures || 0),
  openUntil: Number(row?.open_until || 0),
  lastFailureAt: Number(row?.last_failure_at || 0) || null,
  lastSuccessAt: Number(row?.last_success_at || 0) || null,
  lastError: row?.last_error || null,
});

export async function ensureMarketProviderCircuitSchema(db) {
  await db.prepare(PROVIDER_CIRCUIT_SCHEMA).run();
}

export async function readMarketProviderCircuit(db, provider) {
  try {
    const row = await db.prepare(`
      SELECT provider, consecutive_failures, open_until, last_failure_at, last_success_at, last_error
      FROM market_provider_circuit
      WHERE provider = ?
    `).bind(provider).first();
    return normalizeState(provider, row);
  } catch (error) {
    console.error('Market provider circuit read failed; failing open', {
      provider,
      error: error?.message || String(error),
    });
    return fallbackState(provider);
  }
}

export async function recordMarketProviderSuccess(db, provider, now = Date.now()) {
  try {
    await db.prepare(`
      INSERT INTO market_provider_circuit (
        provider, consecutive_failures, open_until, last_success_at, last_error, updated_at
      ) VALUES (?, 0, 0, ?, NULL, CURRENT_TIMESTAMP)
      ON CONFLICT(provider) DO UPDATE SET
        consecutive_failures = 0,
        open_until = 0,
        last_success_at = excluded.last_success_at,
        last_error = NULL,
        updated_at = CURRENT_TIMESTAMP
    `).bind(provider, now).run();
  } catch (error) {
    console.error('Market provider circuit success write failed', {
      provider,
      error: error?.message || String(error),
    });
  }
}

export async function recordMarketProviderFailure(db, provider, error, now = Date.now()) {
  const previous = await readMarketProviderCircuit(db, provider);
  const consecutiveFailures = previous.consecutiveFailures + 1;
  const openUntil = consecutiveFailures >= PROVIDER_FAILURE_THRESHOLD
    ? now + PROVIDER_COOLDOWN_MS
    : 0;
  const lastError = String(error?.message || error || 'Provider request failed').slice(0, 500);

  try {
    await db.prepare(`
      INSERT INTO market_provider_circuit (
        provider, consecutive_failures, open_until, last_failure_at, last_error, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(provider) DO UPDATE SET
        consecutive_failures = excluded.consecutive_failures,
        open_until = excluded.open_until,
        last_failure_at = excluded.last_failure_at,
        last_error = excluded.last_error,
        updated_at = CURRENT_TIMESTAMP
    `).bind(provider, consecutiveFailures, openUntil, now, lastError).run();
  } catch (writeError) {
    console.error('Market provider circuit failure write failed', {
      provider,
      error: writeError?.message || String(writeError),
    });
  }

  return {
    provider,
    consecutiveFailures,
    openUntil,
    lastFailureAt: now,
    lastSuccessAt: previous.lastSuccessAt,
    lastError,
  };
}
