import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const sourcePath = process.argv[2];
if (!sourcePath) {
  throw new Error('Usage: node build-production-validator-fingerprint.mjs <validator-addresses.txt>');
}

const addressPattern = /^0x[0-9a-f]{40}$/i;
const addresses = (await readFile(sourcePath, 'utf8'))
  .split(/\r?\n/)
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)
  .sort();

if (addresses.length !== 4) throw new Error(`Expected exactly 4 validator addresses, got ${addresses.length}`);
if (!addresses.every((address) => addressPattern.test(address))) throw new Error('One or more validator addresses are invalid');
if (new Set(addresses).size !== 4) throw new Error('Production validator addresses must be unique');

const fingerprint = createHash('sha256').update(addresses.join('\n')).digest('hex');
process.stdout.write(`${fingerprint}\n`);
