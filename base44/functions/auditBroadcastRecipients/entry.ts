import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isExplicitlyVerified(user) {
  return user.email_verified === true || user.emailVerified === true || Boolean(user.email_verified_at || user.emailVerifiedAt);
}

function isExplicitlyUnverified(user) {
  return user.email_verified === false || user.emailVerified === false;
}

function isOptedOut(user) {
  return user.marketing_opt_in === false || user.marketingOptIn === false || user.email_updates === false || user.emailUpdates === false || user.unsubscribed === true || user.unsubscribe === true;
}

function hasExplicitOptIn(user) {
  return user.marketing_opt_in === true || user.marketingOptIn === true || user.email_updates === true || user.emailUpdates === true || user.newsletter_opt_in === true || user.newsletterOptIn === true;
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return 'invalid';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const first = await base44.asServiceRole.entities.User.list('-created_date', 100, 0);
    const allUsers = [...(first.data || [])];
    let hasMore = first.has_more === true;
    let skip = allUsers.length;

    while (hasMore) {
      const next = await base44.asServiceRole.entities.User.list('-created_date', 100, skip);
      allUsers.push(...(next.data || []));
      skip += next.data?.length || 0;
      hasMore = next.has_more === true;
      if (!next.data?.length) break;
    }

    const withEmail = allUsers.filter(u => normalizeEmail(u.email));
    const invalidEmail = withEmail.filter(u => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(u.email)));
    const validEmailUsers = withEmail.filter(u => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(u.email)));

    const seen = new Set();
    const uniqueUsers = [];
    let duplicates = 0;
    for (const user of validEmailUsers) {
      const email = normalizeEmail(user.email);
      if (seen.has(email)) { duplicates += 1; continue; }
      seen.add(email);
      uniqueUsers.push(user);
    }

    const verified = uniqueUsers.filter(isExplicitlyVerified);
    const unverified = uniqueUsers.filter(isExplicitlyUnverified);
    const verificationUnknown = uniqueUsers.filter(u => !isExplicitlyVerified(u) && !isExplicitlyUnverified(u));
    const optedOut = uniqueUsers.filter(isOptedOut);
    const explicitOptIn = uniqueUsers.filter(hasExplicitOptIn);
    const consentUnknown = uniqueUsers.filter(u => !isOptedOut(u) && !hasExplicitOptIn(u));
    const contactable = uniqueUsers.filter(u => !isOptedOut(u));
    const conservativeEligible = uniqueUsers.filter(u => isExplicitlyVerified(u) && hasExplicitOptIn(u) && !isOptedOut(u));

    return Response.json({
      success: true,
      dryRun: true,
      sent: 0,
      summary: {
        totalAccounts: allUsers.length,
        accountsWithEmail: withEmail.length,
        invalidEmail: invalidEmail.length,
        uniqueValidEmail: uniqueUsers.length,
        duplicateEmailRecords: duplicates,
        verifiedEmail: verified.length,
        unverifiedEmail: unverified.length,
        verificationUnknown: verificationUnknown.length,
        explicitOptIn: explicitOptIn.length,
        optedOut: optedOut.length,
        consentUnknown: consentUnknown.length,
        contactableCandidates: contactable.length,
        conservativeEligible: conservativeEligible.length
      },
      sample: uniqueUsers.slice(0, 20).map(u => ({
        email: maskEmail(normalizeEmail(u.email)),
        verified: isExplicitlyVerified(u) ? 'yes' : isExplicitlyUnverified(u) ? 'no' : 'unknown',
        consent: isOptedOut(u) ? 'opted-out' : hasExplicitOptIn(u) ? 'opted-in' : 'unknown'
      })),
      note: 'Audit only. No email was sent. conservativeEligible requires explicit verified email and explicit opt-in.'
    });
  } catch (error) {
    console.error('auditBroadcastRecipients error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
