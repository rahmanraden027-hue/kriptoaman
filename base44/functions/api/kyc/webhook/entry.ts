import { json, requireBindings } from '../../../server/auth/http.js';
import { getUserById, updateUserProfile } from '../../../server/auth/users.js';
import { diditStatus, verifyDiditWebhook } from '../../../server/kyc/didit.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'DIDIT_WEBHOOK_SECRET', 'DIDIT_WORKFLOW_ID']);
    const rawBody = await request.text();
    if (!(await verifyDiditWebhook(request, env.DIDIT_WEBHOOK_SECRET, rawBody))) {
      return json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
    const event = JSON.parse(rawBody);
    if (request.headers.get('X-Didit-Test-Webhook') === 'true') return json({ ok: true, test: true });
    if (!['status.updated', 'data.updated'].includes(event.webhook_type)) return json({ ok: true, ignored: true });
    if (event.workflow_id !== env.DIDIT_WORKFLOW_ID) return json({ ok: true, ignored: true });
    if (!event.vendor_data || !event.session_id) return json({ ok: true, ignored: true });

    const user = await getUserById(env.AUTH_DB, event.vendor_data);
    if (!user) return json({ ok: true, ignored: true });
    const existing = user.kycData || {};
    if (existing.sessionId && existing.sessionId !== event.session_id) return json({ ok: true, ignored: true });

    await updateUserProfile(env.AUTH_DB, user.id, {
      kycStatus: diditStatus(event.status),
      kycData: {
        provider: 'didit',
        sessionId: event.session_id,
        workflowId: event.workflow_id,
        providerStatus: event.status,
        lastEventId: event.event_id || null,
        updatedAt: new Date().toISOString(),
      },
    });
    return json({ ok: true });
  } catch (error) {
    console.error('Didit webhook failed', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
