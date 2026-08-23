const ORIGIN = process.env.AUTH_SMOKE_ORIGIN || 'https://kriptoaman.com';
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

async function expectHtml(path) {
  const response = await fetch(`${ORIGIN}${path}`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'KriptoAman-Auth-Smoke/1.0',
    },
    redirect: 'follow',
    signal: controller.signal,
  });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) throw new Error(`${path} returned unexpected content-type ${type}`);
  return response.status;
}

async function expectForgotPasswordEndpoint() {
  const syntheticEmail = `auth-smoke-${Date.now()}@invalid.example`;
  const response = await fetch(`${ORIGIN}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      Referer: `${ORIGIN}/forgot-password`,
      'User-Agent': 'KriptoAman-Auth-Smoke/1.0',
    },
    body: JSON.stringify({ email: syntheticEmail }),
    signal: controller.signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`forgot-password returned HTTP ${response.status}: ${JSON.stringify(payload)}`);
  if (payload?.sent !== true) throw new Error(`forgot-password returned invalid payload: ${JSON.stringify(payload)}`);
  return response.status;
}

try {
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
} finally {
  clearTimeout(timeout);
}
