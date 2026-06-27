import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const API_BASE = "https://api.coinbase.com";
const API_PATH = "/api/v3/brokerage";
const KEY_NAME = Deno.env.get("COINBASE_API_KEY_NAME");
const KEY_SECRET = Deno.env.get("COINBASE_API_PRIVATE_KEY");

// ─── SEC1 PEM → PKCS8 DER conversion ───────────────────────────
// Web Crypto only imports PKCS8 private keys; CDP keys are SEC1 (EC PRIVATE KEY).
function pemToPkcs8Der(pem) {
  // Normalize escaped newlines
  const normalized = pem.replace(/\\n/g, '\n');
  const pemBody = normalized
    .replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----/g, '')
    .replace(/-----END [A-Z ]+PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const sec1Der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  // If already PKCS8 (starts with 0x30 and contains ecPublicKey OID at offset 4+),
  // return as-is.
  const ecPubKeyOid = [0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01];
  for (let i = 0; i <= sec1Der.length - ecPubKeyOid.length; i++) {
    if (ecPubKeyOid.every((b, j) => sec1Der[i + j] === b)) {
      return sec1Der; // Already PKCS8
    }
  }

  // Build PKCS8 envelope around the SEC1 content
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const algSeq = new Uint8Array([
    0x30, 0x13,
    ...ecPubKeyOid,
    0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07 // secp256r1
  ]);
  const octetHeader = derLength(0x04, sec1Der.length);
  const inner = concat(version, algSeq, octetHeader, sec1Der);
  const outerHeader = derLength(0x30, inner.length);
  return concat(outerHeader, inner);
}

function derLength(tag, len) {
  if (len < 0x80) return new Uint8Array([tag, len]);
  if (len < 0x100) return new Uint8Array([tag, 0x81, len]);
  return new Uint8Array([tag, 0x82, (len >> 8) & 0xFF, len & 0xFF]);
}

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) { result.set(arr, offset); offset += arr.length; }
  return result;
}

// ─── JWT generation (ES256) ────────────────────────────────────
let cachedKey = null;
async function getSigningKey() {
  if (cachedKey) return cachedKey;
  if (!KEY_NAME || !KEY_SECRET) throw new Error("COINBASE_API_KEY_NAME and COINBASE_API_PRIVATE_KEY must be set");
  const pkcs8Der = pemToPkcs8Der(KEY_SECRET);
  cachedKey = await crypto.subtle.importKey('pkcs8', pkcs8Der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return cachedKey;
}

function base64UrlEncode(bytes) {
  let str = '';
  for (const b of new Uint8Array(bytes)) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateJwt(method, path, baseUrl = API_BASE) {
  const key = await getSigningKey();
  const now = Math.floor(Date.now() / 1000);
  const uri = `${method} ${baseUrl.replace('https://', '')}${path}`;
  const header = { alg: 'ES256', typ: 'JWT', kid: KEY_NAME, nonce: cryptoRandomHex(16) };
  const payload = { iss: 'cdp', sub: KEY_NAME, nbf: now, exp: now + 120, uri };
  const encHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encHeader}.${encPayload}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function cryptoRandomHex(bytes) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Authenticated API call ────────────────────────────────────
async function apiCall(method, resource, queryParams, body) {
  let path = `${API_PATH}${resource}`;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    }
    path += `?${qs.toString()}`;
  }
  const jwt = await generateJwt(method, path);
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  };
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  console.log(`[Coinbase] ${method} ${path}`);
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    console.error(`[Coinbase] Error ${response.status}: ${text}`);
    throw new Error(`Coinbase API error ${response.status}: ${text}`);
  }
  return JSON.parse(text);
}

// ─── Handler ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only admins can execute trades/transfers; all users can view market data
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── Market Data (public, no auth restrictions) ──
    if (action === 'get_product') {
      const { product_id } = body;
      if (!product_id) return Response.json({ error: 'product_id required' }, { status: 400 });
      return Response.json(await apiCall('GET', `/products/${product_id}`));
    }

    if (action === 'list_products') {
      const { product_type, symbol } = body;
      return Response.json(await apiCall('GET', '/products', { product_type, symbol }));
    }

    if (action === 'get_ticker') {
      const { product_id } = body;
      if (!product_id) return Response.json({ error: 'product_id required' }, { status: 400 });
      return Response.json(await apiCall('GET', `/products/${product_id}/ticker`));
    }

    if (action === 'get_book') {
      const { product_id, limit } = body;
      if (!product_id) return Response.json({ error: 'product_id required' }, { status: 400 });
      return Response.json(await apiCall('GET', `/products/${product_id}/product_book`, { limit }));
    }

    if (action === 'get_candles') {
      const { product_id, granularity, start, end } = body;
      if (!product_id) return Response.json({ error: 'product_id required' }, { status: 400 });
      return Response.json(await apiCall('GET', `/products/${product_id}/candles`, { granularity, start, end }));
    }

    if (action === 'get_best_bid_ask') {
      const { product_ids } = body;
      if (!product_ids) return Response.json({ error: 'product_ids required' }, { status: 400 });
      return Response.json(await apiCall('GET', '/best_bid_ask', { product_ids: Array.isArray(product_ids) ? product_ids.join(',') : product_ids }));
    }

    // ── Authenticated actions (admin only for trade/transfer) ──
    const isAdmin = user.role === 'admin';

    if (action === 'get_balance') {
      return Response.json(await apiCall('GET', '/accounts'));
    }

    if (action === 'list_portfolios') {
      return Response.json(await apiCall('GET', '/portfolios'));
    }

    if (action === 'get_portfolio') {
      const { portfolio_uuid } = body;
      if (!portfolio_uuid) return Response.json({ error: 'portfolio_uuid required' }, { status: 400 });
      return Response.json(await apiCall('GET', `/portfolios/${portfolio_uuid}`));
    }

    if (action === 'get_fees') {
      return Response.json(await apiCall('GET', '/transaction_summary'));
    }

    if (action === 'list_orders') {
      const { product_id, order_status, limit, start_date, end_date } = body;
      return Response.json(await apiCall('GET', '/orders/historical/batch', { product_id, order_status, limit, start_date, end_date }));
    }

    if (action === 'get_order') {
      const { order_id } = body;
      if (!order_id) return Response.json({ error: 'order_id required' }, { status: 400 });
      return Response.json(await apiCall('GET', `/orders/historical/${order_id}`));
    }

    if (action === 'list_fills') {
      const { product_id, order_id, limit } = body;
      return Response.json(await apiCall('GET', '/orders/historical/fills', { product_id, order_id, limit }));
    }

    // ── Trade actions (admin only) ──
    if (action === 'preview_order') {
      if (!isAdmin) return Response.json({ error: 'Admin required for trade operations' }, { status: 403 });
      return Response.json(await apiCall('POST', '/orders/preview', null, body.order_config || body));
    }

    if (action === 'create_order') {
      if (!isAdmin) return Response.json({ error: 'Admin required for trade operations' }, { status: 403 });
      return Response.json(await apiCall('POST', '/orders', null, body.order_config || body));
    }

    if (action === 'cancel_orders') {
      if (!isAdmin) return Response.json({ error: 'Admin required for trade operations' }, { status: 403 });
      const { order_ids } = body;
      if (!order_ids) return Response.json({ error: 'order_ids required' }, { status: 400 });
      return Response.json(await apiCall('POST', '/orders/batch_cancel', null, { order_ids: Array.isArray(order_ids) ? order_ids : [order_ids] }));
    }

    // ── Conversion actions (admin only) ──
    if (action === 'convert_quote') {
      if (!isAdmin) return Response.json({ error: 'Admin required for conversion operations' }, { status: 403 });
      const { from_account_id, to_account_id, amount } = body;
      if (!from_account_id || !to_account_id || amount === undefined) return Response.json({ error: 'from_account_id, to_account_id, and amount required' }, { status: 400 });
      return Response.json(await apiCall('POST', '/convert/quote', null, { from_account_id, to_account_id, amount: String(amount) }));
    }

    if (action === 'convert_execute') {
      if (!isAdmin) return Response.json({ error: 'Admin required for conversion operations' }, { status: 403 });
      const { conversion_id, from_account_id, to_account_id, amount } = body;
      if (!conversion_id) return Response.json({ error: 'conversion_id required' }, { status: 400 });
      return Response.json(await apiCall('POST', `/convert/execute/${conversion_id}`, null, { from_account_id, to_account_id, amount: String(amount) }));
    }

    if (action === 'convert_get') {
      const { conversion_id } = body;
      if (!conversion_id) return Response.json({ error: 'conversion_id required' }, { status: 400 });
      return Response.json(await apiCall('GET', `/convert/${conversion_id}`));
    }

    // ── Transfer (admin only) ──
    if (action === 'transfer') {
      if (!isAdmin) return Response.json({ error: 'Admin required for transfer operations' }, { status: 403 });
      const { amount, currency, from, to } = body;
      if (!amount || !currency || !from || !to) return Response.json({ error: 'amount, currency, from, and to required' }, { status: 400 });
      return Response.json(await apiCall('POST', '/portfolios/transfer', null, { amount: String(amount), currency, from, to }));
    }

    // ── Coinbase v2 Accounts ──
    if (action === 'get_accounts_v2') {
      const jwt = await generateJwt('GET', '/v2/accounts');
      console.log('[Coinbase v2] GET /v2/accounts');
      const response = await fetch(`${API_BASE}/v2/accounts`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const text = await response.text();
      if (!response.ok) {
        console.error(`[Coinbase v2] Error ${response.status}: ${text}`);
        throw new Error(`Coinbase v2 API error ${response.status}: ${text}`);
      }
      return Response.json(JSON.parse(text));
    }

    // ── Base SQL API via CDP (read-only onchain data) ──
    if (action === 'run_sql') {
      const { sql } = body;
      if (!sql) return Response.json({ error: 'sql required' }, { status: 400 });
      const cdpKey = Deno.env.get("COINBASE_CDP_API_KEY");
      if (!cdpKey) throw new Error('COINBASE_CDP_API_KEY secret not configured');
      const CDP_URL = 'https://api.cdp.coinbase.com/platform/v2/data/query/run';
      console.log('[CDP SQL] POST query');
      const response = await fetch(CDP_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cdpKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      });
      const text = await response.text();
      if (!response.ok) {
        console.error(`[CDP SQL] Error ${response.status}: ${text}`);
        throw new Error(`CDP SQL API error ${response.status}: ${text}`);
      }
      return Response.json(JSON.parse(text));
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    console.error('[Coinbase] Function error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});