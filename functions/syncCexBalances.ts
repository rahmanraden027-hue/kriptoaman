import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import CryptoJS from 'npm:crypto-js@4.2.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { connection_id } = await req.json();

  // Fetch the connection record (user-scoped, so only their own)
  const connections = await base44.entities.CexConnection.filter({ id: connection_id });
  const conn = connections[0];
  if (!conn) return Response.json({ error: 'Connection not found' }, { status: 404 });

  const { exchange, api_key, api_secret, api_passphrase } = conn;

  let balances = {};
  let errorMsg = null;

  try {
    if (exchange === 'binance') {
      balances = await fetchBinance(api_key, api_secret);
    } else if (exchange === 'bybit') {
      balances = await fetchBybit(api_key, api_secret);
    } else if (exchange === 'okx') {
      balances = await fetchOKX(api_key, api_secret, api_passphrase);
    } else if (exchange === 'kucoin') {
      balances = await fetchKuCoin(api_key, api_secret, api_passphrase);
    } else if (exchange === 'kraken') {
      balances = await fetchKraken(api_key, api_secret);
    } else if (exchange === 'coinbase') {
      balances = await fetchCoinbase(api_key, api_secret);
    }

    await base44.entities.CexConnection.update(connection_id, {
      last_balances: JSON.stringify(balances),
      last_synced: new Date().toISOString(),
      status: 'active',
      error_message: null,
    });

    return Response.json({ success: true, balances });
  } catch (err) {
    errorMsg = err.message;
    await base44.entities.CexConnection.update(connection_id, {
      status: 'error',
      error_message: errorMsg,
    });
    return Response.json({ error: errorMsg }, { status: 400 });
  }
});

// ── Binance ───────────────────────────────────────────────────────────────────
async function fetchBinance(apiKey, apiSecret) {
  const ts = Date.now();
  const query = `timestamp=${ts}`;
  const sig = CryptoJS.HmacSHA256(query, apiSecret).toString(CryptoJS.enc.Hex);
  const res = await fetch(`https://api.binance.com/api/v3/account?${query}&signature=${sig}`, {
    headers: { 'X-MBX-APIKEY': apiKey },
  });
  if (!res.ok) throw new Error(`Binance: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const out = {};
  for (const b of data.balances) {
    const total = parseFloat(b.free) + parseFloat(b.locked);
    if (total > 0) out[b.asset] = total;
  }
  return out;
}

// ── Bybit ─────────────────────────────────────────────────────────────────────
async function fetchBybit(apiKey, apiSecret) {
  const ts = Date.now().toString();
  const recvWindow = '5000';
  const params = `api_key=${apiKey}&recv_window=${recvWindow}&timestamp=${ts}`;
  const sig = CryptoJS.HmacSHA256(params, apiSecret).toString(CryptoJS.enc.Hex);
  const res = await fetch(`https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED&${params}&sign=${sig}`, {
    headers: { 'X-BAPI-API-KEY': apiKey, 'X-BAPI-TIMESTAMP': ts, 'X-BAPI-RECV-WINDOW': recvWindow, 'X-BAPI-SIGN': sig },
  });
  if (!res.ok) throw new Error(`Bybit: ${res.status}`);
  const data = await res.json();
  const out = {};
  for (const acct of (data.result?.list || [])) {
    for (const coin of (acct.coin || [])) {
      const total = parseFloat(coin.walletBalance || 0);
      if (total > 0) out[coin.coin] = total;
    }
  }
  return out;
}

// ── OKX ───────────────────────────────────────────────────────────────────────
async function fetchOKX(apiKey, apiSecret, passphrase) {
  const ts = new Date().toISOString();
  const method = 'GET';
  const path = '/api/v5/account/balance';
  const sign = CryptoJS.HmacSHA256(ts + method + path, apiSecret).toString(CryptoJS.enc.Base64);
  const res = await fetch(`https://www.okx.com${path}`, {
    headers: {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': ts,
      'OK-ACCESS-PASSPHRASE': passphrase || '',
    },
  });
  if (!res.ok) throw new Error(`OKX: ${res.status}`);
  const data = await res.json();
  const out = {};
  for (const detail of (data.data?.[0]?.details || [])) {
    const total = parseFloat(detail.cashBal || 0);
    if (total > 0) out[detail.ccy] = total;
  }
  return out;
}

// ── KuCoin ────────────────────────────────────────────────────────────────────
async function fetchKuCoin(apiKey, apiSecret, passphrase) {
  const ts = Date.now().toString();
  const method = 'GET';
  const endpoint = '/api/v1/accounts';
  const strToSign = ts + method + endpoint;
  const sig = CryptoJS.HmacSHA256(strToSign, apiSecret).toString(CryptoJS.enc.Base64);
  const passphraseSign = CryptoJS.HmacSHA256(passphrase || '', apiSecret).toString(CryptoJS.enc.Base64);
  const res = await fetch(`https://api.kucoin.com${endpoint}`, {
    headers: {
      'KC-API-KEY': apiKey,
      'KC-API-SIGN': sig,
      'KC-API-TIMESTAMP': ts,
      'KC-API-PASSPHRASE': passphraseSign,
      'KC-API-KEY-VERSION': '2',
    },
  });
  if (!res.ok) throw new Error(`KuCoin: ${res.status}`);
  const data = await res.json();
  const out = {};
  for (const acct of (data.data || [])) {
    if (acct.type !== 'trade') continue;
    const total = parseFloat(acct.balance);
    if (total > 0) out[acct.currency] = (out[acct.currency] || 0) + total;
  }
  return out;
}

// ── Kraken ────────────────────────────────────────────────────────────────────
async function fetchKraken(apiKey, apiSecret) {
  const nonce = Date.now().toString();
  const path = '/0/private/Balance';
  const body = `nonce=${nonce}`;
  const secretBuf = Uint8Array.from(atob(apiSecret), c => c.charCodeAt(0));
  const msgBuf = new TextEncoder().encode(nonce + body);
  const pathBuf = new TextEncoder().encode(path);
  const hash = await crypto.subtle.digest('SHA-256', msgBuf);
  const combined = new Uint8Array(pathBuf.length + hash.byteLength);
  combined.set(pathBuf); combined.set(new Uint8Array(hash), pathBuf.length);
  const key = await crypto.subtle.importKey('raw', secretBuf, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, combined);
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  const res = await fetch(`https://api.kraken.com${path}`, {
    method: 'POST',
    headers: { 'API-Key': apiKey, 'API-Sign': sig, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Kraken: ${res.status}`);
  const data = await res.json();
  if (data.error?.length) throw new Error(`Kraken: ${data.error[0]}`);
  const out = {};
  for (const [asset, bal] of Object.entries(data.result || {})) {
    const total = parseFloat(bal);
    // Normalize Kraken asset names (XXBT -> BTC, XETH -> ETH, etc.)
    const sym = asset.replace(/^X/, '').replace(/^Z/, '').replace('XBT', 'BTC');
    if (total > 0) out[sym] = total;
  }
  return out;
}

// ── Coinbase (Advanced Trade) ─────────────────────────────────────────────────
async function fetchCoinbase(apiKey, apiSecret) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const method = 'GET';
  const path = '/api/v3/brokerage/accounts';
  const msg = ts + method + path;
  const sig = CryptoJS.HmacSHA256(msg, apiSecret).toString(CryptoJS.enc.Hex);
  const res = await fetch(`https://api.coinbase.com${path}`, {
    headers: {
      'CB-ACCESS-KEY': apiKey,
      'CB-ACCESS-SIGN': sig,
      'CB-ACCESS-TIMESTAMP': ts,
    },
  });
  if (!res.ok) throw new Error(`Coinbase: ${res.status}`);
  const data = await res.json();
  const out = {};
  for (const acct of (data.accounts || [])) {
    const total = parseFloat(acct.available_balance?.value || 0);
    const sym = acct.currency;
    if (total > 0 && sym) out[sym] = (out[sym] || 0) + total;
  }
  return out;
}