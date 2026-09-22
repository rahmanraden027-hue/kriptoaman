export const ZEVARYQ_IDENTITY = Object.freeze({
  platform: 'KriptoAman',
  network: 'ZEVARYQ Network',
  mainnet: 'ZEVARYQ Mainnet',
  nativeAsset: 'ZEVARYQ',
  symbol: 'ZVQ',
  decimals: 18,
  chainId: 22028,
  chainIdHex: '0x560c',
  rpcUrl: 'https://rpc.kriptoaman.com',
  explorerUrl: 'https://explorer.kriptoaman.com',
  legacyNetwork: 'KAM Network',
  legacySymbol: 'KAM',
});

export const ZEVARYQ_WALLET_PARAMS = Object.freeze({
  chainId: ZEVARYQ_IDENTITY.chainIdHex,
  chainName: ZEVARYQ_IDENTITY.mainnet,
  nativeCurrency: Object.freeze({
    name: ZEVARYQ_IDENTITY.nativeAsset,
    symbol: ZEVARYQ_IDENTITY.symbol,
    decimals: ZEVARYQ_IDENTITY.decimals,
  }),
  rpcUrls: Object.freeze([ZEVARYQ_IDENTITY.rpcUrl]),
  blockExplorerUrls: Object.freeze([ZEVARYQ_IDENTITY.explorerUrl]),
});
