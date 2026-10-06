import { DATA_STATE } from '@/lib/dataState';

export const PRODUCT_ARCHITECTURE_VERSION = '2026.2';

export const PRODUCT_ROLES = Object.freeze({
  kriptoaman: Object.freeze({
    id: 'kriptoaman',
    name: 'KriptoAman',
    role: 'INTELLIGENCE_AND_CONTROL',
    statement: 'Observe, understand, and support evidence-based decisions.',
  }),
  wallet: Object.freeze({
    id: 'wallet',
    name: 'ZEVARYQ Wallet',
    role: 'USER_EXECUTION_INTERFACE',
    statement: 'Prepare user actions while production mutations remain policy-gated.',
  }),
  network: Object.freeze({
    id: 'network',
    name: 'ZEVARYQ Network',
    role: 'BLOCKCHAIN_AND_SETTLEMENT',
    statement: 'Execute, record, and settle on-chain state.',
  }),
  explorer: Object.freeze({
    id: 'explorer',
    name: 'ZEVARYQ Explorer',
    role: 'EVIDENCE_AND_VERIFICATION',
    statement: 'Expose independently verifiable on-chain evidence.',
  }),
  asset: Object.freeze({
    id: 'asset',
    name: 'ZVQ',
    role: 'NATIVE_NETWORK_ASSET',
    statement: 'Native asset of ZEVARYQ Mainnet.',
  }),
});

export const CROSS_SURFACE_RELEASE = 'phase15f';

export const DECISION_LOOP = Object.freeze([
  'OBSERVE',
  'UNDERSTAND',
  'DECIDE',
  'EXECUTE',
  'VERIFY',
]);

export const DATA_CONTRACT_FIELDS = Object.freeze([
  'state',
  'source',
  'timestamp',
  'freshness',
]);

export const DATA_CONTRACT_POLICY = Object.freeze({
  failClosed: true,
  simulatedProductionValuesAllowed: false,
  missingSourceState: DATA_STATE.UNAVAILABLE,
});

export const TRUTH_STATES = Object.freeze([
  DATA_STATE.LIVE,
  DATA_STATE.VERIFIED,
  DATA_STATE.SYNCED,
  DATA_STATE.PARTIAL,
  DATA_STATE.SNAPSHOT,
  DATA_STATE.UNAVAILABLE,
  DATA_STATE.CHECKING,
]);

export const FINAL_SCREEN_ARCHITECTURE = Object.freeze([
  Object.freeze({
    id: 'command-center',
    title: 'Command Center',
    route: '/',
    owner: PRODUCT_ROLES.kriptoaman.id,
    intent: 'Current market, intelligence, and network state at a glance.',
    sources: Object.freeze(['market-surface', '/api/kam/network-status']),
  }),
  Object.freeze({
    id: 'markets',
    title: 'Markets',
    route: '/Market',
    owner: PRODUCT_ROLES.kriptoaman.id,
    intent: 'Live market context, liquidity, volume, momentum, and breadth.',
    sources: Object.freeze(['/api/market-snapshot-page', '/api/market-feed-hot']),
  }),
  Object.freeze({
    id: 'intelligence',
    title: 'Intelligence',
    route: '/IntelligenceHub',
    owner: PRODUCT_ROLES.kriptoaman.id,
    intent: 'Deterministic intelligence derived from attributable data.',
    sources: Object.freeze(['market-surface', '/api/zvq-token-intelligence']),
  }),
  Object.freeze({
    id: 'network',
    title: 'Network',
    route: '/ZEVARYQ',
    owner: PRODUCT_ROLES.network.id,
    intent: 'ZEVARYQ Mainnet identity, health, block progress, and indexed evidence.',
    sources: Object.freeze(['/api/kam/network-status', 'https://explorer.kriptoaman.com']),
  }),
  Object.freeze({
    id: 'portfolio',
    title: 'Portfolio',
    route: '/PortfolioOverview',
    owner: PRODUCT_ROLES.kriptoaman.id,
    intent: 'Authenticated portfolio intelligence without fabricating unavailable data.',
    sources: Object.freeze(['authenticated-wallet-state', 'market-surface']),
  }),
  Object.freeze({
    id: 'security',
    title: 'Security',
    route: '/SecurityHub',
    owner: PRODUCT_ROLES.kriptoaman.id,
    intent: 'Risk, verification, and security evidence for user review.',
    sources: Object.freeze(['first-party-security-evidence']),
  }),
  Object.freeze({
    id: 'wallet',
    title: 'Wallet',
    route: '/wallet-app',
    owner: PRODUCT_ROLES.wallet.id,
    intent: 'User execution interface; signing and broadcasting remain release-policy gated.',
    sources: Object.freeze(['wallet-provider-state', '/api/kam/network-status']),
  }),
  Object.freeze({
    id: 'explorer',
    title: 'Explorer',
    route: 'https://explorer.kriptoaman.com',
    owner: PRODUCT_ROLES.explorer.id,
    intent: 'On-chain proof for blocks, transactions, addresses, and network identity.',
    sources: Object.freeze(['ZEVARYQ indexed chain data']),
  }),
]);

export function screenContract(id) {
  return FINAL_SCREEN_ARCHITECTURE.find((screen) => screen.id === id) || null;
}
