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
