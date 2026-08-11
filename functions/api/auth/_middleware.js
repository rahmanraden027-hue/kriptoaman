import { json, requireBindings } from '../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';

export async function onRequest({ env, next }) {
  try {
    requireBindings(env, ['AUTH_DB']);
    await ensureAuthSchema(env.AUTH_DB);
    return next();
  } catch (error) {
    console.error('Authentication schema initialization failed', error);
    return json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}
