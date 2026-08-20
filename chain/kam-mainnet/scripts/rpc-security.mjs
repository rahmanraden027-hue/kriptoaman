const BLOCKED_HTTP_STATUSES = new Set([401, 403, 404]);

export function isAdminRpcBlocked(httpStatus, payload) {
  if (BLOCKED_HTTP_STATUSES.has(httpStatus)) return true;
  if (httpStatus < 200 || httpStatus >= 300) return false;

  const error = payload?.error;
  if (!error) return false;

  const message = String(error.message || '').toLowerCase();
  return Number(error.code) === -32601
    || message.includes('method not found')
    || message.includes('method not enabled')
    || message.includes('method is not enabled')
    || message.includes('unsupported method');
}
