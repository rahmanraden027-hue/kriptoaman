import { authOrigin, json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { checkRateLimit } from '../../../server/auth/rateLimit.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { getUserById, updateUserProfile } from '../../../server/auth/users.js';
import { createDiditSession } from '../../../server/kyc/didit.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'DIDIT_API_KEY', 'DIDIT_WORKFLOW_ID']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session) return json({ error: 'Authentication required' }, { status: 401 });
    const user = await getUserById(env.AUTH_DB, session.sub);
    if (!user) return json({ error: 'Authentication required' }, { status: 401 });
    if (!user.email_verified) return json({ error: 'Verify your email before KYC' }, { status: 403 });
    if (user.kycStatus === 'approved') return json({ status: 'approved' });

    const allowed = await checkRateLimit(env.AUTH_DB, request, 'kyc-start', user.id, 3, 10 * 60);
    if (!allowed) return json({ error: 'Too many identity verification attempts. Try again later.' }, { status: 429 });

    const didit = await createDiditSession({
      apiKey: env.DIDIT_API_KEY,
      workflowId: env.DIDIT_WORKFLOW_ID,
      userId: user.id,
      callback: `${authOrigin(request, env)}/KYC`,
    });

    await updateUserProfile(env.AUTH_DB, user.id, {
      kycStatus: 'pending',
      kycData: {
        provider: 'didit',
        sessionId: didit.session_id,
        workflowId: didit.workflow_id || env.DIDIT_WORKFLOW_ID,
        providerStatus: didit.status || 'Not Started',
        startedAt: new Date().toISOString(),
      },
    });

    return json({ url: didit.url, status: 'pending' });
  } catch (error) {
    console.error('KYC start failed', error);
    return json({ error: 'Unable to start identity verification' }, { status: error.status || 503 });
  }
}
