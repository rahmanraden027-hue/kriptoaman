const RPC_URL = 'https://rpc.kriptoaman.com/';
const EXPECTED_CHAIN = '0x560c';
const CHAIN_ID = 22028;
const MAX_BLOCKS = 12;
const MAX_CONTRACTS = 12;
const CONFIRMATION_DEPTH = 12;
const RPC_TIMEOUT_MS = 8000;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const DATA_RE = /^0x[0-9a-fA-F]*$/;

const SELECTORS = {
  name: '0x06fdde03',
  symbol: '0x95d89b41',
  decimals: '0x313ce567',
  totalSupply: '0x18160ddd',
};

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const safeAddress = value => typeof value === 'string' && ADDRESS_RE.test(value) ? value.toLowerCase() : null;
const safeHash = value => typeof value === 'string' && HASH_RE.test(value) ? value.toLowerCase() : null;

function hexToNumber(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 16);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function uintString(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value)) return null;
  try { return BigInt(value).toString(10); } catch { return null; }
}

function hexBytesToText(hex) {
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) return null;
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    const text = new TextDecoder().decode(bytes).replace(/\0+$/g, '').trim();
    if (!text || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) return null;
    return text.slice(0, 96);
  } catch {
    return null;
  }
}

function decodeAbiString(value) {
  if (typeof value !== 'string' || !DATA_RE.test(value) || value === '0x') return null;
  const hex = value.slice(2);
  if (hex.length === 64) return hexBytesToText(hex);
  if (hex.length < 128) return null;

  const offsetBytes = Number.parseInt(hex.slice(0, 64), 16);
  if (!Number.isSafeInteger(offsetBytes) || offsetBytes < 0) return null;
  const lengthOffset = offsetBytes * 2;
  if (lengthOffset + 64 > hex.length) return null;

  const length = Number.parseInt(hex.slice(lengthOffset, lengthOffset + 64), 16);
  if (!Number.isSafeInteger(length) || length <= 0 || length > 96) return null;
  const dataStart = lengthOffset + 64;
  const dataEnd = dataStart + length * 2;
  if (dataEnd > hex.length) return null;
  return hexBytesToText(hex.slice(dataStart, dataEnd));
}

function codeSizeBytes(code) {
  if (typeof code !== 'string' || !DATA_RE.test(code) || code === '0x') return 0;
  return Math.max(0, (code.length - 2) / 2);
}

let requestId = 1;

async function rpc(method, params = []) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: 'https://kriptoaman.com',
        'User-Agent': 'KriptoAman-QoryVEx-Discovery/2.0',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: requestId++, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RPC ${method} returned HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.error) throw new Error(payload.error.message || `RPC ${method} failed`);
    return payload?.result;
  } finally {
    clearTimeout(timeout);
  }
}

async function safeRpc(method, params = []) {
  try { return await rpc(method, params); } catch { return null; }
}

async function inspectContract(candidate, head) {
  const receipt = await safeRpc('eth_getTransactionReceipt', [candidate.txHash]);
  const contractAddress = safeAddress(receipt?.contractAddress);
  const receiptBlockNumber = hexToNumber(receipt?.blockNumber);
  const receiptBlockHash = safeHash(receipt?.blockHash);

  if (!contractAddress || receipt?.status === '0x0') return null;
  if (receiptBlockNumber !== candidate.blockNumber || receiptBlockHash !== candidate.blockHash) return null;

  const blockTag = `0x${candidate.blockNumber.toString(16)}`;
  const code = await safeRpc('eth_getCode', [contractAddress, blockTag]);
  const bytecodeBytes = codeSizeBytes(code);
  if (!bytecodeBytes) return null;

  const [nameRaw, symbolRaw, decimalsRaw, supplyRaw] = await Promise.all([
    safeRpc('eth_call', [{ to: contractAddress, data: SELECTORS.name }, blockTag]),
    safeRpc('eth_call', [{ to: contractAddress, data: SELECTORS.symbol }, blockTag]),
    safeRpc('eth_call', [{ to: contractAddress, data: SELECTORS.decimals }, blockTag]),
    safeRpc('eth_call', [{ to: contractAddress, data: SELECTORS.totalSupply }, blockTag]),
  ]);

  const name = decodeAbiString(nameRaw);
  const symbol = decodeAbiString(symbolRaw);
  const decimalsNumber = hexToNumber(decimalsRaw);
  const decimals = Number.isInteger(decimalsNumber) && decimalsNumber >= 0 && decimalsNumber <= 255 ? decimalsNumber : null;
  const totalSupplyRaw = uintString(supplyRaw);
  const metadataFieldsProven = [name, symbol, decimals != null, totalSupplyRaw != null].filter(Boolean).length;
  const tokenMetadataProven = Boolean(name && symbol && decimals != null && totalSupplyRaw != null);
  const ageBlocks = Math.max(0, head - candidate.blockNumber);
  const confirmationState = ageBlocks >= CONFIRMATION_DEPTH ? 'confirmed' : 'observed-not-finalized';

  return {
    type: tokenMetadataProven ? 'ERC20_METADATA_PROVEN' : 'CONTRACT_ONLY',
    chainId: CHAIN_ID,
    address: contractAddress,
    creator: candidate.from,
    creationTxHash: candidate.txHash,
    blockNumber: candidate.blockNumber,
    blockHash: candidate.blockHash,
    observedAt: candidate.observedAt,
    confirmations: ageBlocks,
    confirmationDepth: CONFIRMATION_DEPTH,
    confirmationState,
    assetPassport: {
      schema: 'kriptoaman.asset-passport.v1',
      name: tokenMetadataProven ? name : null,
      symbol: tokenMetadataProven ? symbol : null,
      decimals: tokenMetadataProven ? decimals : null,
      totalSupplyRaw: tokenMetadataProven ? totalSupplyRaw : null,
      bytecodeBytes,
      metadataFieldsProven,
      evidenceState: tokenMetadataProven ? 'FIRST_PARTY_LIVE' : 'PARTIAL_ON_CHAIN_EVIDENCE',
      provenance: {
        ownership: 'first-party',
        endpoint: 'rpc.kriptoaman.com',
        transport: 'JSON-RPC',
        blockTag,
        blockNumber: candidate.blockNumber,
        blockHash: candidate.blockHash,
        transactionHash: candidate.txHash,
        creator: candidate.from,
        confirmationState,
        externalMarketProviderUsed: false,
      },
    },
    launchDna: {
      schema: 'kriptoaman.launch-dna.v1',
      ageBlocks,
      confirmations: ageBlocks,
      confirmationDepth: CONFIRMATION_DEPTH,
      confirmationState,
      freshnessBand: ageBlocks <= 3 ? 'JUST_LAUNCHED' : ageBlocks < CONFIRMATION_DEPTH ? 'NEW' : 'CONFIRMED_RECENT',
      bytecodeBytes,
      metadataFieldsProven,
      metadataComplete: tokenMetadataProven,
      declaredDecimals: tokenMetadataProven ? decimals : null,
      declaredSupplyPresent: tokenMetadataProven,
      profileKey: `${CHAIN_ID}:${contractAddress}:${candidate.blockNumber}:${bytecodeBytes}:${tokenMetadataProven ? decimals : 'na'}`,
      interpretation: 'Descriptive on-chain launch profile; not a safety score, audit, endorsement, or price prediction.',
    },
    qoryvexDiscovery: {
      state: tokenMetadataProven ? 'DISCOVERED_ON_CHAIN' : 'CONTRACT_OBSERVED',
      evidenceState: confirmationState,
      poolEvidence: 'UNAVAILABLE',
      liquidityEvidence: 'UNAVAILABLE',
      executionState: 'DISABLED',
      reason: 'Pool/liquidity detector is intentionally gated until a verified factory/router registry is configured from first-party chain evidence.',
    },
  };
}

export async function onRequestGet() {
  const startedAt = Date.now();
  const observationId = crypto.randomUUID();

  try {
    const [chainIdHex, headHex] = await Promise.all([rpc('eth_chainId'), rpc('eth_blockNumber')]);
    if (chainIdHex !== EXPECTED_CHAIN) {
      return json({ status: 'unavailable', code: 'CHAIN_ID_MISMATCH', expected: EXPECTED_CHAIN, actual: chainIdHex, observationId }, 503);
    }

    const head = hexToNumber(headHex);
    if (head == null) return json({ status: 'unavailable', code: 'INVALID_HEAD', observationId }, 503);

    const heights = Array.from({ length: MAX_BLOCKS }, (_, index) => head - index).filter(height => height >= 0);
    const blocks = (await Promise.all(
      heights.map(height => rpc('eth_getBlockByNumber', [`0x${height.toString(16)}`, true]))
    )).filter(Boolean);

    const creations = [];
    for (const block of blocks) {
      const blockNumber = hexToNumber(block?.number);
      const blockHash = safeHash(block?.hash);
      if (blockNumber == null || !blockHash) continue;
      for (const tx of Array.isArray(block?.transactions) ? block.transactions : []) {
        if (creations.length >= MAX_CONTRACTS) break;
        if (tx?.to != null) continue;
        const txHash = safeHash(tx?.hash);
        const from = safeAddress(tx?.from);
        if (!txHash || !from) continue;
        creations.push({ txHash, from, blockNumber, blockHash, observedAt: Date.now() });
      }
      if (creations.length >= MAX_CONTRACTS) break;
    }

    const inspected = (await Promise.all(creations.map(candidate => inspectContract(candidate, head)))).filter(Boolean);
    const tokens = inspected.filter(item => item.type === 'ERC20_METADATA_PROVEN');

    return json({
      status: 'live',
      schemaVersion: 2,
      network: 'ZEVARYQ Mainnet',
      chainId: CHAIN_ID,
      chainIdHex: EXPECTED_CHAIN,
      sourceMode: 'first-party-json-rpc',
      head: {
        number: head,
        hex: headHex,
        hash: safeHash(blocks[0]?.hash),
        timestamp: blocks[0]?.timestamp ? hexToNumber(blocks[0].timestamp) * 1000 : null,
      },
      radar: {
        scannedBlocks: blocks.length,
        confirmationDepth: CONFIRMATION_DEPTH,
        contractCreationsObserved: creations.length,
        contractsInspected: inspected.length,
        tokenMetadataProven: tokens.length,
        candidates: inspected,
        tokens,
      },
      truthPolicy: {
        contractCreationIsTokenListing: false,
        tokenMetadataRequiredFields: ['name', 'symbol', 'decimals', 'totalSupply'],
        tokenMetadataIsAudit: false,
        tokenMetadataIsEndorsement: false,
        confirmationDepth: CONFIRMATION_DEPTH,
        poolLiquidityAvailable: false,
        executionEnabled: false,
      },
      provenance: {
        ownership: 'first-party',
        endpoint: 'rpc.kriptoaman.com',
        transport: 'JSON-RPC',
        externalMarketProviderUsed: false,
        finality: 'confirmation-aware-canonical-snapshot',
      },
      latencyMs: Date.now() - startedAt,
      observedAt: Date.now(),
      observationId,
    });
  } catch (error) {
    return json({
      status: 'unavailable',
      code: 'QORYVEX_DISCOVERY_UNAVAILABLE',
      message: error?.message || 'First-party token discovery unavailable',
      provenance: {
        ownership: 'first-party',
        endpoint: 'rpc.kriptoaman.com',
        transport: 'JSON-RPC',
        externalMarketProviderUsed: false,
      },
      observationId,
    }, 503);
  }
}
