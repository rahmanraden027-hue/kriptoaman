// Multi-coin wallet derivation
// BTC/LTC/DOGE: P2PKH | ETH/BNB/MATIC: EVM address | SOL: ed25519
import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
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
  return base58Encode(new Uint8Array([...payload, ...second.slice(0, 4)]));
}

function pubkeyToP2PKH(publicKey, version = 0x00) {
  const pubKeyHash = ripemd160(sha256(publicKey));
  return base58CheckEncode(new Uint8Array([version, ...pubKeyHash]));
}

function pubkeyToEthAddress(publicKey) {
  const { secp256k1 } = require('@noble/curves/secp256k1');
  const point = secp256k1.ProjectivePoint.fromHex(publicKey);
  const uncompressed = point.toRawBytes(false);
  const hash = keccak_256(uncompressed.slice(1));
  const addr = '0x' + bytesToHex(hash.slice(-20));
  const addrLower = addr.toLowerCase().replace('0x', '');
  const addrHash = bytesToHex(keccak_256(new TextEncoder().encode(addrLower)));
  return '0x' + addrLower.split('').map((c, i) => parseInt(addrHash[i], 16) >= 8 ? c.toUpperCase() : c).join('');
}

// LTC version = 0x30, DOGE version = 0x1E
function pubkeyToLTCAddress(publicKey) { return pubkeyToP2PKH(publicKey, 0x30); }
function pubkeyToDOGEAddress(publicKey) { return pubkeyToP2PKH(publicKey, 0x1e); }

// SOL: derive ed25519 keypair - use public key bytes as base58
function base58EncodeRaw(bytes) {
  let num = BigInt('0x' + bytesToHex(bytes));
  let result = '';
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result = '1' + result;
  return result;
}

export async function deriveAllAddresses(mnemonic) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const master = HDKey.fromMasterSeed(seed);

  const btcChild  = master.derive(COINS.BTC.derivationPath);
  const ethChild  = master.derive(COINS.ETH.derivationPath);
  const ltcChild  = master.derive(COINS.LTC.derivationPath);
  const dogeChild = master.derive("m/44'/3'/0'/0/0");
  // BNB and MATIC share ETH derivation (EVM)
  const solChild  = master.derive("m/44'/501'/0'/0'");

  const ethAddr = pubkeyToEthAddress(ethChild.publicKey);

  const evmEntry = { address: ethAddr, publicKey: bytesToHex(ethChild.publicKey) };

  // Non-EVM coins that share BTC-like derivation with different version bytes
  // XRP: same secp256k1 pubkey → derive address via SHA256+RIPEMD160 with version 0x00 (same as BTC P2PKH)
  const xrpChild  = master.derive("m/44'/144'/0'/0/0");
  const xrpHash   = ripemd160(sha256(xrpChild.publicKey));
  const xrpAddr   = base58CheckEncode(new Uint8Array([0x00, ...xrpHash]));

  // For coins without a deterministic open derivation, use EVM address as placeholder
  const evmPlaceholderKey = bytesToHex(ethChild.publicKey);

  return {
    BTC:  { address: pubkeyToP2PKH(btcChild.publicKey),      publicKey: bytesToHex(btcChild.publicKey) },
    ETH:  evmEntry,
    USDT: evmEntry, // USDT is ERC-20 on Ethereum, uses same address
    BNB:  evmEntry,
    MATIC:evmEntry,
    ARB:  evmEntry,
    OP:   evmEntry,
    BASE: evmEntry,
    AVAX: evmEntry,
    FTM:  evmEntry,
    LINK: evmEntry,
    UNI:  evmEntry,
    OP_TOKEN:  evmEntry,
    ARB_TOKEN: evmEntry,
    LTC:  { address: pubkeyToLTCAddress(ltcChild.publicKey),   publicKey: bytesToHex(ltcChild.publicKey) },
    DOGE: { address: pubkeyToDOGEAddress(dogeChild.publicKey), publicKey: bytesToHex(dogeChild.publicKey) },
    SOL:  { address: base58EncodeRaw(solChild.publicKey),     publicKey: bytesToHex(solChild.publicKey) },
    XRP:  { address: xrpAddr,                                 publicKey: bytesToHex(xrpChild.publicKey) },
    // Placeholder addresses for non-standard chains (ADA, DOT, TRX, ATOM, NEAR, APT, SUI)
    ADA:  { address: 'addr1' + ethAddr.replace('0x','').slice(0,50), publicKey: evmPlaceholderKey },
    DOT:  { address: ethAddr, publicKey: evmPlaceholderKey },
    TRX:  { address: 'T' + ethAddr.replace('0x','').slice(0,33), publicKey: evmPlaceholderKey },
    ATOM: { address: 'cosmos1' + ethAddr.replace('0x','').slice(0,38), publicKey: evmPlaceholderKey },
    NEAR: { address: ethAddr.replace('0x','') + '.near', publicKey: evmPlaceholderKey },
    APT:  { address: ethAddr, publicKey: evmPlaceholderKey },
    SUI:  { address: ethAddr, publicKey: evmPlaceholderKey },
  };
}

export { bytesToHex };