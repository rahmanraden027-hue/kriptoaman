import { json } from '../../../server/auth/http.js';

export async function onRequestGet({ env }) {
  const configured = {
    database: Boolean(env.AUTH_DB),
    session: Boolean(env.SESSION_SECRET),
    apiKey: Boolean(env.DIDIT_API_KEY),
    workflow: Boolean(env.DIDIT_WORKFLOW_ID),
    webhook: Boolean(env.DIDIT_WEBHOOK_SECRET),
  };

  let databaseReachable = false;
  if (configured.database) {
    try {
      const result = await env.AUTH_DB.prepare('SELECT 1 AS ok').first();
      databaseReachable = result?.ok === 1;
    } catch {
      databaseReachable = false;
    }
  }

  const ready = Object.values(configured).every(Boolean) && databaseReachable;
  return json({
    provider: 'didit',
    ready,
    checks: {
      database: databaseReachable,
      session: configured.session,
      api: configured.apiKey,
      workflow: configured.workflow,
      webhook: configured.webhook,
    },
    identityTest: ready ? 'user-action-required' : 'configuration-required',
  }, {
    status: ready ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    },
  });
}
