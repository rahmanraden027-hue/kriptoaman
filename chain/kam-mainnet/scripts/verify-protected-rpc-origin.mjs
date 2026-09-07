import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const inputPath = process.argv[2] || '/var/lib/kam-evidence/protected-rpc-origin-input.json';
const topologyPath = process.argv[3] || '/var/lib/kam-evidence/four-host-topology-evidence.json';
const publicRpcUrl = process.env.KAM_PUBLIC_RPC_URL || 'https://rpc.kriptoaman.com';
const expectedChainId = '0x560c';
const expectedValidatorCount = 4;
const maxBlockDistance = Number.parseInt(process.env.KAM_ORIGIN_MAX_DISTANCE_BLOCKS || '5', 10);
const maxEvidenceAgeMs = 24 * 60 * 60 * 1000;
const maxFutureSkewMs = 5 * 60 * 1000;
const sha256Pattern = /^[a-f0-9]{64}$/;

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function parseJson(raw, label) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function isFreshTimestamp(value) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return false;
  const age = Date.now() - time;
  return age >= -maxFutureSkewMs && age <= maxEvidenceAgeMs;
}

async function readJson(path, label) {
  const raw = await readFile(path, 'utf8').catch(() => {
    throw new Error(`${label} is unavailable on the protected runner`);
  });
  return parseJson(raw, label);
}

async function rpc(url, method, params = [], label = 'RPC') {
  const startedAt = performance.now();
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
      redirect: 'error',
    });
  } catch {
    throw new Error(`${label} request failed`);
  }

  const latencyMs = Math.round(performance.now() - startedAt);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${label} returned non-JSON data`);
  }

  if (!response.ok || payload?.error) {
    throw new Error(`${label} rejected ${method}`);
  }
  return { result: payload?.result, latencyMs };
}

async function probeBlockedPublicMethod(method, params = []) {
  const startedAt = performance.now();
  let response;
  try {
    response = await fetch(publicRpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
      redirect: 'error',
    });
  } catch {
    return {
      ok: false,
      status: null,
      rpcErrorCode: null,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }

  const payload = await response.json().catch(() => null);
  const latencyMs = Math.round(performance.now() - startedAt);
  const code = payload?.error?.code;
  const blocked = response.status === 403 || code === -32601 || code === -32604;
  return { ok: blocked, status: response.status, rpcErrorCode: code ?? null, latencyMs };
}

const output = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  expectedChainId,
  publicRpcUrl,
  protectedOriginRedacted: true,
  operatorAttestationRequired: true,
  checks: {},
  ready: false,
};

try {
  const input = await readJson(inputPath, 'Protected origin input');
  const topology = await readJson(topologyPath, 'Four-host topology evidence');
  const protectedOriginUrl = String(input.protectedOriginUrl || '').trim();
  if (!protectedOriginUrl) throw new Error('Protected origin URL is missing from protected runner input');

  let protectedUrl;
  let publicUrl;
  try {
    protectedUrl = new URL(protectedOriginUrl);
    publicUrl = new URL(publicRpcUrl);
  } catch {
    throw new Error('Protected/public RPC URL configuration is invalid');
  }

  const validators = Array.isArray(topology.validators) ? topology.validators : [];
  const validatorHosts = validators.map((item) => String(item.hostFingerprint || '')).filter(Boolean);
  const rpcSentryFingerprint = String(topology.rpcSentry?.hostFingerprint || '');
  const inputSentryFingerprint = String(input.rpcSentryHostFingerprint || '');

  output.protectedOriginFingerprintSha256 = sha256(protectedOriginUrl);
  output.rpcSentryHostFingerprintSha256 = sha256(rpcSentryFingerprint || 'missing');

  output.checks.inputFresh = {
    ok: isFreshTimestamp(input.checkedAt),
    checkedAt: input.checkedAt || null,
    maxAgeHours: 24,
  };
  output.checks.topologyFresh = {
    ok: isFreshTimestamp(topology.checkedAt),
    checkedAt: topology.checkedAt || null,
    maxAgeHours: 24,
  };
  output.checks.fourDistinctValidatorHosts = {
    ok: validators.length === 4
      && validatorHosts.length === 4
      && new Set(validatorHosts).size === 4,
    count: new Set(validatorHosts).size,
    expected: 4,
  };
  output.checks.rpcSentrySeparate = {
    ok: topology.rpcSentry?.separateFromValidators === true
      && sha256Pattern.test(rpcSentryFingerprint)
      && !validatorHosts.includes(rpcSentryFingerprint),
  };
  output.checks.rpcSentryIdentityMatched = {
    ok: sha256Pattern.test(inputSentryFingerprint)
      && inputSentryFingerprint === rpcSentryFingerprint,
  };
  output.checks.originIsNotPublicGateway = {
    ok: protectedUrl.hostname.toLowerCase() !== publicUrl.hostname.toLowerCase(),
  };
  output.checks.cloudflareOriginSecretAttested = {
    ok: input.cloudflareOriginSecretAttested === true,
  };
  output.checks.originPublicBypassBlockedAttested = {
    ok: input.originPublicBypassBlockedAttested === true,
  };
  output.checks.explorerUsesProtectedPathAttested = {
    ok: input.explorerUsesProtectedPathAttested === true,
  };

  const [originChainId, publicChainId] = await Promise.all([
    rpc(protectedOriginUrl, 'eth_chainId', [], 'Protected origin'),
    rpc(publicRpcUrl, 'eth_chainId', [], 'Public gateway'),
  ]);
  output.checks.chainIdentity = {
    ok: originChainId.result === expectedChainId && publicChainId.result === expectedChainId,
    originChainId: originChainId.result,
    publicChainId: publicChainId.result,
    originLatencyMs: originChainId.latencyMs,
    publicLatencyMs: publicChainId.latencyMs,
  };

  const [originBlock, publicBlock] = await Promise.all([
    rpc(protectedOriginUrl, 'eth_blockNumber', [], 'Protected origin'),
    rpc(publicRpcUrl, 'eth_blockNumber', [], 'Public gateway'),
  ]);
  const originHeight = Number.parseInt(originBlock.result, 16);
  const publicHeight = Number.parseInt(publicBlock.result, 16);
  const distanceBlocks = Math.abs(originHeight - publicHeight);
  output.checks.blockHeightAlignment = {
    ok: Number.isFinite(originHeight)
      && Number.isFinite(publicHeight)
      && Number.isFinite(maxBlockDistance)
      && maxBlockDistance >= 0
      && distanceBlocks <= maxBlockDistance,
    originHeight,
    publicHeight,
    distanceBlocks,
    maxDistanceBlocks: maxBlockDistance,
    originLatencyMs: originBlock.latencyMs,
    publicLatencyMs: publicBlock.latencyMs,
  };

  const sharedHeight = Math.min(originHeight, publicHeight);
  if (!Number.isFinite(sharedHeight) || sharedHeight < 0) {
    throw new Error('Unable to select shared comparison height');
  }
  const sharedHeightHex = `0x${sharedHeight.toString(16)}`;
  const [originSharedBlock, publicSharedBlock] = await Promise.all([
    rpc(protectedOriginUrl, 'eth_getBlockByNumber', [sharedHeightHex, false], 'Protected origin'),
    rpc(publicRpcUrl, 'eth_getBlockByNumber', [sharedHeightHex, false], 'Public gateway'),
  ]);
  const originBlockHash = String(originSharedBlock.result?.hash || '').toLowerCase();
  const publicBlockHash = String(publicSharedBlock.result?.hash || '').toLowerCase();
  output.checks.sharedCanonicalBlock = {
    ok: /^0x[a-f0-9]{64}$/.test(originBlockHash)
      && originBlockHash === publicBlockHash,
    height: sharedHeight,
    hashSha256: originBlockHash ? sha256(originBlockHash) : null,
    originLatencyMs: originSharedBlock.latencyMs,
    publicLatencyMs: publicSharedBlock.latencyMs,
  };

  const originValidators = await rpc(
    protectedOriginUrl,
    'qbft_getValidatorsByBlockNumber',
    ['latest'],
    'Protected origin',
  );
  const originValidatorSet = Array.isArray(originValidators.result) ? originValidators.result : [];
  output.checks.privateValidatorSet = {
    ok: originValidatorSet.length === expectedValidatorCount,
    count: originValidatorSet.length,
    expected: expectedValidatorCount,
    setFingerprintSha256: originValidatorSet.length
      ? sha256(originValidatorSet.map((value) => String(value).toLowerCase()).sort().join('\n'))
      : null,
    latencyMs: originValidators.latencyMs,
  };

  const blockedProbe = await probeBlockedPublicMethod('qbft_getValidatorsByBlockNumber', ['latest']);
  output.checks.publicConsensusNamespaceBlocked = blockedProbe;

  output.ready = Object.values(output.checks).every((check) => check.ok === true);
} catch (error) {
  output.error = String(error?.message || 'Protected origin verification failed');
}

console.log(JSON.stringify(output, null, 2));
if (!output.ready) process.exitCode = 1;
