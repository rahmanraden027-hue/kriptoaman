import { authOrigin, isAdminEmail, requireBindings } from '../../../../server/auth/http.js';
import {
  clearOAuthStateCookie,
  createSessionToken,
  getOAuthState,
  sessionCookie,
} from '../../../../server/auth/session.js';
import { upsertGoogleUser } from '../../../../server/auth/users.js';

function failure(origin, code) {
  const headers = new Headers({
    Location: `${origin}/login?error=${encodeURIComponent(code)}`,
    'Cache-Control': 'no-store',
  });
  headers.append('Set-Cookie', clearOAuthStateCookie());
  return new Response(null, { status: 302, headers });
}

export async function onRequestGet({ request, env }) {
  const origin = authOrigin(request, env);
  try {
    requireBindings(env, ['AUTH_DB', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET']);
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expectedState = getOAuthState(request);
    if (!code || !state || !expectedState || state !== expectedState) {
      return failure(origin, 'invalid_oauth_state');
    }

    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) return failure(origin, 'oauth_token_exchange_failed');
    const tokens = await tokenResponse.json();
    if (!tokens.access_token) return failure(origin, 'oauth_token_missing');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileResponse.ok) return failure(origin, 'oauth_profile_failed');
    const profile = await profileResponse.json();
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      return failure(origin, 'google_email_not_verified');
    }

    const role = isAdminEmail(env, profile.email) ? 'admin' : 'user';
    const user = await upsertGoogleUser(env.AUTH_DB, profile, role);
    const session = await createSessionToken(env.SESSION_SECRET, user);
    const headers = new Headers({
      Location: `${origin}/dashboard`,
      'Cache-Control': 'no-store',
    });
    headers.append('Set-Cookie', clearOAuthStateCookie());
    headers.append('Set-Cookie', sessionCookie(session));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error('Google auth callback failed', error);
    return failure(origin, 'oauth_server_error');
  }
}
