import { json, requireBindings } from '../../server/auth/http.js';

function number(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function onRequestGet({ env }) {
  try {
    requireBindings(env, ['AUTH_DB']);

    const row = await env.AUTH_DB.prepare(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS regular_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin_users,
        SUM(CASE WHEN role NOT IN ('user', 'admin') OR role IS NULL THEN 1 ELSE 0 END) AS other_roles,
        SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) AS email_verified_users,
        SUM(CASE WHEN email_verified NOT IN (0, 1) OR email_verified IS NULL THEN 1 ELSE 0 END) AS invalid_email_verified,
        SUM(CASE WHEN COALESCE(kyc_status, 'none') = 'none' THEN 1 ELSE 0 END) AS kyc_none,
        SUM(CASE WHEN kyc_status = 'pending' THEN 1 ELSE 0 END) AS kyc_pending,
        SUM(CASE WHEN kyc_status = 'approved' THEN 1 ELSE 0 END) AS kyc_approved,
        SUM(CASE WHEN kyc_status = 'rejected' THEN 1 ELSE 0 END) AS kyc_rejected,
        SUM(CASE WHEN kyc_status NOT IN ('none', 'pending', 'approved', 'rejected') AND kyc_status IS NOT NULL THEN 1 ELSE 0 END) AS kyc_other,
        SUM(CASE WHEN id IS NULL OR TRIM(id) = '' THEN 1 ELSE 0 END) AS missing_id,
        SUM(CASE WHEN email IS NULL OR TRIM(email) = '' THEN 1 ELSE 0 END) AS missing_email,
        COUNT(*) - COUNT(DISTINCT LOWER(TRIM(email))) AS duplicate_email_rows
      FROM auth_users
    `).first();

    const stats = {
      totalUsers: number(row?.total_users),
      regularUsers: number(row?.regular_users),
      adminUsers: number(row?.admin_users),
      otherRoles: number(row?.other_roles),
      emailVerifiedUsers: number(row?.email_verified_users),
      invalidEmailVerified: number(row?.invalid_email_verified),
      kyc: {
        none: number(row?.kyc_none),
        pending: number(row?.kyc_pending),
        approved: number(row?.kyc_approved),
        rejected: number(row?.kyc_rejected),
        other: number(row?.kyc_other),
      },
      missingId: number(row?.missing_id),
      missingEmail: number(row?.missing_email),
      duplicateEmailRows: number(row?.duplicate_email_rows),
    };

    const roleSum = stats.regularUsers + stats.adminUsers + stats.otherRoles;
    const kycSum = Object.values(stats.kyc).reduce((sum, value) => sum + value, 0);
    const verified =
      roleSum === stats.totalUsers &&
      kycSum === stats.totalUsers &&
      stats.missingId === 0 &&
      stats.missingEmail === 0 &&
      stats.duplicateEmailRows === 0 &&
      stats.invalidEmailVerified === 0;

    return json({
      verified,
      source: 'production AUTH_DB',
      asOf: new Date().toISOString(),
      stats,
      privacy: 'aggregate-only; no user PII returned',
    });
  } catch (error) {
    console.error('Temporary user aggregate verification failed', error);
    return json({
      verified: false,
      error: 'Production user aggregate verification unavailable',
      asOf: new Date().toISOString(),
    }, { status: 503 });
  }
}
