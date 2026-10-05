const MODE_LABELS = Object.freeze({
  'live-verified': 'LIVE VERIFIED',
  'd1-last-verified': 'D1 VERIFIED',
  'memory-last-verified': 'MEMORY VERIFIED',
});

const formatAge = (ageMs) => {
  if (!Number.isFinite(ageMs)) return '—';
  if (ageMs < 1000) return '<1s';
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s`;
  return `${Math.floor(ageMs / 60_000)}m`;
};

export function getProductionFreshness(stats, now = Date.now()) {
  const snapshotAgeMs = Number(stats?.snapshotAgeMs);
  const generatedAtMs = stats?.snapshotGeneratedAt ? Date.parse(stats.snapshotGeneratedAt) : NaN;
  const wallAgeMs = Number.isFinite(generatedAtMs) ? Math.max(0, now - generatedAtMs) : NaN;

  const candidates = [snapshotAgeMs, wallAgeMs].filter((value) => Number.isFinite(value) && value >= 0);
  const ageMs = candidates.length ? Math.max(...candidates) : NaN;
  const mode = stats?.snapshotReadMode ? String(stats.snapshotReadMode) : null;
  const modeLabel = mode ? (MODE_LABELS[mode] || mode.replaceAll('-', ' ').toUpperCase()) : 'UNVERIFIED';
  const freshness = !Number.isFinite(ageMs)
    ? 'UNVERIFIED'
    : ageMs <= 60_000
      ? (mode === 'live-verified' ? 'LIVE' : 'RECENT')
      : ageMs <= 5 * 60_000
        ? 'RECENT'
        : 'STALE';

  const generatedLabel = Number.isFinite(generatedAtMs)
    ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(generatedAtMs))
    : null;

  return {
    ageMs: Number.isFinite(ageMs) ? ageMs : null,
    ageLabel: formatAge(ageMs),
    mode,
    modeLabel,
    freshness,
    generatedLabel,
    verified: Boolean(mode && Number.isFinite(ageMs)),
  };
}
