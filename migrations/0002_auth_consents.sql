CREATE TABLE IF NOT EXISTS auth_consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('registration')),
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  accepted_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_consents_user_id
  ON auth_consents(user_id, accepted_at DESC);
