-- Audit-only snapshot records for off-chain KAM Points.
-- This schema does not mint, transfer, redeem, or distribute tokens/assets.
CREATE TABLE IF NOT EXISTS kam_points_audit_snapshots (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'FROZEN' CHECK (status = 'FROZEN'),
  rule_version INTEGER NOT NULL DEFAULT 1,
  total_users INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  manifest_hash TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_kam_points_audit_snapshots_created
ON kam_points_audit_snapshots(created_at DESC);

CREATE TABLE IF NOT EXISTS kam_points_audit_snapshot_entries (
  snapshot_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points > 0),
  rule_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, user_id),
  FOREIGN KEY (snapshot_id) REFERENCES kam_points_audit_snapshots(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_kam_points_audit_snapshot_entries_user
ON kam_points_audit_snapshot_entries(user_id, snapshot_id);
