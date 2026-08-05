/**
 * errorHandler — centralized error classification, logging & user-friendly messages.
 * Built on top of the existing crashAnalytics module.
 */
import { reportError } from '@/components/utils/crashAnalytics';

export function classifyError(err) {
  const status = err?.status || err?.response?.status;
  const message = err?.message || String(err);
  return {
    status,
    message,
    isAuth: status === 401 || status === 403,
    isNetwork: status === 0 || /network|failed to fetch|ERR_NETWORK/i.test(message),
    isValidation: status === 400 || status === 422,
    isNotFound: status === 404,
    isRateLimit: status === 429,
    isServer: status >= 500,
  };
}

const FRIENDLY = {
  auth: 'Sesi Anda berakhir. Silakan masuk kembali.',
  network: 'Koneksi terputus. Periksa internet Anda lalu coba lagi.',
  validation: 'Data tidak valid. Periksa kembali input Anda.',
  notFound: 'Data tidak ditemukan.',
  rateLimit: 'Terlalu banyak permintaan. Coba sebentar lagi.',
  server: 'Server sedang bermasalah. Coba lagi nanti.',
  default: 'Terjadi kesalahan. Silakan coba lagi.',
};

export function getUserMessage(err) {
  const c = classifyError(err);
  if (c.isAuth) return FRIENDLY.auth;
  if (c.isNetwork) return FRIENDLY.network;
  if (c.isValidation) return FRIENDLY.validation;
  if (c.isNotFound) return FRIENDLY.notFound;
  if (c.isRateLimit) return FRIENDLY.rateLimit;
  if (c.isServer) return FRIENDLY.server;
  return c.message || FRIENDLY.default;
}

/** Log an error through the centralized crash analytics pipeline. */
export function logError(err, context = {}) {
  reportError(err, context);
}

/** Normalize an API error into a structured result (does not throw). */
export function handleApiError(err, context = {}) {
  logError(err, context);
  return { ok: false, error: err, message: getUserMessage(err), ...classifyError(err) };
}