import { execFileSync } from 'node:child_process';

const RPC = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const WKAM = '0x0d8848CE88BB09a81a4248Efdd574d50B98b544A';
const MANIFEST_FACTORY = '0x5024017B0496113269E80B17d9b0F11733AE6de2';
const ROUTER = '0x4a413674245EE0959183604C153e386C00409122';
const TX = {
  wkam: '0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf',
  factory: '0xddbe3f7265194a068b369d954277f360fcabd2753175c03929d5bebedb5c0e4',
  router: '0x83dd3be8629483b2db730c86437128fb39fb87ceb0738e970bba9c7a9bf98053',
};

function cast(args) {
  try {
    return { ok: true, value: execFileSync('cast', args, { encoding: 'utf8', timeout: 15000 }).trim(), error: null };
  } catch (error) {
    return { ok: false, value: null, error: String(error?.stderr || error?.message || error).trim() };
  }
}

async function rpc(method, params = []) {
  try {
    const response = await fetch(RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    if (body.error) return { ok: false, value: null, error: body.error };
    return { ok: true, value: body.result, error: null };
  } catch (error) {
    return { ok: false, value: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function bytes(hex) {
  if (!hex || hex === '0x') return 0;
  return Math.max(0, (hex.length - 2) / 2);
}

function same(a, b) {
  return Boolean(a && b && String(a).toLowerCase() === String(b).toLowerCase());
}

async function contractState(address) {
  const code = await rpc('eth_getCode', [address, 'latest']);
  const proof = await rpc('eth_getProof', [address, [], 'latest']);
  return {
    address,
    codePresent: code.ok && bytes(code.value) > 0,
    codeBytes: code.ok ? bytes(code.value) : null,
    codeError: code.error,
    nonce: proof.ok ? proof.value?.nonce ?? null : null,
    balance: proof.ok ? proof.value?.balance ?? null : null,
    codeHash: proof.ok ? proof.value?.codeHash ?? null : null,
    proofError: proof.error,
  };
}

async function receipt(hash) {
  const result = await rpc('eth_getTransactionReceipt', [hash]);
  const r = result.value;
  return {
    hash,
    found: result.ok && r != null,
    error: result.error,
    blockNumber: r?.blockNumber ?? null,
    status: r?.status ?? null,
    contractAddress: r?.contractAddress ?? null,
    from: r?.from ?? null,
    to: r?.to ?? null,
  };
}

const chainId = await rpc('eth_chainId');
const blockNumber = await rpc('eth_blockNumber');
const routerFactoryCall = cast(['call', '--rpc-url', RPC, ROUTER, 'factory()(address)']);
const routerWkamCall = cast(['call', '--rpc-url', RPC, ROUTER, 'WKAM()(address)']);
const boundFactory = routerFactoryCall.ok ? routerFactoryCall.value : null;

const manifestFactoryState = await contractState(MANIFEST_FACTORY);
const boundFactoryState = boundFactory ? await contractState(boundFactory) : null;
const routerState = await contractState(ROUTER);
const wkamState = await contractState(WKAM);

const manifestPairs = cast(['call', '--rpc-url', RPC, MANIFEST_FACTORY, 'allPairsLength()(uint256)']);
const boundPairs = boundFactory ? cast(['call', '--rpc-url', RPC, boundFactory, 'allPairsLength()(uint256)']) : null;

const report = {
  checkedAt: new Date().toISOString(),
  mode: 'READ_ONLY_CURRENT_DEX_STATE_PROBE',
  rpc: RPC,
  chainId: chainId.value,
  blockNumber: blockNumber.value,
  addresses: {
    wkam: WKAM,
    router: ROUTER,
    manifestFactory: MANIFEST_FACTORY,
    routerBoundFactory: boundFactory,
    manifestFactoryMatchesRouter: same(MANIFEST_FACTORY, boundFactory),
    routerBoundWKAM: routerWkamCall.value,
    routerWKAMMatchesCanonical: same(WKAM, routerWkamCall.value),
  },
  state: {
    wkam: wkamState,
    router: routerState,
    manifestFactory: manifestFactoryState,
    routerBoundFactory: boundFactoryState,
  },
  pairCount: {
    manifestFactory: manifestPairs,
    routerBoundFactory: boundPairs,
  },
  receipts: {
    wkam: await receipt(TX.wkam),
    factoryManifestRecord: await receipt(TX.factory),
    routerManifestRecord: await receipt(TX.router),
  },
};

report.assessment = {
  routerOperationalCodePresent: routerState.codePresent,
  boundFactoryCodePresent: Boolean(boundFactoryState?.codePresent),
  manifestFactoryCodePresent: manifestFactoryState.codePresent,
  bindingDiscrepancy: !report.addresses.manifestFactoryMatchesRouter,
  canReadBoundFactoryPairCount: Boolean(boundPairs?.ok),
  recordedFactoryReceiptFound: report.receipts.factoryManifestRecord.found,
  recordedRouterReceiptFound: report.receipts.routerManifestRecord.found,
};

console.log(JSON.stringify(report, null, 2));

if (!routerState.codePresent || !boundFactoryState?.codePresent || !routerWkamCall.ok) process.exitCode = 1;
