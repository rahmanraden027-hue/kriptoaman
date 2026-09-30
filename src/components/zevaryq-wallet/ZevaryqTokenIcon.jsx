import { useState } from 'react';
import ZevaryqMark from './ZevaryqMark';

// The premium PNG files must be published under public/assets/zevaryq/tokens/.
// Until they are published, existing SVG icons remain available as a fallback.
const LEGACY_ICONS = Object.freeze({
  zBTC: '/assets/zevaryq/tokens/zbtc-v2.svg',
  zETH: '/assets/zevaryq/tokens/zeth-v2.svg',
  zUSDT: '/assets/zevaryq/tokens/zusdt-v2.svg',
  zUSDC: '/assets/zevaryq/tokens/zusdc-v2.svg',
  zBNB: '/assets/zevaryq/tokens/zbnb-v2.svg',
  zSOL: '/assets/zevaryq/tokens/zsol-v2.svg',
  zTRX: '/assets/zevaryq/tokens/ztrx-v2.svg',
  zXRP: '/assets/zevaryq/tokens/zxrp-v2.svg',
  zADA: '/assets/zevaryq/tokens/zada-v2.svg',
  zDOGE: '/assets/zevaryq/tokens/zdoge-v2.svg',
});

export const ZVQ_TOKEN_ICONS = Object.freeze({
  ZVQ: '/assets/zevaryq/tokens/ZVQ.png',
  ZEVARYQ_NETWORK: '/assets/zevaryq/tokens/ZEVARYQ_NETWORK.png',
  ...Object.fromEntries(Object.keys(LEGACY_ICONS).map((symbol) => [symbol, `/assets/zevaryq/tokens/${symbol}.png`])),
});

export default function ZevaryqTokenIcon({ symbol, className = 'h-12 w-12' }) {
  const [failed, setFailed] = useState('');
  const src = ZVQ_TOKEN_ICONS[symbol];
  const legacy = LEGACY_ICONS[symbol];
  if (!src || failed === 'all') {
    return symbol === 'ZVQ' ? <ZevaryqMark className={className} /> :
      <span className={`${className} grid shrink-0 place-items-center rounded-full border border-[#1A3A59] bg-[#071522] text-xs font-black text-[#F2C86B]`}>{symbol || '?'}</span>;
  }
  return <img
    src={failed === 'png' ? legacy : src}
    alt={`${symbol} token logo`}
    className={`${className} shrink-0 rounded-full object-contain`}
    onError={() => setFailed(failed === 'png' || !legacy ? 'all' : 'png')}
  />;
}
