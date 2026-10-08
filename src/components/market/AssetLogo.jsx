import React, { useEffect, useMemo, useState } from 'react';
import { COIN_META } from '@/components/home/coinMeta';

const ZVQ_OFFICIAL_LOGO = '/assets/zevaryq/tokens/zvq-coin-v2.svg';
const PLANNED_ZEVARYQ_SYMBOLS = new Set(['ZBTC', 'ZETH']);

const normalizeSymbol = (value) => {
  const symbol = String(value || '').trim().toUpperCase();
  return /^[A-Z0-9._-]{1,16}$/.test(symbol) ? symbol : '';
};

const coinCapImage = (symbol) =>
  `https://assets.coincap.io/assets/icons/${encodeURIComponent(String(symbol || '').toLowerCase())}@2x.png`;

export const resolveAssetLogoCandidates = (asset = {}) => {
  const symbol = normalizeSymbol(asset?.sym || asset?.symbol);
  const id = String(asset?.id || '');
  const candidates = [];

  // ZVQ is the only first-party market identity activated for public use here.
  if (symbol === 'ZVQ') candidates.push(ZVQ_OFFICIAL_LOGO);

  // Do not trust arbitrary image URLs from market payloads. Known artwork is curated
  // in source control; long-tail fallbacks are derived only from validated identifiers.
  const known = COIN_META[symbol]?.logo;
  if (known) candidates.push(known);

  const coinLoreId = id.match(/^coinlore-(\d+)$/)?.[1];
  if (coinLoreId) candidates.push(`https://www.coinlore.com/img/50x50/${coinLoreId}.png`);

  // Planned first-party wrapped identities remain fail-closed on public market surfaces.
  if (symbol && symbol !== 'ZVQ' && !PLANNED_ZEVARYQ_SYMBOLS.has(symbol)) {
    candidates.push(coinCapImage(symbol));
  }

  return [...new Set(candidates.filter(Boolean))];
};

export default function AssetLogo({
  asset,
  size = 22,
  className = '',
  badgeClassName = '',
  roundedClass = 'rounded-full',
  priority = false,
  decorative = true,
}) {
  const symbol = normalizeSymbol(asset?.sym || asset?.symbol) || '?';
  const candidates = useMemo(
    () => resolveAssetLogoCandidates(asset),
    [asset?.id, asset?.sym, asset?.symbol],
  );
  const identityKey = `${asset?.id || ''}|${symbol}`;
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => setCandidateIndex(0), [identityKey]);

  const src = candidates[candidateIndex] || null;
  const commonStyle = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={decorative ? '' : `${asset?.name || symbol} logo`}
        width={size}
        height={size}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onError={() => setCandidateIndex((current) => current + 1)}
        className={`shrink-0 object-cover ring-1 ring-white/10 ${roundedClass} ${className}`}
        style={commonStyle}
        data-asset-logo="unified-v1"
        data-asset-symbol={symbol}
      />
    );
  }

  return (
    <span
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : `${asset?.name || symbol} logo unavailable`}
      className={`grid shrink-0 place-items-center border border-cyan-300/20 bg-cyan-300/[0.08] font-black text-cyan-200 ${roundedClass} ${badgeClassName}`}
      style={commonStyle}
      data-asset-logo="symbol-badge-fallback"
      data-asset-symbol={symbol}
    >
      <span style={{ fontSize: Math.max(7, Math.min(11, size * 0.3)) }}>
        {symbol.slice(0, 4)}
      </span>
    </span>
  );
}
