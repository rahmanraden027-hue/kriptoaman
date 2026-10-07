export const ZEVARYQ_ASSET_REGISTRY_VERSION = 3;

export const ZEVARYQ_ASSET_STATUS = Object.freeze({
  ACTIVE: 'active',
  VERIFIED: 'verified',
  PLANNED: 'planned',
  DISABLED: 'disabled',
});

export const ZEVARYQ_FIRST_PARTY_ASSETS = Object.freeze([
  Object.freeze({
    symbol: 'ZVQ',
    name: 'ZEVARYQ',
    status: ZEVARYQ_ASSET_STATUS.ACTIVE,
    badge: 'NATIVE',
    chainId: 22028,
    assetType: 'native',
    contractAddress: null,
    icon: '/assets/zevaryq/tokens/zvq-coin-v2.svg',
    provenance: 'ZEVARYQ Mainnet native gas asset',
    executable: true,
  }),
  Object.freeze({
    symbol: 'zBTC',
    name: 'ZEVARYQ Bitcoin',
    status: ZEVARYQ_ASSET_STATUS.PLANNED,
    badge: 'PLANNED',
    chainId: 22028,
    assetType: 'candidate',
    contractAddress: null,
    icon: '/assets/zevaryq/tokens/zbtc-v2.svg',
    provenance: 'BTC-backed representation candidate; bridge/backing authorization pending',
    executable: false,
  }),
  Object.freeze({
    symbol: 'zETH',
    name: 'ZEVARYQ Ethereum',
    status: ZEVARYQ_ASSET_STATUS.PLANNED,
    badge: 'PLANNED',
    chainId: 22028,
    assetType: 'candidate',
    contractAddress: null,
    icon: '/assets/zevaryq/tokens/zeth-v2.svg',
    provenance: 'ETH-backed representation candidate; bridge/backing authorization pending',
    executable: false,
  }),
]);

export const ZEVARYQ_PLANNED_ASSETS = Object.freeze(
  ZEVARYQ_FIRST_PARTY_ASSETS.filter((asset) => asset.status === ZEVARYQ_ASSET_STATUS.PLANNED),
);

export const ZEVARYQ_EXECUTABLE_ASSETS = Object.freeze(
  ZEVARYQ_FIRST_PARTY_ASSETS.filter((asset) => asset.executable),
);

export function getZevaryqAsset(symbol) {
  return ZEVARYQ_FIRST_PARTY_ASSETS.find((asset) => asset.symbol === symbol) || null;
}
