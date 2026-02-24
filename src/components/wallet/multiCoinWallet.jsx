// Multi-coin wallet derivation
// BTC/LTC: P2PKH, ETH: standard Ethereum address
import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { keccak_256 } from '@noble/hashes/sha3';
import { COINS } from './multiCoinApi';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function base58Encode(bytes) {
  let num = BigInt('0x' + bytesToHex(bytes));
  let result = '';
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result = '1' + result;
  return result;
}

function base58CheckEncode(payload) {
  const first = sha256(payload);
  const second = sha256(first);
  const checksum = second.slice(0, 4);
  return base58Encode(new Uint8Array([...payload, ...checksum]));
}

function pubkeyToP2PKH(publicKey, version = 0x00) {
  const pubKeyHash = ripemd160(sha256(publicKey));
  return base58CheckEncode(new Uint8Array([version, ...pubKeyHash]));
}

function pubkeyToEthAddress(publicKey) {
  // publicKey is compressed (33 bytes) — derive uncompressed x,y first
  // For Ethereum we need the uncompressed public key (without 04 prefix) hashed with keccak256
  // We use secp256k1 to get uncompressed key
  const { secp256k1 } = require('@noble/curves/secp256k1');
  const point = secp256k1.ProjectivePoint.fromHex(publicKey);
  const uncompressed = point.toRawBytes(false); // 65 bytes: 04 + x + y
  const withoutPrefix = uncompressed.slice(1); // 64 bytes x+y
  const hash = keccak_256(withoutPrefix);
  const addr = '0x' + bytesToHex(hash.slice(-20));
  return toChecksumAddress(addr);
}

function toChecksumAddress(address) {
  const addr = address.toLowerCase().replace('0x', '');
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(addr)));
  return '0x' + addr.split('').map((c, i) => parseInt(hash[i], 16) >= 8 ? c.toUpperCase() : c).join('');
}

// LTC mainnet version byte = 0x30
function pubkeyToLTCAddress(publicKey) {
  return pubkeyToP2PKH(publicKey, 0x30);
}

export async function deriveAllAddresses(mnemonic) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const master = HDKey.fromMasterSeed(seed);

  const btcChild = master.derive(COINS.BTC.derivationPath);
  const ethChild = master.derive(COINS.ETH.derivationPath);
  const ltcChild = master.derive(COINS.LTC.derivationPath);

  return {
    BTC: {
      address: pubkeyToP2PKH(btcChild.publicKey),
      publicKey: bytesToHex(btcChild.publicKey),
    },
    ETH: {
      address: pubkeyToEthAddress(ethChild.publicKey),
      publicKey: bytesToHex(ethChild.publicKey),
    },
    LTC: {
      address: pubkeyToLTCAddress(ltcChild.publicKey),
      publicKey: bytesToHex(ltcChild.publicKey),
    },
  };
}

export { bytesToHex };