/**
 * auditLog — lightweight client-side audit trail for security-relevant events
 * (permission denials, owner-guard denials, admin actions). Stored locally so it
 * works on the free plan without backend functions; safe to surface in admin views.
 */
import { appStorage } from '@/components/utils/appStorage';

const MAX = 200;
const KEY = 'ka_audit_logs';

function store(entry) {
  const logs = appStorage.getJSON(KEY) || [];
  logs.unshift(entry);
  appStorage.set(KEY, JSON.stringify(logs.slice(0, MAX)));
}

/** Record an audit event. Fire-and-forget; never throws. */
export function logAudit(event, data = {}) {
  const entry = {
    id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    event: String(event),
    data,
    path: typeof window !== 'undefined' ? window.location.pathname : '',
  };
  try {
    store(entry);
  } catch { /* ignore storage failures */ }
  console.info('[audit]', event, data);
  return entry;
}

export function getAuditLogs() {
  return appStorage.getJSON(KEY) || [];
}

export function clearAuditLogs() {
  appStorage.remove(KEY);
}