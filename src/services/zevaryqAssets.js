import { ZEVARYQ } from '@/theme/zevaryqWallet';
import { resolveZevaryqTokenIcon } from '@/services/zevaryqTokenIcons';

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

function formatUnits(rawValue, decimals) {
  const normalizedRaw = String(rawValue ?? '').trim();
  const normalizedDecimals = Number(decimals);
  if (!/^\d+$/.test(normalizedRaw)) throw new Error('Explorer returned a malformed token balance.');
  if (!Number.isInteger(normalizedDecimals) || normalizedDecimals < 0 || normalizedDecimals > 36) {
    throw new Error('Explorer returned invalid token decimals.');
  }
  const value = BigInt(normalizedRaw);
  if (normalizedDecimals === 0) return value.toString();
  const base = 10n ** BigInt(normalizedDecimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(normalizedDecimals, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function normalizeTokenBalance(entry) {
  const token = entry?.token || {};
  const contractAddress = String(token.address_hash || token.address || token.contract_address_hash || '').trim();
  const symbol = String(token.symbol || '').trim();
  const name = String(token.name || symbol || 'Token').trim();
  const type = String(token.type || 'ERC-20').trim();
  const decimals = Number(token.decimals ?? 0);
  const raw = String(entry?.value ?? entry?.balance ?? '').trim();

  if (!EVM_ADDRESS.test(contractAddress) || !symbol || !/^\d+$/.test(raw)) return null;

  let balance;
  try {
    balance = formatUnits(raw, decimals);
  } catch {
    return null;
  }
  if (BigInt(raw) === 0n) return null;

  return {
    contractAddress,
    symbol,
    name,
    type,
    decimals,
    balanceRaw: raw,
    balance,
    iconUrl: resolveZevaryqTokenIcon(contractAddress, token.icon_url),
  };
}

export async function fetchZevaryqTokenAssets(address) {
  if (!EVM_ADDRESS.test(String(address || ''))) throw new Error('Invalid EVM address.');

  const response = await fetch(
    `${ZEVARYQ.explorer}/api/v2/addresses/${address}/token-balances`,
    { headers: { Accept: 'application/json' }, cache: 'no-store' }
  );
  if (!response.ok) throw new Error(`Explorer token balances HTTP ${response.status}`);

  const payload = await response.json();
  const entries = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : null;
  if (!entries) throw new Error('Explorer token balances response is malformed.');

  const unique = new Map();
  for (const entry of entries) {
    const asset = normalizeTokenBalance(entry);
    if (!asset) continue;
    unique.set(asset.contractAddress.toLowerCase(), asset);
  }

  return Array.from(unique.values()).sort((a, b) =>
    a.symbol.localeCompare(b.symbol, 'en', { sensitivity: 'base' })
  );
}
