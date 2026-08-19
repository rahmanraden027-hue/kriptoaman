const schemaPromises = new WeakMap();

const statements = [
  `CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    full_name TEXT,
    bio TEXT,
    phone TEXT,
    avatar_url TEXT,
    password_hash TEXT,
    google_sub TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'compliance', 'support', 'finance', 'auditor', 'user')),
    email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
    kyc_status TEXT NOT NULL DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
    kyc_data TEXT,
    referral_code TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_auth_users_google_sub ON auth_users(google_sub)',
  'CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role)',
  'CREATE INDEX IF NOT EXISTS idx_auth_users_referral_code ON auth_users(referral_code)',
  `CREATE TABLE IF NOT EXISTS auth_challenges (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE,
    type TEXT NOT NULL CHECK (type IN ('email_verify', 'password_reset')),
    secret_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used_at TEXT,
    created_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_auth_challenges_email_type ON auth_challenges(email, type, created_at DESC)',
  `CREATE TABLE IF NOT EXISTS auth_rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    window_started_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS auth_consents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('registration')),
    terms_version TEXT NOT NULL,
    privacy_version TEXT NOT NULL,
    ip_hash TEXT,
    user_agent TEXT,
    accepted_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_auth_consents_user_id ON auth_consents(user_id, accepted_at DESC)',
  `CREATE TABLE IF NOT EXISTS auth_totp (
    user_id TEXT PRIMARY KEY,
    secret_enc TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
    backup_hashes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_auth_totp_enabled ON auth_totp(enabled)',
  `CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_agent TEXT,
    device_label TEXT,
    ip_hash TEXT,
    ip_masked TEXT,
    country TEXT,
    city TEXT,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active ON auth_sessions(user_id, revoked_at, last_seen_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at)',
  `CREATE TABLE IF NOT EXISTS auth_balances (
    user_id TEXT PRIMARY KEY,
    balances_json TEXT NOT NULL DEFAULT '{}',
    updated_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES auth_users(id) ON DELETE RESTRICT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_auth_balances_updated_at ON auth_balances(updated_at DESC)',
  `CREATE TABLE IF NOT EXISTS auth_admin_audit (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    admin_email TEXT NOT NULL COLLATE NOCASE,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    ip_masked TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (admin_user_id) REFERENCES auth_users(id) ON DELETE RESTRICT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_auth_admin_audit_created_at ON auth_admin_audit(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_auth_admin_audit_admin ON auth_admin_audit(admin_user_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_auth_admin_audit_action ON auth_admin_audit(action, created_at DESC)',
  `CREATE TABLE IF NOT EXISTS kam_points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'system',
    reference_id TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_kam_points_user_created ON kam_points_ledger(user_id, created_at DESC)',
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_kam_points_reference
   ON kam_points_ledger(source, reference_id)
   WHERE reference_id IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS kam_reward_campaigns (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('COMMUNITY', 'REFERRAL')),
    status TEXT NOT NULL DEFAULT 'PAUSED' CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')),
    budget_points INTEGER NOT NULL CHECK (budget_points >= 0),
    distributed_points INTEGER NOT NULL DEFAULT 0 CHECK (distributed_points >= 0),
    reward_points INTEGER NOT NULL CHECK (reward_points > 0),
    invitee_reward_points INTEGER NOT NULL DEFAULT 0 CHECK (invitee_reward_points >= 0),
    starts_at TEXT,
    ends_at TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE RESTRICT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_kam_campaign_status ON kam_reward_campaigns(status, starts_at, ends_at)',
  `CREATE TABLE IF NOT EXISTS kam_referrals (
    id TEXT PRIMARY KEY,
    invitee_user_id TEXT NOT NULL UNIQUE,
    referrer_user_id TEXT NOT NULL,
    referral_code TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUALIFIED', 'REWARDED', 'REJECTED')),
    created_at TEXT NOT NULL,
    qualified_at TEXT,
    rewarded_at TEXT,
    FOREIGN KEY (invitee_user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
    FOREIGN KEY (referrer_user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES kam_reward_campaigns(id) ON DELETE RESTRICT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_kam_referrals_referrer ON kam_referrals(referrer_user_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_kam_referrals_campaign ON kam_referrals(campaign_id, status)',
];

async function initializeSchema(db) {
  await db.batch(statements.map((statement) => db.prepare(statement)));
}

export function ensureAuthSchema(db) {
  let pending = schemaPromises.get(db);
  if (!pending) {
    pending = initializeSchema(db).catch((error) => {
      schemaPromises.delete(db);
      throw error;
    });
    schemaPromises.set(db, pending);
  }
  return pending;
}
