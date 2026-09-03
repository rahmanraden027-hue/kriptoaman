export function readSession(db) {
  if (!db) return null;
  if (typeof db.withSession === 'function') return db.withSession('first-unconstrained');
  return db;
}

export function primarySession(db) {
  if (!db) return null;
  if (typeof db.withSession === 'function') return db.withSession('first-primary');
  return db;
}

export function d1SessionCapabilities(db) {
  return {
    bindingConfigured: Boolean(db),
    sessionsApiAvailable: Boolean(db && typeof db.withSession === 'function'),
    readReplicationAccountState: 'requires-account-verification',
  };
}
