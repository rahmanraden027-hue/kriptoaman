import { config } from './config.mjs';
import { JsonRpcClient } from './rpc.mjs';
import { IntelligenceStore } from './store.mjs';
import { createApiServer } from './server.mjs';
import { ChainIndexer } from './indexer.mjs';

const state = {
  ready: false,
  upstreamWs: false,
  lastBlock: null,
  lastBlockHash: null,
  lastIndexedAt: null,
  lastError: null,
};

const rpc = new JsonRpcClient({ url: config.rpcHttpUrl, timeoutMs: config.rpcTimeoutMs });
const store = new IntelligenceStore(config.dbPath);
const api = createApiServer({ config, store, state });
const indexer = new ChainIndexer({ config, rpc, store, state, broadcast: api.broadcast });

await indexer.verifyChain();
await api.listen();
indexer.startPolling();
indexer.startUpstreamWebSocket();

console.log(JSON.stringify({
  event: 'kriptoaman.chain_listener.started',
  chain: config.chainName,
  chainId: config.chainId,
  source: config.sourceLabel,
  listen: `${config.host}:${config.port}`,
  upstreamHttp: 'first-party',
  upstreamWebSocketConfigured: Boolean(config.rpcWsUrl),
}));

const shutdown = async (signal) => {
  console.log(JSON.stringify({ event: 'kriptoaman.chain_listener.stopping', signal }));
  indexer.stop();
  await api.close().catch(() => {});
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
