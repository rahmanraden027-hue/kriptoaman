import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tradingDir = path.resolve(__dirname, '..');
const chainDir = path.resolve(tradingDir, '..');
const rpcUrl = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const reportPath = process.env.KAM_DEX_ATTESTATION_OUT || path.join(tradingDir, 'attestation', 'dex-runtime-attestation.json');

const wkamManifest = JSON.parse(fs.readFileSync(path.join(chainDir, 'deployments', 'wkam.json'), 'utf8'));
const dexManifest = JSON.parse(fs.readFileSync(path.join(chainDir, 'deployments', 'dex.mainnet.deployment.json'), 'utf8'));

function runCast(args) {
  return execFileSync('cast', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }).trim();
}

function safeCast(args) {
  try {
    return { ok: true, value: runCast(args), error: null };
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr).trim() : '';
    return { ok: false, value: null, error: stderr || error?.message || String(error) };
  }
}

function normalizeHex(value) {
  if (typeof value !== 'string') return '';
  const clean = value.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) return '';
  return clean;
}

function sha256Hex(hex) {
  if (!hex) return null;
  return crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex');
}

function metadataInfo(hex) {
  if (!hex || hex.length < 4) return { body: hex, metadata: '', metadataBytes: 0, solc: null };
  const declaredBytes = Number.parseInt(hex.slice(-4), 16);
  const totalHexChars = (declaredBytes + 2) * 2;
  if (!Number.isFinite(declaredBytes) || totalHexChars > hex.length || declaredBytes === 0) {
    return { body: hex, metadata: '', metadataBytes: 0, solc: null };
  }
  const start = hex.length - totalHexChars;
  const metadata = hex.slice(start, -4);
  const match = metadata.match(/64736f6c6343([0-9a-f]{6})/);
  const solc = match
    ? `${Number.parseInt(match[1].slice(0, 2), 16)}.${Number.parseInt(match[1].slice(2, 4), 16)}.${Number.parseInt(match[1].slice(4, 6), 16)}`
    : null;
  return { body: hex.slice(0, start), metadata, metadataBytes: declaredBytes + 2, solc };
}

function maskImmutableReferences(hex, references = {}) {
  if (!hex) return { hex: '', maskedSlots: 0, error: null };
  const bytes = Buffer.from(hex, 'hex');
  let maskedSlots = 0;
  try {
    for (const slots of Object.values(references || {})) {
      for (const slot of slots || []) {
        const start = Number(slot.start);
        const length = Number(slot.length);
        if (!Number.isInteger(start) || !Number.isInteger(length) || start < 0 || length < 0 || start + length > bytes.length) {
          throw new Error(`Invalid immutable reference: start=${slot.start} length=${slot.length}`);
        }
        bytes.fill(0, start, start + length);
        maskedSlots += 1;
      }
    }
    return { hex: bytes.toString('hex'), maskedSlots, error: null };
  } catch (error) {
    return { hex, maskedSlots, error: error instanceof Error ? error.message : String(error) };
  }
}

function artifact(contractName) {
  const artifactPath = path.join(tradingDir, 'out', `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) return { artifactPath, data: null, error: `Missing Foundry artifact: ${artifactPath}` };
  try {
    return { artifactPath, data: JSON.parse(fs.readFileSync(artifactPath, 'utf8')), error: null };
  } catch (error) {
    return { artifactPath, data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function attestFoundryRuntime(contractName, address, expectedSolc) {
  const found = artifact(contractName);
  const compiledRaw = normalizeHex(found.data?.deployedBytecode?.object || '');
  const codeResult = safeCast(['code', '--rpc-url', rpcUrl, address]);
  const onchainRaw = normalizeHex(codeResult.value || '');
  const refs = found.data?.deployedBytecode?.immutableReferences || {};
  const compiledMasked = maskImmutableReferences(compiledRaw, refs);
  const onchainMasked = maskImmutableReferences(onchainRaw, refs);
  const compiledMeta = metadataInfo(compiledMasked.hex);
  const onchainMeta = metadataInfo(onchainMasked.hex);
  const sameLength = Boolean(compiledRaw && onchainRaw && compiledRaw.length === onchainRaw.length);
  const normalizedRuntimeMatch = sameLength && compiledMasked.hex === onchainMasked.hex;
  const logicSameLength = Boolean(compiledMeta.body && onchainMeta.body && compiledMeta.body.length === onchainMeta.body.length);
  const logicRuntimeMatch = logicSameLength && compiledMeta.body === onchainMeta.body;

  return {
    contract: contractName,
    address,
    sourceMode: 'FOUNDRY_ARTIFACT_WITH_IMMUTABLE_MASK',
    expectedSolc,
    artifact: path.relative(process.cwd(), found.artifactPath),
    artifactError: found.error,
    rpcCodeError: codeResult.error,
    codePresent: onchainRaw.length > 0,
    runtimeBytesCompiled: compiledRaw.length / 2,
    runtimeBytesOnchain: onchainRaw.length / 2,
    immutableSlotsMasked: compiledMasked.maskedSlots,
    immutableMaskError: compiledMasked.error || onchainMasked.error,
    compiledSolcFromMetadata: compiledMeta.solc,
    onchainSolcFromMetadata: onchainMeta.solc,
    compilerMetadataMatch: compiledMeta.solc === expectedSolc && onchainMeta.solc === expectedSolc,
    compiledMetadataBytes: compiledMeta.metadataBytes,
    onchainMetadataBytes: onchainMeta.metadataBytes,
    compiledNormalizedSha256: sha256Hex(compiledMasked.hex),
    onchainNormalizedSha256: sha256Hex(onchainMasked.hex),
    compiledLogicSha256: sha256Hex(compiledMeta.body),
    onchainLogicSha256: sha256Hex(onchainMeta.body),
    sameLength,
    normalizedRuntimeMatch,
    logicSameLength,
    logicRuntimeMatch,
  };
}

async function attestWKAMExact(address) {
  const sourcePath = path.join(chainDir, 'contracts', 'WKAM.sol');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const solcModule = await import('solc');
  const solc = solcModule.default;
  const compilerVersion = solc.version();

  const input = {
    language: 'Solidity',
    sources: {
      'WKAM.sol': { content: source },
    },
    settings: {
      evmVersion: 'paris',
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['evm.deployedBytecode.object'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors || [];
  const fatal = errors.filter((item) => item.severity === 'error');
  const compiledRaw = normalizeHex(output.contracts?.['WKAM.sol']?.WKAM?.evm?.deployedBytecode?.object || '');
  const codeResult = safeCast(['code', '--rpc-url', rpcUrl, address]);
  const onchainRaw = normalizeHex(codeResult.value || '');
  const compiledMeta = metadataInfo(compiledRaw);
  const onchainMeta = metadataInfo(onchainRaw);
  const exactRuntimeMatch = Boolean(compiledRaw && onchainRaw && compiledRaw === onchainRaw);
  const logicRuntimeMatch = Boolean(compiledMeta.body && onchainMeta.body && compiledMeta.body === onchainMeta.body);

  return {
    contract: 'WKAM',
    address,
    sourceMode: 'ORIGINAL_STANDARD_JSON_INPUT',
    source: path.relative(process.cwd(), sourcePath),
    standardJsonSourceKey: 'WKAM.sol',
    expectedSolc: '0.8.24',
    compilerVersion,
    compilerVersionMatch: compilerVersion.startsWith('0.8.24+'),
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'paris',
    compilerErrors: fatal.map((item) => item.formattedMessage || item.message),
    rpcCodeError: codeResult.error,
    codePresent: onchainRaw.length > 0,
    runtimeBytesCompiled: compiledRaw.length / 2,
    runtimeBytesOnchain: onchainRaw.length / 2,
    compiledSolcFromMetadata: compiledMeta.solc,
    onchainSolcFromMetadata: onchainMeta.solc,
    compilerMetadataMatch: compiledMeta.solc === '0.8.24' && onchainMeta.solc === '0.8.24',
    compiledRuntimeSha256: sha256Hex(compiledRaw),
    onchainRuntimeSha256: sha256Hex(onchainRaw),
    compiledLogicSha256: sha256Hex(compiledMeta.body),
    onchainLogicSha256: sha256Hex(onchainMeta.body),
    exactRuntimeMatch,
    logicRuntimeMatch,
  };
}

function addressEqual(a, b) {
  return Boolean(a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase());
}

function parseBigIntOutput(value) {
  if (!value) return null;
  const token = String(value).trim().split(/\s+/)[0];
  try {
    return BigInt(token);
  } catch {
    return null;
  }
}

function safeReceipt(txHash) {
  const result = safeCast(['rpc', '--rpc-url', rpcUrl, 'eth_getTransactionReceipt', txHash]);
  if (!result.ok) return { transactionHash: txHash, found: false, error: result.error };
  if (!result.value || result.value === 'null') return { transactionHash: txHash, found: false, error: null };
  try {
    const parsed = JSON.parse(result.value);
    return {
      transactionHash: txHash,
      found: true,
      error: null,
      blockNumber: parsed.blockNumber == null ? null : Number(BigInt(parsed.blockNumber)),
      status: parsed.status == null ? null : Number(BigInt(parsed.status)),
      contractAddress: parsed.contractAddress || null,
      from: parsed.from || null,
      to: parsed.to || null,
    };
  } catch (error) {
    return { transactionHash: txHash, found: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function safeContractCall(address, signature) {
  const result = safeCast(['call', '--rpc-url', rpcUrl, address, signature]);
  return { signature, ok: result.ok, value: result.value, error: result.error };
}

const report = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  mode: 'READ_ONLY_MIXED_COMPILER_SOURCE_RUNTIME_ATTESTATION',
  rpc: rpcUrl,
  expectedNetwork: { name: 'KriptoAman Mainnet', chainId: 22028 },
  compilerCandidates: {
    wkam: { solc: '0.8.24', optimizer: true, optimizerRuns: 200, evmVersion: 'paris' },
    factoryRouter: { solc: '0.8.36', optimizer: true, optimizerRuns: 200, evmVersion: 'paris' },
  },
  contracts: [],
  bindings: {},
  deploymentReceipts: {},
  factoryState: {},
  checks: {},
  ready: false,
};

const chainIdResult = safeCast(['chain-id', '--rpc-url', rpcUrl]);
const blockNumberResult = safeCast(['block-number', '--rpc-url', rpcUrl]);
report.observedChainId = chainIdResult.ok ? Number(chainIdResult.value) : null;
report.observedBlockNumber = blockNumberResult.ok ? Number(blockNumberResult.value) : null;
report.rpcErrors = {
  chainId: chainIdResult.error,
  blockNumber: blockNumberResult.error,
};

const wkamAddress = wkamManifest.address;
const factoryAddress = dexManifest.factory.address;
const routerAddress = dexManifest.router.address;

const wkamAttestation = await attestWKAMExact(wkamAddress);
const factoryAttestation = attestFoundryRuntime('KAMFactory', factoryAddress, '0.8.36');
const routerAttestation = attestFoundryRuntime('KAMRouter', routerAddress, '0.8.36');
report.contracts = [wkamAttestation, factoryAttestation, routerAttestation];

const factoryCall = safeContractCall(routerAddress, 'factory()(address)');
const wkamCall = safeContractCall(routerAddress, 'WKAM()(address)');
const pairsCall = safeContractCall(factoryAddress, 'allPairsLength()(uint256)');
const allPairsLength = parseBigIntOutput(pairsCall.value);

report.bindings = {
  routerFactory: factoryCall.value,
  expectedFactory: factoryAddress,
  factoryMatch: factoryCall.ok && addressEqual(factoryCall.value, factoryAddress),
  factoryCallError: factoryCall.error,
  routerWKAM: wkamCall.value,
  expectedWKAM: wkamAddress,
  wkamMatch: wkamCall.ok && addressEqual(wkamCall.value, wkamAddress),
  wkamCallError: wkamCall.error,
};
report.factoryState = {
  allPairsLength: allPairsLength == null ? null : allPairsLength.toString(),
  noPairsYet: pairsCall.ok && allPairsLength === 0n,
  callError: pairsCall.error,
};

report.deploymentReceipts = {
  wkam: safeReceipt(wkamManifest.deploymentTransaction),
  factory: safeReceipt(dexManifest.factory.deploymentTransaction),
  router: safeReceipt(dexManifest.router.deploymentTransaction),
};

const receipts = Object.values(report.deploymentReceipts);
const maxRecordedDeploymentBlock = Math.max(
  Number(wkamManifest.deploymentBlock),
  Number(dexManifest.factory.deploymentBlock),
  Number(dexManifest.router.deploymentBlock),
);

report.checks = {
  chainId: report.observedChainId === 22028,
  currentHeightAtOrBeyondRecordedDeployments:
    Number.isFinite(report.observedBlockNumber) && report.observedBlockNumber >= maxRecordedDeploymentBlock,
  runtimeCodePresent: report.contracts.every((item) => item.codePresent),
  exactSourceRuntimeMatches:
    wkamAttestation.exactRuntimeMatch && factoryAttestation.normalizedRuntimeMatch && routerAttestation.normalizedRuntimeMatch,
  logicRuntimeMatchesIgnoringMetadata: report.contracts.every((item) => item.logicRuntimeMatch),
  compilerVersions:
    wkamAttestation.compilerVersionMatch && wkamAttestation.compilerMetadataMatch &&
    factoryAttestation.compilerMetadataMatch && routerAttestation.compilerMetadataMatch,
  routerBindings: report.bindings.factoryMatch && report.bindings.wkamMatch,
  noPairsYet: report.factoryState.noPairsYet,
  receiptsFound: receipts.every((item) => item.found),
  receiptsSucceeded: receipts.every((item) => item.found && item.status === 1),
  receiptAddresses:
    report.deploymentReceipts.wkam.found && addressEqual(report.deploymentReceipts.wkam.contractAddress, wkamAddress) &&
    report.deploymentReceipts.factory.found && addressEqual(report.deploymentReceipts.factory.contractAddress, factoryAddress) &&
    report.deploymentReceipts.router.found && addressEqual(report.deploymentReceipts.router.contractAddress, routerAddress),
  receiptBlocks:
    report.deploymentReceipts.wkam.found && report.deploymentReceipts.wkam.blockNumber === Number(wkamManifest.deploymentBlock) &&
    report.deploymentReceipts.factory.found && report.deploymentReceipts.factory.blockNumber === Number(dexManifest.factory.deploymentBlock) &&
    report.deploymentReceipts.router.found && report.deploymentReceipts.router.blockNumber === Number(dexManifest.router.deploymentBlock),
};

report.ready = Object.values(report.checks).every(Boolean);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.ready) process.exitCode = 1;
