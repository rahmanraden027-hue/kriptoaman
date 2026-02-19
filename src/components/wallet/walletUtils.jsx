import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import CryptoJS from 'crypto-js';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  if (!hex || hex.length % 2 !== 0) return new Uint8Array(0);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function base58Encode(bytes) {
  if (!bytes || bytes.length === 0) return '';
  const hexStr = bytesToHex(bytes);
  if (!hexStr) return '';
  let num = BigInt('0x' + hexStr);
  let result = '';
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result;
  }
  return result;
}

function base58CheckEncode(payload) {
  const first = sha256(payload);
  const second = sha256(first);
  const checksum = second.slice(0, 4);
  const full = new Uint8Array([...payload, ...checksum]);
  return base58Encode(full);
}

export function publicKeyToAddress(publicKey) {
  const sha256Hash = sha256(publicKey);
  const pubKeyHash = ripemd160(sha256Hash);
  const payload = new Uint8Array([0x00, ...pubKeyHash]);
  return base58CheckEncode(payload);
}

export async function generateWallet() {
  const mnemonic = bip39.generateMnemonic(wordlist, 128);
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive("m/44'/0'/0'/0/0");

  if (!child.privateKey || !child.publicKey) throw new Error('Failed to derive keys');

  const privateKey = bytesToHex(child.privateKey);
  const publicKey = bytesToHex(child.publicKey);
  const address = publicKeyToAddress(child.publicKey);

  return { mnemonic, privateKey, publicKey, address };
}

export function encryptData(data, password) {
  return CryptoJS.AES.encrypt(data, password).toString();
}

export function decryptData(encrypted, password) {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, password);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || null;
  } catch {
    return null;
  }
}

export function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

export function verifyPassword(password, passwordHash) {
  return hashPassword(password) === passwordHash;
}

export function saveWallet(walletData) {
  localStorage.setItem('btc_wallet', JSON.stringify(walletData));
}

export function loadWallet() {
  try {
    const data = localStorage.getItem('btc_wallet');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearWallet() {
  localStorage.removeItem('btc_wallet');
}

export function truncateAddress(address, chars = 8) {
  if (!address) return '';
  return address.slice(0, chars) + '...' + address.slice(-chars);
}

export function satoshiToBtc(satoshi) {
  return (satoshi / 100000000).toFixed(8);
}

export function btcToSatoshi(btc) {
  return Math.round(parseFloat(btc) * 100000000);
}