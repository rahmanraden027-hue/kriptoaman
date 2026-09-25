import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// This endpoint exports email addresses only. It never sends mail or changes the
// source database. Import the returned CSV into a Resend segment after review.
function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidExportEmail(email) {
  // CSV/spreadsheet-safe subset: reject quotes, controls, and formula prefixes.
  return /^[a-z0-9][a-z0-9.!#$%&'*+/=?^_`{|}~-]*@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(email);
}

function isVerified(user) {
  return user.email_verified === true ||
    user.emailVerified === true ||
    Boolean(user.email_verified_at || user.emailVerifiedAt);
}

function hasExplicitOptIn(user) {
  return user.marketing_opt_in === true ||
    user.marketingOptIn === true ||
    user.email_updates === true ||
    user.emailUpdates === true ||
    user.newsletter_opt_in === true ||
    user.newsletterOptIn === true;
}

function isOptedOut(user) {
  return user.marketing_opt_in === false ||
    user.marketingOptIn === false ||
    user.email_updates === false ||
    user.emailUpdates === false ||
    user.newsletter_opt_in === false ||
    user.newsletterOptIn === false ||
    user.unsubscribed === true ||
    user.unsubscribe === true;
}

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff'
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: PRIVATE_HEADERS });
  }

  try {
    const base44 = createClientFromRequest(request);
    const admin = await base44.auth.me();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_HEADERS });
    }
    if (admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403, headers: PRIVATE_HEADERS });
    }

    const eligible = new Set();
    const optedOut = new Set();
    let totalAccounts = 0;
    let offset = 0;
    let pages = 0;

    while (true) {
      // Never log or expose individual source records beyond this admin-only
      // export. Pagination must complete to avoid silently omitting users.
      const page = await base44.asServiceRole.entities.User.list('-created_date', 100, offset);
      const users = page.data || [];
      if (!Array.isArray(users)) throw new Error('Unexpected user page');
      totalAccounts += users.length;

      for (const user of users) {
        const email = normalizeEmail(user.email);
        if (!isValidExportEmail(email)) continue;
        // Any opt-out across duplicate accounts wins over an opt-in.
        if (isOptedOut(user)) optedOut.add(email);
        if (isVerified(user) && hasExplicitOptIn(user) && !isOptedOut(user)) {
          eligible.add(email);
        }
      }

      if (page.has_more !== true) break;
      if (users.length === 0 || ++pages > 10000) {
        throw new Error('Incomplete pagination');
      }
      offset += users.length;
    }

    const emails = [...eligible].filter((email) => !optedOut.has(email)).sort();
    const csv = ['email', ...emails].join('\\r\\n') + '\\r\\n';

    return Response.json({
      success: true,
      source: 'base44',
      sent: 0,
      totalAccounts,
      eligibleCount: emails.length,
      csv,
      note: 'Only verified, explicitly opted-in accounts; any recorded opt-out wins. No email sent.'
    }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    // Do not log record contents, emails, or CSV contents.
    console.error('Resend audience export failed', error?.name || 'unknown');
    return Response.json(
      { error: 'Unable to prepare verified opt-in export' },
      { status: 500, headers: PRIVATE_HEADERS }
    );
  }
});
