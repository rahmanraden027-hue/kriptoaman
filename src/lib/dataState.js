export const DATA_STATE = Object.freeze({
  LIVE: 'LIVE',
  VERIFIED: 'VERIFIED',
  SYNCED: 'SYNCED',
  INDEXED: 'INDEXED',
  CALCULATED: 'CALCULATED',
  DELAYED: 'DELAYED',
  PARTIAL: 'PARTIAL',
  SNAPSHOT: 'SNAPSHOT',
  UNAVAILABLE: 'UNAVAILABLE',
  CHECKING: 'CHECKING',
});

const NORMALIZED = Object.freeze({
  live: DATA_STATE.LIVE,
  online: DATA_STATE.LIVE,
  operational: DATA_STATE.LIVE,
  healthy: DATA_STATE.LIVE,
  verified: DATA_STATE.VERIFIED,
  synced: DATA_STATE.SYNCED,
  indexed: DATA_STATE.INDEXED,
  calculated: DATA_STATE.CALCULATED,
  computed: DATA_STATE.CALCULATED,
  delayed: DATA_STATE.DELAYED,
  partial: DATA_STATE.PARTIAL,
  degraded: DATA_STATE.PARTIAL,
  snapshot: DATA_STATE.SNAPSHOT,
  stale: DATA_STATE.DELAYED,
  cached: DATA_STATE.SNAPSHOT,
  available: DATA_STATE.SNAPSHOT,
  unavailable: DATA_STATE.UNAVAILABLE,
  offline: DATA_STATE.UNAVAILABLE,
  error: DATA_STATE.UNAVAILABLE,
  unknown: DATA_STATE.UNAVAILABLE,
  checking: DATA_STATE.CHECKING,
  loading: DATA_STATE.CHECKING,
  pending: DATA_STATE.CHECKING,
  connecting: DATA_STATE.CHECKING,
});

export function normalizeDataState(value, fallback = DATA_STATE.UNAVAILABLE) {
  const key = String(value ?? '').trim().toLowerCase();
  return NORMALIZED[key] || fallback;
}

export function marketDataState({ connected = false, dataAvailable = false, partial = false } = {}) {
  if (connected) return DATA_STATE.LIVE;
  if (partial) return DATA_STATE.PARTIAL;
  if (dataAvailable) return DATA_STATE.SNAPSHOT;
  return DATA_STATE.UNAVAILABLE;
}

export function marketSnapshotState({
  dataAvailable = false,
  partial = false,
  isStale = false,
  loading = false,
} = {}) {
  if (loading && !dataAvailable) return DATA_STATE.CHECKING;
  if (partial) return DATA_STATE.PARTIAL;
  if (!dataAvailable) return DATA_STATE.UNAVAILABLE;
  if (isStale) return DATA_STATE.DELAYED;
  return DATA_STATE.SNAPSHOT;
}

export function isPositiveDataState(state) {
  return [DATA_STATE.LIVE, DATA_STATE.VERIFIED, DATA_STATE.SYNCED, DATA_STATE.INDEXED].includes(state);
}
