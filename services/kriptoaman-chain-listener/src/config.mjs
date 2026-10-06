const int = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value) => String(value || '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

export const config = Object.freeze({
  chainName: process.env.CHAIN_NAME || 'ZEVARYQ Mainnet',
  chainId: int(process.env.CHAIN_ID, 22028),
  chainIdHex: process.env.CHAIN_ID_HEX || '0x560c',
  rpcHttpUrl: process.env.RPC_HTTP_URL || 'http://127.0.0.1:8648',
  rpcWsUrl: process.env.RPC_WS_URL || '',
  pollIntervalMs: int(process.env.POLL_INTERVAL_MS, 1000),
  rpcTimeoutMs: int(process.env.RPC_TIMEOUT_MS, 8000),
  healthMaxAgeMs: int(process.env.HEALTH_MAX_AGE_MS, 30000),
  finalityDepth: int(process.env.FINALITY_DEPTH, 2),
  startupLookbackBlocks: int(process.env.STARTUP_LOOKBACK_BLOCKS, 64),
  host: process.env.LISTEN_HOST || '127.0.0.1',
  port: int(process.env.LISTEN_PORT, 8790),
  dbPath: process.env.DB_PATH || '/var/lib/kriptoaman-intelligence/zvq-indexer.sqlite',
  factoryAddresses: list(process.env.DEX_FACTORY_ADDRESSES),
  allowedOrigins: list(process.env.ALLOWED_ORIGINS || 'https://kriptoaman.com'),
  maxWsClients: int(process.env.MAX_WS_CLIENTS, 500),
  sourceLabel: process.env.SOURCE_LABEL || 'kriptoaman-first-party-zvq',
});
