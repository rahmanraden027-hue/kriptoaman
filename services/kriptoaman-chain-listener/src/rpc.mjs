const strip0x = (value = '') => String(value).replace(/^0x/i, '');

export const hexToNumber = (value) => {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) return null;
  const parsed = Number.parseInt(value.slice(2), 16);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

export const normalizeAddress = (value) => {
  const raw = strip0x(value).toLowerCase();
  return /^[0-9a-f]{40}$/.test(raw) ? `0x${raw}` : null;
};

export const decodeAbiString = (hex) => {
  const raw = strip0x(hex);
  if (!raw || raw.length < 64 || !/^[0-9a-f]+$/i.test(raw)) return null;

  try {
    if (raw.length === 64) {
      const bytes = Buffer.from(raw, 'hex');
      const zero = bytes.indexOf(0);
      return bytes.subarray(0, zero === -1 ? bytes.length : zero).toString('utf8').trim() || null;
    }

    const offset = Number.parseInt(raw.slice(0, 64), 16) * 2;
    if (!Number.isSafeInteger(offset) || offset + 64 > raw.length) return null;
    const length = Number.parseInt(raw.slice(offset, offset + 64), 16);
    if (!Number.isSafeInteger(length) || length < 0) return null;
    const start = offset + 64;
    const end = start + length * 2;
    if (end > raw.length) return null;
    return Buffer.from(raw.slice(start, end), 'hex').toString('utf8').replace(/\0+$/g, '').trim() || null;
  } catch {
    return null;
  }
};

export const decodeUint = (hex) => {
  const raw = strip0x(hex);
  if (!raw || !/^[0-9a-f]+$/i.test(raw)) return null;
  try {
    return BigInt(`0x${raw}`).toString(10);
  } catch {
    return null;
  }
};

export class JsonRpcClient {
  constructor({ url, timeoutMs = 8000 }) {
    this.url = url;
    this.timeoutMs = timeoutMs;
    this.id = 0;
  }

  async call(method, params = []) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: ++this.id, method, params }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
      const payload = await response.json();
      if (payload?.error) throw new Error(`RPC ${method}: ${payload.error.message || 'unknown error'}`);
      return payload?.result;
    } finally {
      clearTimeout(timer);
    }
  }

  async callBatch(calls) {
    if (!Array.isArray(calls) || calls.length === 0) return [];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const requests = calls.map(({ method, params = [] }) => ({
      jsonrpc: '2.0',
      id: ++this.id,
      method,
      params,
    }));
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(requests),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`RPC batch HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error('RPC batch response is not an array');
      const byId = new Map(payload.map((item) => [item?.id, item]));
      return requests.map((request) => {
        const item = byId.get(request.id);
        if (!item) return { ok: false, error: 'missing_response', result: null };
        if (item.error) return { ok: false, error: item.error.message || 'rpc_error', result: null };
        return { ok: true, error: null, result: item.result };
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async receipts(hashes, batchSize = 100) {
    const results = [];
    for (let i = 0; i < hashes.length; i += batchSize) {
      const chunk = hashes.slice(i, i + batchSize);
      const batch = await this.callBatch(chunk.map((hash) => ({ method: 'eth_getTransactionReceipt', params: [hash] })));
      results.push(...batch.map((item) => item.ok ? item.result : null));
    }
    return results;
  }

  chainId() { return this.call('eth_chainId'); }
  blockNumber() { return this.call('eth_blockNumber').then(hexToNumber); }
  blockByNumber(number, full = true) {
    return this.call('eth_getBlockByNumber', [`0x${number.toString(16)}`, full]);
  }
  receipt(hash) { return this.call('eth_getTransactionReceipt', [hash]); }
  code(address) { return this.call('eth_getCode', [address, 'latest']); }
  ethCall(to, data) { return this.call('eth_call', [{ to, data }, 'latest']); }

  async erc20Metadata(address) {
    const selectors = {
      name: '0x06fdde03',
      symbol: '0x95d89b41',
      decimals: '0x313ce567',
      totalSupply: '0x18160ddd',
    };
    const result = {};
    await Promise.all(Object.entries(selectors).map(async ([key, selector]) => {
      try {
        const value = await this.ethCall(address, selector);
        if (key === 'name' || key === 'symbol') result[key] = decodeAbiString(value);
        else result[key] = decodeUint(value);
      } catch {
        result[key] = null;
      }
    }));
    const decimals = result.decimals == null ? null : Number(result.decimals);
    return {
      name: result.name,
      symbol: result.symbol,
      decimals: Number.isInteger(decimals) && decimals >= 0 && decimals <= 255 ? decimals : null,
      totalSupply: result.totalSupply,
      isTokenLike: Boolean(result.symbol && result.decimals != null && result.totalSupply != null),
    };
  }
}
