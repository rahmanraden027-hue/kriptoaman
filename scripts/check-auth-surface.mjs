const ORIGIN = process.env.AUTH_SMOKE_ORIGIN || 'https://kriptoaman.com';

async function fetchWithTimeout(url, init = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`${new URL(url).pathname} exceeded ${timeoutMs}ms health timeout`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function expectHtml(path) {
  const response = await fetchWithTimeout(`${ORIGIN}${path}`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'KriptoAman-Auth-Smoke/1.0',
    },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) throw new Error(`${path} returned unexpected content-type ${type}`);
  return response.status;
}

async function expectForgotPasswordEndpoint() {
  const syntheticEmail = `auth-smoke-${Date.now()}@example.invalid`;
  const response = await fetchWithTimeout(`${ORIGIN}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      Referer: `${ORIGIN}/forgot-password`,
      'User-Agent': 'KriptoAman-Auth-Smoke/1.0',
    },
    body: JSON.stringify({ email: syntheticEmail }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`forgot-password returned HTTP ${response.status}: ${JSON.stringify(payload)}`);
  if (payload?.sent !== true) throw new Error(`forgot-password returned invalid payload: ${JSON.stringify(payload)}`);
  return response.status;
}

const login = await expectHtml('/login');
const forgot = await expectHtml('/forgot-password');
const resetEndpoint = await expectForgotPasswordEndpoint();

console.log(JSON.stringify({
  status: 'healthy',
  origin: ORIGIN,
  login_http: login,
  forgot_page_http: forgot,
  forgot_endpoint_http: resetEndpoint,
  checked_at: new Date().toISOString(),
}));
