import { json, requireBindings } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getUserById } from '../../../../server/auth/users.js';

const CAMPAIGN_ID = 'ecosystem-progress-2026-09-03';
const SUBJECT = 'Perkembangan Positif Ekosistem KriptoAman — September 2026';
const MAX_PAGES = 3;
const PAGE_LIMIT = 100;
const BEFORE_AUDIT_MS = 10 * 60 * 1000;
const AFTER_AUDIT_MS = 5 * 60 * 1000;

async function requireAdmin(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!activeSession) return null;
  const user = await getUserById(env.AUTH_DB, session.sub);
  if (!user || user.role !== 'admin') return null;
  return user;
}

async function getCampaignAudit(db) {
  return db.prepare(`
    SELECT created_at, metadata_json
    FROM auth_admin_audit
    WHERE action = 'broadcast.progress.sent'
      AND target_type = 'broadcast'
      AND target_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(CAMPAIGN_ID).first();
}

function parseTimestamp(value) {
  const raw = String(value || '').trim();
  if (!raw) return NaN;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(raw)
    ? raw.replace(' ', 'T') + (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? '' : 'Z')
    : raw;
  return Date.parse(normalized);
}

function parseAuditMetadata(row) {
  try {
    const metadata = JSON.parse(String(row?.metadata_json || '{}'));
    return metadata && typeof metadata === 'object' ? metadata : {};
  } catch {
    return {};
  }
}

function roundRate(value) {
  return Math.round(value * 10) / 10;
}

async function listRecentEmails(apiKey) {
  const items = [];
  let after = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const endpoint = new URL('https://api.resend.com/emails');
    endpoint.searchParams.set('limit', String(PAGE_LIMIT));
    if (after) endpoint.searchParams.set('after', after);

    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Resend email list failed with status ${response.status}`);
    }

    const pageItems = Array.isArray(payload?.data) ? payload.data : [];
    items.push(...pageItems);

    if (!payload?.has_more || pageItems.length < 1) break;
    after = String(pageItems[pageItems.length - 1]?.id || '');
    if (!after) break;
  }

  return items;
}

function aggregateCampaign(emails, sentAtMs, acceptedCount) {
  const startMs = sentAtMs - BEFORE_AUDIT_MS;
  const endMs = sentAtMs + AFTER_AUDIT_MS;
  const counts = Object.create(null);

  const matched = emails.filter((email) => {
    if (String(email?.subject || '') !== SUBJECT) return false;
    const createdAtMs = parseTimestamp(email?.created_at);
    return Number.isFinite(createdAtMs) && createdAtMs >= startMs && createdAtMs <= endMs;
  });

  for (const email of matched) {
    const event = String(email?.last_event || 'unknown').trim().toLowerCase();
    counts[event] = (counts[event] || 0) + 1;
  }

  const delivered = Number(counts.delivered || 0);
  const opened = Number(counts.opened || 0);
  const clicked = Number(counts.clicked || 0);
  const complained = Number(counts.complained || 0);
  const bounced = Number(counts.bounced || 0);
  const failed = Number(counts.failed || 0);
  const suppressed = Number(counts.suppressed || 0);
  const delayed = Number(counts.delivery_delayed || 0);
  const sent = Number(counts.sent || 0);
  const scheduled = Number(counts.scheduled || 0);

  const deliveredOrEngaged = delivered + opened + clicked + complained;
  const engaged = opened + clicked;
  const terminalFailure = bounced + failed + suppressed;
  const pending = Math.max(0, matched.length - deliveredOrEngaged - terminalFailure);
  const denominator = acceptedCount > 0 ? acceptedCount : matched.length;

  return {
    observed: matched.length,
    acceptedCount,
    completeObservation: acceptedCount > 0 ? matched.length >= acceptedCount : false,
    deliveredOrEngaged,
    engaged,
    clicked,
    complained,
    bounced,
    failed,
    suppressed,
    delayed,
    pending,
    sent,
    scheduled,
    deliveryRateObserved: denominator > 0 ? roundRate((deliveredOrEngaged / denominator) * 100) : null,
    failureRateObserved: denominator > 0 ? roundRate((terminalFailure / denominator) * 100) : null,
    note: 'Metrics are aggregated from Resend last_event values. Opened/clicked imply delivery; no recipient addresses are returned.',
  };
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY']);
    await ensureAuthSchema(env.AUTH_DB);

    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const previous = await getCampaignAudit(env.AUTH_DB);
    if (!previous) {
      return json({
        campaignId: CAMPAIGN_ID,
        sent: false,
        metrics: null,
      });
    }

    const sentAtMs = parseTimestamp(previous.created_at);
    if (!Number.isFinite(sentAtMs)) {
      return json({ error: 'Campaign timestamp unavailable' }, { status: 503 });
    }

    const metadata = parseAuditMetadata(previous);
    const acceptedCount = Number(metadata.acceptedCount || metadata.recipientCount || 0);
    const emails = await listRecentEmails(env.RESEND_API_KEY);
    const metrics = aggregateCampaign(emails, sentAtMs, acceptedCount);

    return json({
      campaignId: CAMPAIGN_ID,
      subject: SUBJECT,
      sent: true,
      sentAt: previous.created_at,
      metrics,
    });
  } catch (error) {
    console.error('Admin broadcast delivery metrics failed', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
    });
    return json({ error: 'Broadcast delivery metrics unavailable' }, { status: 503 });
  }
}
