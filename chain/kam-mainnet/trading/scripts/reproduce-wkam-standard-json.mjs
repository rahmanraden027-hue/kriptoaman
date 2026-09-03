import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const RPC = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const ADDRESS = '0x0d8848CE88BB09a81a4248Efdd574d50B98b544A';
const source = fs.readFileSync('../contracts/WKAM.sol', 'utf8');

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
        '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
      },
    },
  },
};

const solc = await import('solc');
const output = JSON.parse(solc.default.compile(JSON.stringify(input)));
if (output.errors) {
  const fatal = output.errors.filter((item) => item.severity === 'error');
  for (const item of output.errors) console.error(item.formattedMessage);
  if (fatal.length) process.exit(1);
}

const contract = output.contracts?.['WKAM.sol']?.WKAM;
if (!contract) throw new Error('WKAM compiler output not found');

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/^0x/, '');
}
function sha256(hex) {
  return crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex');
}
function metadataInfo(hex) {
  if (!hex || hex.length < 4) return { solc: null, metadataBytes: 0, body: hex };
  const n = Number.parseInt(hex.slice(-4), 16);
  const total = (n + 2) * 2;
  if (!Number.isFinite(n) || n === 0 || total > hex.length) return { solc: null, metadataBytes: 0, body: hex };
  const start = hex.length - total;
  const metadata = hex.slice(start, -4);
  const match = metadata.match(/64736f6c6343([0-9a-f]{6})/);
  const version = match
    ? `${parseInt(match[1].slice(0, 2), 16)}.${parseInt(match[1].slice(2, 4), 16)}.${parseInt(match[1].slice(4, 6), 16)}`
    : null;
  return { solc: version, metadataBytes: n + 2, body: hex.slice(0, start) };
}

const compiled = normalize(contract.evm.deployedBytecode.object);
const onchain = normalize(execFileSync('cast', ['code', '--rpc-url', RPC, ADDRESS], { encoding: 'utf8', timeout: 15000 }));
const cm = metadataInfo(compiled);
const om = metadataInfo(onchain);

const result = {
  mode: 'WKAM_DEPLOYMENT_INPUT_REPRODUCTION',
  address: ADDRESS,
  sourceFile: '../contracts/WKAM.sol',
  standardJsonSourceKey: 'WKAM.sol',
  compilerVersion: solc.default.version(),
  optimizer: { enabled: true, runs: 200 },
  evmVersion: 'paris',
  compiledBytes: compiled.length / 2,
  onchainBytes: onchain.length / 2,
  compiledSolcMetadata: cm.solc,
  onchainSolcMetadata: om.solc,
  exactRuntimeMatch: compiled === onchain,
  logicMatchIgnoringMetadata: cm.body === om.body,
  compiledRuntimeSha256: sha256(compiled),
  onchainRuntimeSha256: sha256(onchain),
  compiledLogicSha256: sha256(cm.body),
  onchainLogicSha256: sha256(om.body),
};

console.log(JSON.stringify(result, null, 2));
if (!result.exactRuntimeMatch) process.exitCode = 1;
