const encoder = new TextEncoder();

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message))));
}

function constantTimeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

export async function createDiditSession({ apiKey, workflowId, userId, callback }) {
  const response = await fetch('https://verification.didit.me/v3/session/', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      vendor_data: userId,
      callback,
      callback_method: 'both',
      metadata: { platform: 'kriptoaman' },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url || !data.session_id) {
    const error = new Error('Didit session creation failed');
    error.status = response.status || 502;
    throw error;
  }
  return data;
}

export async function verifyDiditWebhook(request, secret, rawBody) {
  const timestampHeader = request.headers.get('X-Timestamp');
  const signature = request.headers.get('X-Signature');
  const timestamp = Number(timestampHeader);
  if (!timestampHeader || !signature || !Number.isFinite(timestamp)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;
  const expected = await hmacSha256(secret, rawBody);
  return constantTimeEqual(expected.toLowerCase(), signature.toLowerCase());
}

export function diditStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'approved') return 'approved';
  if (normalized === 'declined') return 'rejected';
  if (['expired', 'abandoned', 'kyc expired'].includes(normalized)) return 'none';
  return 'pending';
}
