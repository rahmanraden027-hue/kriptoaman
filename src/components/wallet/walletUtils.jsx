// Wallet utilities using only browser-native APIs (no external crypto deps)

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

async function sha256Bytes(data) {
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(buffer);
}

// Simple mnemonic generation using browser crypto
const BIP39_WORDLIST_SAMPLE = [
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act',
  'action','actor','actress','actual','adapt','add','addict','address','adjust','admit',
  'adult','advance','advice','aerobic','afford','afraid','again','agent','agree','ahead',
  'aim','air','airport','aisle','alarm','album','alcohol','alert','alien','all',
  'alley','allow','almost','alone','alpha','already','also','alter','always','amateur',
  'amazing','among','amount','amused','analyst','anchor','ancient','anger','angle','angry',
  'animal','ankle','announce','annual','another','answer','antenna','antique','anxiety','any',
  'apart','apology','appear','apple','approve','april','arch','arctic','area','arena',
  'argue','arm','armed','armor','army','around','arrange','arrest','arrive','arrow',
  'asset','assist','assume','asthma','athlete','atom','attack','attend','attitude','attract',
  'auction','audit','aunt','author','auto','autumn','average','avocado','avoid','awake',
  'aware','away','awesome','awful','awkward','axis','baby','balance','bamboo','banana',
  'banner','barely','bargain','barrel','base','basic','basket','battle','beach','bean',
  'beauty','because','become','beef','before','begin','behave','behind','believe','below',
  'belt','bench','benefit','best','betray','better','between','beyond','bicycle','bid',
  'bike','bind','biology','bird','birth','bitter','black','blade','blame','blanket',
  'blast','bleak','bless','blind','blood','blossom','blouse','blue','blur','blush',
  'board','boat','body','boil','bomb','bone','book','boost','border','boring',
  'borrow','boss','bottom','bounce','box','boy','bracket','brain','brand','brave',
  'bread','breeze','brick','bridge','brief','bright','bring','brisk','broccoli','broken',
  'bronze','broom','brother','brown','brush','bubble','buddy','budget','buffalo','build',
  'bulb','bulk','bullet','bundle','bunker','burden','burger','burst','bus','business',
  'busy','butter','buyer','buzz','cabbage','cabin','cable','cactus','cage','cake',
  'call','calm','camera','camp','canal','cancel','candy','cannon','canvas','canyon',
  'capable','capital','captain','car','carbon','card','cargo','carpet','carry','cart',
  'case','cash','castle','casual','cat','catalog','catch','category','cattle','caught',
  'cause','caution','cave','ceiling','celery','cement','census','century','cereal','certain',
  'chair','chalk','champion','change','chaos','chapter','charge','chase','chat','cheap',
  'check','cheese','chef','cherry','chest','chicken','chief','child','chimney','choice',
  'choose','chronic','chuckle','chunk','cigar','cinnamon','circle','citizen','city','civil',
  'claim','clap','clarify','claw','clay','clean','clerk','clever','click','client',
  'cliff','climb','clinic','clip','clock','clog','close','cloth','cloud','clown',
  'club','clump','cluster','clutch','coach','coast','coconut','code','coffee','coil',
  'coin','collect','color','column','combine','come','comfort','comic','common','company',
  'concert','conduct','confirm','congress','connect','consider','control','convince','cook','cool',
  'copper','copy','coral','core','corn','correct','cost','cotton','couch','country',
  'couple','course','cousin','cover','coyote','crack','cradle','craft','cram','crane',
  'crash','crater','crawl','crazy','cream','credit','creek','crew','cricket','crime',
  'crisp','critic','cross','crouch','crowd','crucial','cruel','cruise','crumble','crunch',
  'crush','cry','crystal','cube','culture','cup','cupboard','curious','current','curtain',
  'curve','cushion','custom','cute','cycle','dad','damage','damp','dance','danger',
];

function generateMnemonicWords(count = 12) {
  const words = [];
  const array = new Uint32Array(count);
  crypto.getRandomValues(array);
  for (let i = 0; i < count; i++) {
    words.push(BIP39_WORDLIST_SAMPLE[array[i] % BIP39_WORDLIST_SAMPLE.length]);
  }
  return words.join(' ');
}

async function deriveKeyFromMnemonic(mnemonic) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(mnemonic), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode('mnemonic'), iterations: 2048, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return new Uint8Array(bits);
}

export async function generateWallet() {
  const mnemonic = generateMnemonicWords(12);
  const seed = await deriveKeyFromMnemonic(mnemonic);
  const privateKey = bytesToHex(seed);
  
  // Derive a deterministic public address from private key seed
  const pubKeyHash = await sha256Bytes(seed);
  const address = '0x' + bytesToHex(pubKeyHash.slice(0, 20));

  return { mnemonic, privateKey, publicKey: bytesToHex(pubKeyHash), address };
}

// AES-GCM encryption using Web Crypto API
export async function encryptData(data, password) {
  try {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(data));
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, 16);
    result.set(new Uint8Array(encrypted), 28);
    return btoa(String.fromCharCode(...result));
  } catch {
    return null;
  }
}

export async function decryptData(encryptedB64, password) {
  try {
    const enc = new TextEncoder();
    const raw = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    const salt = raw.slice(0, 16);
    const iv = raw.slice(16, 28);
    const data = raw.slice(28);
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  const enc = new TextEncoder();
  const hash = await sha256Bytes(enc.encode(password));
  return bytesToHex(hash);
}

export async function verifyPassword(password, passwordHash) {
  return (await hashPassword(password)) === passwordHash;
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