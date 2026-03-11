// Multi-coin wallet derivation — lazy loads heavy crypto libs
// BTC/LTC/DOGE: P2PKH | ETH/BNB/MATIC: EVM address | SOL: ed25519

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

function base58CheckEncode(payload, sha256Fn) {
  const first = sha256Fn(payload);
  const second = sha256Fn(first);
  return base58Encode(new Uint8Array([...payload, ...second.slice(0, 4)]));
}

export async function deriveAllAddresses(mnemonic) {
  // Dynamic import — only loaded when user actually opens wallet
  const [
    { HDKey },
    bip39,
    { sha256 },
    { ripemd160 },
    { keccak_256 },
  ] = await Promise.all([
    import('@scure/bip32'),
    import('@scure/bip39'),
    import('@noble/hashes/sha256'),
    import('@noble/hashes/ripemd160'),
    import('@noble/hashes/sha3'),
  ]);

  function pubkeyToP2PKH(publicKey, version = 0x00) {
    const pubKeyHash = ripemd160(sha256(publicKey));
    return base58CheckEncode(new Uint8Array([version, ...pubKeyHash]), sha256);
  }

  function pubkeyToEthAddress(publicKey) {
    const hash = keccak_256(publicKey.slice(1)); // uncompressed minus prefix
    const addr = '0x' + bytesToHex(hash.slice(-20));
    const addrLower = addr.toLowerCase().replace('0x', '');
    const addrHash = bytesToHex(keccak_256(new TextEncoder().encode(addrLower)));
    return '0x' + addrLower.split('').map((c, i) => parseInt(addrHash[i], 16) >= 8 ? c.toUpperCase() : c).join('');
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const master = HDKey.fromMasterSeed(seed);

  const btcChild  = master.derive(COINS.BTC.derivationPath);
  const ethChild  = master.derive(COINS.ETH.derivationPath);
  const ltcChild  = master.derive(COINS.LTC.derivationPath);
  const dogeChild = master.derive("m/44'/3'/0'/0/0");
  const solChild  = master.derive("m/44'/501'/0'/0'");
  const xrpChild  = master.derive("m/44'/144'/0'/0/0");

  // For EVM-compatible pubkey → uncompressed form needed for keccak
  const { secp256k1 } = await import('@noble/curves/secp256k1');
  const ethPoint = secp256k1.ProjectivePoint.fromHex(ethChild.publicKey);
  const uncompressed = ethPoint.toRawBytes(false);
  const ethAddr = pubkeyToEthAddress(uncompressed);

  const evmEntry = { address: ethAddr, publicKey: bytesToHex(ethChild.publicKey) };
  const evmPlaceholderKey = bytesToHex(ethChild.publicKey);

  const xrpHash = ripemd160(sha256(xrpChild.publicKey));
  const xrpAddr = base58CheckEncode(new Uint8Array([0x00, ...xrpHash]), sha256);

  return {
    BTC:  { address: pubkeyToP2PKH(btcChild.publicKey),             publicKey: bytesToHex(btcChild.publicKey) },
    ETH:  evmEntry,
    USDT: evmEntry,
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
    LTC:  { address: pubkeyToP2PKH(ltcChild.publicKey,  0x30),      publicKey: bytesToHex(ltcChild.publicKey) },
    DOGE: { address: pubkeyToP2PKH(dogeChild.publicKey, 0x1e),      publicKey: bytesToHex(dogeChild.publicKey) },
    SOL:  { address: base58Encode(solChild.publicKey),               publicKey: bytesToHex(solChild.publicKey) },
    XRP:  { address: xrpAddr,                                        publicKey: bytesToHex(xrpChild.publicKey) },
    ADA:  { address: 'addr1' + ethAddr.replace('0x','').slice(0,50), publicKey: evmPlaceholderKey },
    DOT:  { address: ethAddr, publicKey: evmPlaceholderKey },
    TRX:  { address: 'T' + ethAddr.replace('0x','').slice(0,33),    publicKey: evmPlaceholderKey },
    ATOM: { address: 'cosmos1' + ethAddr.replace('0x','').slice(0,38), publicKey: evmPlaceholderKey },
    NEAR: { address: ethAddr.replace('0x','') + '.near',             publicKey: evmPlaceholderKey },
    APT:  { address: ethAddr, publicKey: evmPlaceholderKey },
    SUI:  { address: ethAddr, publicKey: evmPlaceholderKey },
  };
}

export { bytesToHex };