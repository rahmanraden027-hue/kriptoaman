import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const rpcUrl = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const address = process.env.CONTRACT_ADDRESS;
const artifactPath = process.env.ARTIFACT_PATH;
const label = process.env.CONTRACT_LABEL || artifactPath;

if (!address || !artifactPath) throw new Error('CONTRACT_ADDRESS and ARTIFACT_PATH are required');

function normalizeHex(value) {
  const clean = String(value || '').trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) throw new Error('invalid hex');
  return clean;
}

function hash(hex) {
  return crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex');
}

function stripMetadata(hex) {
  if (hex.length < 4) return { body: hex, metadataBytes: 0, solc: null };
  const declared = Number.parseInt(hex.slice(-4), 16);
  const total = (declared + 2) * 2;
  if (!Number.isFinite(declared) || declared === 0 || total > hex.length) return { body: hex, metadataBytes: 0, solc: null };
  const start = hex.length - total;
  const metadata = hex.slice(start, -4);
  const m = metadata.match(/64736f6c6343([0-9a-f]{6})/);
  const solc = m ? `${parseInt(m[1].slice(0,2),16)}.${parseInt(m[1].slice(2,4),16)}.${parseInt(m[1].slice(4,6),16)}` : null;
  return { body: hex.slice(0, start), metadataBytes: declared + 2, solc };
}

function maskImmutables(hex, refs = {}) {
  const buf = Buffer.from(hex, 'hex');
  for (const slots of Object.values(refs || {})) {
    for (const slot of slots || []) {
      const start = Number(slot.start);
      const length = Number(slot.length);
      if (start < 0 || length < 0 || start + length > buf.length) throw new Error(`immutable range outside runtime: ${start}+${length}`);
      buf.fill(0, start, start + length);
    }
  }
  return buf.toString('hex');
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const compiledRaw = normalizeHex(artifact?.deployedBytecode?.object);
const onchainRaw = normalizeHex(execFileSync('cast', ['code', '--rpc-url', rpcUrl, address], { encoding: 'utf8', timeout: 15000 }));
const refs = artifact?.deployedBytecode?.immutableReferences || {};
const compiled = maskImmutables(compiledRaw, refs);
const onchain = maskImmutables(onchainRaw, refs);
const compiledMeta = stripMetadata(compiled);
const onchainMeta = stripMetadata(onchain);

const result = {
  label,
  address,
  artifactPath,
  immutableSlotCount: Object.values(refs).flat().length,
  compiledBytes: compiledRaw.length / 2,
  onchainBytes: onchainRaw.length / 2,
  compiledSolcMetadata: compiledMeta.solc,
  onchainSolcMetadata: onchainMeta.solc,
  exactRuntimeMatchAfterImmutableMask: compiled === onchain,
  logicMatchIgnoringMetadata: compiledMeta.body === onchainMeta.body,
  compiledRuntimeSha256: hash(compiled),
  onchainRuntimeSha256: hash(onchain),
  compiledLogicSha256: hash(compiledMeta.body),
  onchainLogicSha256: hash(onchainMeta.body),
};

console.log(JSON.stringify(result, null, 2));
if (!result.logicMatchIgnoringMetadata) process.exitCode = 1;
