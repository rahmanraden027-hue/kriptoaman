CREATE TABLE IF NOT EXISTS kam_points_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  reference_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kam_points_user_created
  ON kam_points_ledger(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kam_points_reference
  ON kam_points_ledger(source, reference_id)
  WHERE reference_id IS NOT NULL;
