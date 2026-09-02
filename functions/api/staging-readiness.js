function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function enabled(value) {
  return String(value || '').toLowerCase() === 'true';
}

async function fingerprint(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestGet({ env }) {
  // This endpoint deliberately refuses to attest anything unless the deployment
  // is explicitly configured as isolated staging.
  if (env.APP_ENV !== 'staging') {
    return response({ ready: false, error: 'not_staging' }, 404);
  }

  const checks = {
    capacityTestsExplicitlyAllowed: enabled(env.ALLOW_CAPACITY_TESTS),
    writesDisabled: enabled(env.STAGING_WRITES_DISABLED),
    syntheticDataOnly: enabled(env.STAGING_SYNTHETIC_ONLY),
    emailIsolated: ['disabled', 'sink', 'test'].includes(String(env.STAGING_EMAIL_MODE || '').toLowerCase()),
    kycIsolated: ['disabled', 'sandbox'].includes(String(env.STAGING_KYC_MODE || '').toLowerCase()),
    databaseMarkerPresent: Boolean(env.STAGING_DB_MARKER),
    sessionMarkerPresent: Boolean(env.STAGING_SESSION_MARKER),
  };

  const ready = Object.values(checks).every(Boolean);
  const databaseFingerprint = checks.databaseMarkerPresent
    ? await fingerprint(env.STAGING_DB_MARKER)
    : null;
  const sessionFingerprint = checks.sessionMarkerPresent
    ? await fingerprint(env.STAGING_SESSION_MARKER)
    : null;

  return response({
    ready,
    environment: 'staging',
    service: 'kriptoaman-staging-isolation',
    revision: env.DEPLOYMENT_COMMIT || null,
    checks,
    fingerprints: {
      database: databaseFingerprint,
      session: sessionFingerprint,
    },
    checked_at: new Date().toISOString(),
  }, ready ? 200 : 503);
}
