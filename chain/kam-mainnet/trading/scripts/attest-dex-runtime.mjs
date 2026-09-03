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
  return execFileSync('cast', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function normalizeHex(value) {
  if (typeof value !== 'string') throw new Error('Expected hex string');
  const clean = value.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) throw new Error('Invalid hex byte string');
  return clean;
}

function sha256Hex(hex) {
  return crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex');
}

function maskImmutableReferences(hex, references = {}) {
  const bytes = Buffer.from(hex, 'hex');
  let maskedSlots = 0;
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
  return { hex: bytes.toString('hex'), maskedSlots };
}

function artifact(contractName) {
  const artifactPath = path.join(tradingDir, 'out', `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) throw new Error(`Missing Foundry artifact: ${artifactPath}`);
  return { artifactPath, data: JSON.parse(fs.readFileSync(artifactPath, 'utf8')) };
}

function attestRuntime(contractName, address) {
  const { artifactPath, data } = artifact(contractName);
  const compiledRaw = normalizeHex(data?.deployedBytecode?.object || '');
  const onchainRaw = normalizeHex(runCast(['code', '--rpc-url', rpcUrl, address]));
  if (!compiledRaw) throw new Error(`${contractName}: compiled runtime is empty`);
  if (!onchainRaw) throw new Error(`${contractName}: on-chain runtime is empty`);

  const refs = data?.deployedBytecode?.immutableReferences || {};
  const compiled = maskImmutableReferences(compiledRaw, refs);
  const onchain = maskImmutableReferences(onchainRaw, refs);
  const sameLength = compiledRaw.length === onchainRaw.length;
  const match = sameLength && compiled.hex === onchain.hex;

  return {
    contract: contractName,
    address,
    artifact: path.relative(process.cwd(), artifactPath),
    runtimeBytesCompiled: compiledRaw.length / 2,
    runtimeBytesOnchain: onchainRaw.length / 2,
    immutableSlotsMasked: compiled.maskedSlots,
    compiledNormalizedSha256: sha256Hex(compiled.hex),
    onchainNormalizedSha256: sha256Hex(onchain.hex),
    sameLength,
    normalizedRuntimeMatch: match,
  };
}

function addressEqual(a, b) {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function parseBigIntOutput(value) {
  const token = String(value).trim().split(/\s+/)[0];
  return BigInt(token);
}

function receipt(txHash) {
  const raw = runCast(['receipt', '--json', '--rpc-url', rpcUrl, txHash]);
  const parsed = JSON.parse(raw);
  return {
    transactionHash: txHash,
    blockNumber: Number(BigInt(parsed.blockNumber)),
    status: Number(BigInt(parsed.status)),
    contractAddress: parsed.contractAddress,
  };
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: 'READ_ONLY_SOURCE_RUNTIME_ATTESTATION',
  rpc: rpcUrl,
  expectedNetwork: { name: 'KriptoAman Mainnet', chainId: 22028 },
  compiler: { solc: '0.8.24', optimizer: true, optimizerRuns: 200, evmVersion: 'paris' },
  contracts: [],
  bindings: {},
  deploymentReceipts: {},
  factoryState: {},
  checks: {},
  ready: false,
};

let failure = null;
try {
  const observedChainId = Number(runCast(['chain-id', '--rpc-url', rpcUrl]));
  report.observedChainId = observedChainId;
  report.checks.chainId = observedChainId === 22028;

  const wkamAddress = wkamManifest.address;
  const factoryAddress = dexManifest.factory.address;
  const routerAddress = dexManifest.router.address;

  report.contracts.push(attestRuntime('WKAM', wkamAddress));
  report.contracts.push(attestRuntime('KAMFactory', factoryAddress));
  report.contracts.push(attestRuntime('KAMRouter', routerAddress));

  const routerFactory = runCast(['call', '--rpc-url', rpcUrl, routerAddress, 'factory()(address)']);
  const routerWKAM = runCast(['call', '--rpc-url', rpcUrl, routerAddress, 'WKAM()(address)']);
  const allPairsLengthRaw = runCast(['call', '--rpc-url', rpcUrl, factoryAddress, 'allPairsLength()(uint256)']);
  const allPairsLength = parseBigIntOutput(allPairsLengthRaw);

  report.bindings = {
    routerFactory,
    expectedFactory: factoryAddress,
    factoryMatch: addressEqual(routerFactory, factoryAddress),
    routerWKAM,
    expectedWKAM: wkamAddress,
    wkamMatch: addressEqual(routerWKAM, wkamAddress),
  };
  report.factoryState = {
    allPairsLength: allPairsLength.toString(),
    noPairsYet: allPairsLength === 0n,
  };

  report.deploymentReceipts = {
    wkam: receipt(wkamManifest.deploymentTransaction),
    factory: receipt(dexManifest.factory.deploymentTransaction),
    router: receipt(dexManifest.router.deploymentTransaction),
  };

  report.checks.runtimeMatches = report.contracts.every((item) => item.normalizedRuntimeMatch);
  report.checks.routerBindings = report.bindings.factoryMatch && report.bindings.wkamMatch;
  report.checks.noPairsYet = report.factoryState.noPairsYet;
  report.checks.receiptsSucceeded = Object.values(report.deploymentReceipts).every((item) => item.status === 1);
  report.checks.receiptAddresses =
    addressEqual(report.deploymentReceipts.wkam.contractAddress, wkamAddress) &&
    addressEqual(report.deploymentReceipts.factory.contractAddress, factoryAddress) &&
    addressEqual(report.deploymentReceipts.router.contractAddress, routerAddress);
  report.checks.receiptBlocks =
    report.deploymentReceipts.wkam.blockNumber === Number(wkamManifest.deploymentBlock) &&
    report.deploymentReceipts.factory.blockNumber === Number(dexManifest.factory.deploymentBlock) &&
    report.deploymentReceipts.router.blockNumber === Number(dexManifest.router.deploymentBlock);

  report.ready = Object.values(report.checks).every(Boolean);
} catch (error) {
  failure = error;
  report.error = error instanceof Error ? error.message : String(error);
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (failure || !report.ready) {
  process.exitCode = 1;
}
