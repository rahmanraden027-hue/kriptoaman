import { clearSessionCookie } from '../../../server/auth/session.js';
import { requireSameOrigin } from '../../../server/auth/http.js';

export function onRequestPost({ request, env }) {
  try {
    requireSameOrigin(request, env);
  } catch {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': clearSessionCookie(),
      'Cache-Control': 'no-store',
    },
  });
}
