export async function upsertGoogleUser(db, profile, role = 'user') {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO auth_users (
      id, email, full_name, avatar_url, google_sub, role, email_verified, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      full_name = excluded.full_name,
      avatar_url = excluded.avatar_url,
      google_sub = excluded.google_sub,
      email_verified = 1,
      role = CASE WHEN excluded.role = 'admin' THEN 'admin' ELSE auth_users.role END,
      updated_at = excluded.updated_at
  `).bind(id, profile.email.toLowerCase(), profile.name || null, profile.picture || null, profile.sub, role, now, now).run();
  return getUserByEmail(db, profile.email);
}

function normalizeUser(user) {
  if (!user) return null;
  let kycData = null;
  try { kycData = user.kyc_data ? JSON.parse(user.kyc_data) : null; } catch { kycData = null; }
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    bio: user.bio,
    phone: user.phone,
    avatar_url: user.avatar_url,
    role: user.role,
    email_verified: Boolean(user.email_verified),
    kycStatus: user.kyc_status || 'none',
    kycData,
    referralCode: user.referral_code || null,
    created_date: user.created_at,
    updated_date: user.updated_at,
    ...(user.password_hash !== undefined ? { password_hash: user.password_hash } : {}),
  };
}

export async function getUserById(db, id) {
  const user = await db.prepare(`
    SELECT id, email, full_name, bio, phone, avatar_url, role, email_verified,
           kyc_status, kyc_data, referral_code, created_at, updated_at
    FROM auth_users WHERE id = ? LIMIT 1
  `).bind(id).first();
  return normalizeUser(user);
}

export async function getUserByEmail(db, email, { includePassword = false } = {}) {
  const columns = includePassword
    ? 'id, email, full_name, bio, phone, avatar_url, role, email_verified, password_hash, kyc_status, kyc_data, referral_code, created_at, updated_at'
    : 'id, email, full_name, bio, phone, avatar_url, role, email_verified, kyc_status, kyc_data, referral_code, created_at, updated_at';
  const user = await db.prepare(`SELECT ${columns} FROM auth_users WHERE email = ? LIMIT 1`).bind(email.toLowerCase()).first();
  return normalizeUser(user);
}

export async function createPasswordUser(db, email, passwordHash) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO auth_users (id, email, password_hash, role, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, 'user', 0, ?, ?)
  `).bind(id, email.toLowerCase(), passwordHash, now, now).run();
  return getUserByEmail(db, email);
}

export async function setPassword(db, userId, passwordHash) {
  const now = new Date().toISOString();
  await db.prepare('UPDATE auth_users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(passwordHash, now, userId).run();
}

export async function markEmailVerified(db, userId) {
  const now = new Date().toISOString();
  await db.prepare('UPDATE auth_users SET email_verified = 1, updated_at = ? WHERE id = ?').bind(now, userId).run();
}

export async function updateUserProfile(db, userId, changes) {
  const assignments = [];
  const values = [];
  if (changes.full_name !== undefined) { assignments.push('full_name = ?'); values.push(changes.full_name); }
  if (changes.bio !== undefined) { assignments.push('bio = ?'); values.push(changes.bio); }
  if (changes.phone !== undefined) { assignments.push('phone = ?'); values.push(changes.phone); }
  if (changes.kycStatus !== undefined) { assignments.push('kyc_status = ?'); values.push(changes.kycStatus); }
  if (changes.kycData !== undefined) { assignments.push('kyc_data = ?'); values.push(JSON.stringify(changes.kycData)); }
  if (changes.referralCode !== undefined) { assignments.push('referral_code = ?'); values.push(changes.referralCode); }
  if (!assignments.length) return getUserById(db, userId);
  assignments.push('updated_at = ?');
  values.push(new Date().toISOString(), userId);
  await db.prepare(`UPDATE auth_users SET ${assignments.join(', ')} WHERE id = ?`).bind(...values).run();
  return getUserById(db, userId);
}

export async function promoteConfiguredAdmin(db, userId) {
  const now = new Date().toISOString();
  await db.prepare("UPDATE auth_users SET role = 'admin', email_verified = 1, updated_at = ? WHERE id = ?").bind(now, userId).run();
  return getUserById(db, userId);
}

export async function deleteUserAccount(db, user) {
  if (!user?.id || !user?.email) return false;
  const email = user.email.toLowerCase();
  const statements = [
    db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM auth_totp WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM auth_balances WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM auth_consents WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM auth_challenges WHERE email = ?').bind(email),
    db.prepare('DELETE FROM auth_users WHERE id = ?').bind(user.id),
  ];
  const results = await db.batch(statements);
  return Boolean(results?.[5]?.meta?.changes);
}
