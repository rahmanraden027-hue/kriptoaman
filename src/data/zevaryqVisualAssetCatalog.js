// Branding-only catalog. This file MUST NOT be used as evidence of token deployment,
// backing, balances, liquidity, custody, issuer approval, or swap executability.
// On-chain/runtime asset status remains authoritative in zevaryqAssetRegistry.js.

export const ZEVARYQ_VISUAL_ASSET_CATALOG_VERSION = 3;

export const ZEVARYQ_VISUAL_IDENTITY_SLOT_STATUS = Object.freeze({
  APPROVED: 'APPROVED',
  RESERVED: 'RESERVED_UNASSIGNED',
});

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

export const ZEVARYQ_VISUAL_IDENTITY_SLOTS = Object.freeze([
  ...ZEVARYQ_VISUAL_ASSETS.map((asset, index) => Object.freeze({
    slot: index + 1,
    status: ZEVARYQ_VISUAL_IDENTITY_SLOT_STATUS.APPROVED,
    symbol: asset.symbol,
  })),
  ...Array.from({ length: 9 }, (_, index) => Object.freeze({
    slot: index + 4,
    status: ZEVARYQ_VISUAL_IDENTITY_SLOT_STATUS.RESERVED,
    symbol: null,
  })),
]);

// The 12-logo target has explicit capacity without inventing identities.
// Add a visual identity only after its canonical symbol/name/artwork is approved and
// committed. Adding a visual entry MUST NOT activate an asset in Wallet or Swap.
export const ZEVARYQ_VISUAL_TARGET_COUNT = 12;
export const ZEVARYQ_VISUAL_DEFINED_COUNT = ZEVARYQ_VISUAL_ASSETS.length;
export const ZEVARYQ_VISUAL_MISSING_COUNT =
  ZEVARYQ_VISUAL_TARGET_COUNT - ZEVARYQ_VISUAL_DEFINED_COUNT;
export const ZEVARYQ_VISUAL_RESERVED_COUNT = ZEVARYQ_VISUAL_IDENTITY_SLOTS.filter(
  (slot) => slot.status === ZEVARYQ_VISUAL_IDENTITY_SLOT_STATUS.RESERVED,
).length;

// Governance helpers are fail-closed: only fully assigned APPROVED slots are publishable.
export const ZEVARYQ_PUBLISHABLE_VISUAL_IDENTITIES = Object.freeze(
  ZEVARYQ_VISUAL_IDENTITY_SLOTS.filter(
    (slot) => slot.status === ZEVARYQ_VISUAL_IDENTITY_SLOT_STATUS.APPROVED && Boolean(slot.symbol),
  ),
);

export const isZevaryqVisualSlotPublishable = (slot) =>
  slot?.status === ZEVARYQ_VISUAL_IDENTITY_SLOT_STATUS.APPROVED && Boolean(slot?.symbol);

export const ZEVARYQ_VISUAL_GOVERNANCE = Object.freeze({
  approvalRequires: Object.freeze(['canonical-symbol', 'canonical-name', 'committed-artwork']),
  reservedSlotsPublishable: false,
  activatesWalletAsset: false,
  activatesSwapAsset: false,
});
