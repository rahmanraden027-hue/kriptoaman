import { useMemo } from 'react';
import useCoinMarkets from '@/components/home/useCoinMarkets';

const FRESH_MS = 30 * 60 * 1000;

const validNumber = (value) => (
  value !== null
  && value !== undefined
  && value !== ''
  && Number.isFinite(Number(value))
);

const qualityAsset = (asset) => Boolean(
  asset?.id
    && asset?.sym
    && validNumber(asset?.price)
    && validNumber(asset?.change24h),
);

const movementScore = (asset) => Math.min(Math.abs(Number(asset.change24h || 0)), 30) / 30;
const volumeScore = (asset, maxVolume) => maxVolume > 0
  ? Math.log10(Math.max(1, Number(asset.volume || 0))) / Math.log10(Math.max(10, maxVolume))
  : 0;
const relevanceScore = (asset) => {
  const rank = Number(asset?.rank);
  if (!Number.isFinite(rank) || rank <= 0) return 0;
  return Math.max(0, 1 - Math.min(rank, 500) / 500);
};
const completenessScore = (asset) => [
  asset?.image,
  validNumber(asset?.marketCap),
  validNumber(asset?.volume),
  Array.isArray(asset?.sparkline) && asset.sparkline.length > 1,
].filter(Boolean).length / 4;

export default function useMarketSurface() {
  const raw = useCoinMarkets();

  return useMemo(() => {
    const assets = Array.isArray(raw.coins) ? raw.coins.filter(qualityAsset) : [];
    const ageMs = validNumber(raw.cacheAgeMs)
      ? Math.max(0, Number(raw.cacheAgeMs))
      : validNumber(raw.lastUpdated)
        ? Math.max(0, Date.now() - Number(raw.lastUpdated))
        : null;

    let state = 'UNAVAILABLE';
    if (assets.length > 0) {
      if (raw.isStale || !Number.isFinite(ageMs) || ageMs > FRESH_MS) state = 'STALE';
      else if (raw.source === 'kriptoaman-market-db') state = 'LIVE';
      else state = 'SNAPSHOT';
    } else if (!raw.loading && Array.isArray(raw.coins) && raw.coins.length > 0) {
      state = 'PARTIAL';
    }

    const movers = assets.filter(asset => validNumber(asset.change24h));
    const gainers = [...movers]
      .filter(asset => Number(asset.change24h) > 0)
      .sort((a, b) => Number(b.change24h) - Number(a.change24h));
    const losers = [...movers]
      .filter(asset => Number(asset.change24h) < 0)
      .sort((a, b) => Number(a.change24h) - Number(b.change24h));
    const active = [...assets]
      .filter(asset => validNumber(asset.volume))
      .sort((a, b) => Number(b.volume) - Number(a.volume));

    const maxVolume = Number(active[0]?.volume || 0);
    const featured = assets
      .map(asset => ({
        asset,
        displayScore:
          movementScore(asset) * 0.4
          + volumeScore(asset, maxVolume) * 0.3
          + relevanceScore(asset) * 0.2
          + completenessScore(asset) * 0.1,
      }))
      .sort((a, b) => b.displayScore - a.displayScore)
      .slice(0, 8)
      .map(item => item.asset);

    const breadth = movers.reduce((summary, asset) => {
      if (Number(asset.change24h) > 0) summary.positive += 1;
      if (Number(asset.change24h) < 0) summary.negative += 1;
      return summary;
    }, { positive: 0, negative: 0 });

    const direction = movers.length === 0
      ? 'UNAVAILABLE'
      : breadth.positive / movers.length >= 0.58
        ? 'POSITIVE'
        : breadth.negative / movers.length >= 0.58
          ? 'WEAK'
          : 'NEUTRAL';

    const events = [
      gainers[0] && {
        id: `gainer-${gainers[0].id}`,
        asset: gainers[0].sym,
        type: 'MOMENTUM',
        value: Number(gainers[0].change24h),
        direction: 'up',
      },
      losers[0] && {
        id: `loser-${losers[0].id}`,
        asset: losers[0].sym,
        type: 'PRESSURE',
        value: Number(losers[0].change24h),
        direction: 'down',
      },
      active[0] && {
        id: `active-${active[0].id}`,
        asset: active[0].sym,
        type: 'VOLUME',
        value: Number(active[0].volume),
        direction: 'neutral',
      },
      movers.length > 0 && {
        id: 'market-direction',
        asset: 'MARKET',
        type: 'BREADTH',
        value: direction,
        direction: direction === 'POSITIVE' ? 'up' : direction === 'WEAK' ? 'down' : 'neutral',
      },
    ].filter(Boolean);

    return {
      assets,
      loading: raw.loading,
      source: raw.source,
      capturedAt: raw.lastUpdated,
      ageMs,
      state,
      featured,
      gainers,
      losers,
      active,
      newAssets: [],
      direction,
      breadth,
      events,
      assetCount: assets.length,
      rawAssetCount: Array.isArray(raw.coins) ? raw.coins.length : 0,
    };
  }, [
    raw.cacheAgeMs,
    raw.coins,
    raw.isStale,
    raw.lastUpdated,
    raw.loading,
    raw.source,
  ]);
}
