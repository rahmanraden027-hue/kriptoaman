CREATE TABLE IF NOT EXISTS kam_points_audit_snapshot_approvals (
  snapshot_id TEXT PRIMARY KEY,
  approval_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (approval_status IN ('DRAFT', 'REVIEWED', 'APPROVED')),
  review_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  approval_notes TEXT,
  approved_by TEXT,
  approved_at TEXT,
  locked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (snapshot_id) REFERENCES kam_points_audit_snapshots(id) ON DELETE RESTRICT,
  FOREIGN KEY (reviewed_by) REFERENCES auth_users(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES auth_users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_kam_snapshot_approval_status
  ON kam_points_audit_snapshot_approvals(approval_status, updated_at DESC);
