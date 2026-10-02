const SOURCE_PATH = '/api/zvq-token-intelligence';
const CHAIN_ID = 22028;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const address = value => typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) ? value.toLowerCase() : null;
const hash = value => typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value) ? value.toLowerCase() : null;
const node = (id, type, label, evidence) => ({ id, type, label, evidence });
const edge = (from, to, type, evidence) => ({ from, to, type, evidence });

export async function onRequestGet({ request }) {
  const observationId = crypto.randomUUID();
  try {
    const upstream = new URL(SOURCE_PATH, request.url);
    const response = await fetch(upstream, { headers: { Accept: 'application/json' }, cf: { cacheTtl: 0 } });
    const payload = await response.json();
    if (!response.ok || payload?.status !== 'live' || payload?.chainId !== CHAIN_ID) {
      return json({ status: 'unavailable', schema: 'kriptoaman.intelligence-graph.v1', observationId, reason: 'VERIFIED_SOURCE_UNAVAILABLE' }, 503);
    }
    const headNumber = Number.isSafeInteger(payload?.head?.number) ? payload.head.number : null;
    const headHash = hash(payload?.head?.hash);
    if (headNumber == null || !headHash) {
      return json({ status: 'unavailable', schema: 'kriptoaman.intelligence-graph.v1', observationId, reason: 'HEAD_EVIDENCE_INCOMPLETE' }, 503);
    }

    const nodes = [];
    const edges = [];
    const seenNodes = new Set();
    const seenEdges = new Set();
    const addNode = item => { if (item?.id && !seenNodes.has(item.id)) { seenNodes.add(item.id); nodes.push(item); } };
    const addEdge = item => { const key = item ? `${item.from}|${item.type}|${item.to}` : ''; if (item?.from && item?.to && !seenEdges.has(key)) { seenEdges.add(key); edges.push(item); } };

    const chainId = `chain:${CHAIN_ID}`;
    const blockId = `block:${CHAIN_ID}:${headNumber}`;
    const common = { chainId: CHAIN_ID, source: 'first-party', transport: 'JSON-RPC', observedAt: payload.observedAt ?? null, observationId: payload.observationId ?? null };
    addNode(node(chainId, 'CHAIN', 'ZEVARYQ Mainnet', common));
    addNode(node(blockId, 'BLOCK', String(headNumber), { ...common, blockNumber: headNumber, blockHash: headHash }));
    addEdge(edge(chainId, blockId, 'HAS_HEAD', { ...common, blockNumber: headNumber, blockHash: headHash }));

    for (const item of Array.isArray(payload?.radar?.candidates) ? payload.radar.candidates : []) {
      const contract = address(item?.address);
      const creator = address(item?.creator);
      const txHash = hash(item?.creationTxHash);
      const blockNumber = Number.isSafeInteger(item?.blockNumber) ? item.blockNumber : null;
      const blockHash = hash(item?.blockHash);
      if (!contract || !creator || !txHash || blockNumber == null || !blockHash) continue;
      const evidence = { ...common, blockNumber, blockHash, transactionHash: txHash, confirmationState: item?.confirmationState ?? 'UNAVAILABLE' };
      const txId = `tx:${CHAIN_ID}:${txHash}`;
      const walletId = `wallet:${CHAIN_ID}:${creator}`;
      const contractId = `contract:${CHAIN_ID}:${contract}`;
      addNode(node(txId, 'TRANSACTION', txHash, evidence));
      addNode(node(walletId, 'WALLET', creator, evidence));
      addNode(node(contractId, 'CONTRACT', contract, { ...evidence, bytecodeBytes: item?.assetPassport?.bytecodeBytes ?? null }));
      addEdge(edge(walletId, txId, 'CREATED_VIA', evidence));
      addEdge(edge(txId, contractId, 'DEPLOYED', evidence));
      if (item?.type === 'ERC20_METADATA_PROVEN' && item?.assetPassport?.evidenceState === 'FIRST_PARTY_LIVE') {
        const tokenId = `token:${CHAIN_ID}:${contract}`;
        addNode(node(tokenId, 'TOKEN', item.assetPassport.symbol || contract, { ...evidence, name: item.assetPassport.name, symbol: item.assetPassport.symbol, decimals: item.assetPassport.decimals, totalSupplyRaw: item.assetPassport.totalSupplyRaw }));
        addEdge(edge(contractId, tokenId, 'IMPLEMENTS_PROVEN_TOKEN_METADATA', evidence));
      }
    }

    return json({
      status: 'live',
      schema: 'kriptoaman.intelligence-graph.v1',
      chainId: CHAIN_ID,
      sourceMode: 'derived-from-first-party-evidence',
      head: { number: headNumber, hash: headHash },
      graph: { nodes, edges },
      unavailableRelationships: ['POOL', 'DEX', 'LIQUIDITY', 'TRADE'],
      truthPolicy: {
        unavailableIsZero: false,
        inferredRelationshipsAllowed: false,
        poolDexRelationshipsEnabled: false,
        transactionSubmissionEnabled: false,
      },
      provenance: { ownership: 'first-party', upstream: SOURCE_PATH, externalMarketProviderUsed: false },
      observedAt: Date.now(),
      observationId,
    });
  } catch {
    return json({ status: 'unavailable', schema: 'kriptoaman.intelligence-graph.v1', observationId, reason: 'GRAPH_EVIDENCE_UNAVAILABLE' }, 503);
  }
}
