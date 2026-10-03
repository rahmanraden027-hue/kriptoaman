export const ZEVARYQ_REFRESH_MS = Object.freeze({
  STREAM: 12_000,
  FALLBACK: 30_000,
  DEGRADED: 60_000,
});

export function getZevaryqRefreshDelay(data, phase = 'success') {
  if (phase === 'offline' || phase === 'timeout' || phase === 'degraded') {
    return ZEVARYQ_REFRESH_MS.DEGRADED;
  }
  const streamState = data?.sources?.tokenIntelligence?.streamState;
  if (streamState === 'connected') return ZEVARYQ_REFRESH_MS.STREAM;
  if (streamState === 'fallback' || data?.rpc === 'connected') return ZEVARYQ_REFRESH_MS.FALLBACK;
  return ZEVARYQ_REFRESH_MS.DEGRADED;
}
