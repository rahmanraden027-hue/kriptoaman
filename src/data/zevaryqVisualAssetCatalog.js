// Branding-only catalog. This file MUST NOT be used as evidence of token deployment,
// backing, balances, liquidity, custody, issuer approval, or swap executability.
// On-chain/runtime asset status remains authoritative in zevaryqAssetRegistry.js.

export const ZEVARYQ_VISUAL_ASSET_CATALOG_VERSION = 1;

export const ZEVARYQ_VISUAL_ASSETS = Object.freeze([
  Object.freeze({
    symbol: 'ZVQ',
    name: 'ZEVARYQ',
    visualStatus: 'OFFICIAL',
    assetStatusSource: 'verified-asset-registry-v3',
    icon: '/brand/zevaryq-wallet-premium-icon.webp',
  }),
  Object.freeze({
    symbol: 'zBTC',
    name: 'ZEVARYQ Bitcoin',
    visualStatus: 'OFFICIAL_PLANNED',
    assetStatusSource: 'verified-asset-registry-v3',
    icon: '/assets/zevaryq/tokens/zbtc-v2.svg',
  }),
  Object.freeze({
    symbol: 'zETH',
    name: 'ZEVARYQ Ethereum',
    visualStatus: 'OFFICIAL_PLANNED',
    assetStatusSource: 'verified-asset-registry-v3',
    icon: '/assets/zevaryq/tokens/zeth-v2.svg',
  }),
]);

// The previously discussed 12-logo target is intentionally not synthesized here.
// Add a visual identity only after its canonical symbol/name/artwork is approved and
// committed. Adding a visual entry MUST NOT activate an asset in Wallet or Swap.
export const ZEVARYQ_VISUAL_TARGET_COUNT = 12;
export const ZEVARYQ_VISUAL_DEFINED_COUNT = ZEVARYQ_VISUAL_ASSETS.length;
export const ZEVARYQ_VISUAL_MISSING_COUNT =
  ZEVARYQ_VISUAL_TARGET_COUNT - ZEVARYQ_VISUAL_DEFINED_COUNT;
