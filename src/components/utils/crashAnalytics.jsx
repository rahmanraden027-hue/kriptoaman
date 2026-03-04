/**
 * crashAnalytics — lightweight crash & error tracking
 * Stores error logs locally + reports to Mixpanel analytics
 */

import { appStorage } from './appStorage';

const MAX_LOGS = 50;
const LOG_KEY = 'crash_logs';

function getSessionId() {
  let sid = sessionStorage.getItem('ka_session_id');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('ka_session_id', sid);
  }
  return sid;
}

function storeCrash(entry) {
  const logs = appStorage.getJSON(LOG_KEY) || [];
  logs.unshift(entry);
  appStorage.set(LOG_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
}

export function reportError(error, context = {}) {
  const entry = {
    id: `err_${Date.now()}`,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    message: error?.message || String(error),
    stack: error?.stack?.slice(0, 500) || '',
    context,
    userAgent: navigator.userAgent.slice(0, 100),
    url: window.location.pathname,
  };
  storeCrash(entry);
  try {
    if (window.mixpanel) {
      window.mixpanel.track('app_error', {
        error_message: entry.message,
        url: entry.url,
        context: JSON.stringify(context).slice(0, 200),
      });
    }
  } catch {}
  console.error('[KriptoAman Error]', entry.message, context);
}

export function getCrashLogs() {
  return appStorage.getJSON(LOG_KEY) || [];
}

export function clearCrashLogs() {
  appStorage.remove(LOG_KEY);
}

export function installCrashHandlers() {
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      type: 'uncaught', source: event.filename, line: event.lineno,
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandled_promise' }
    );
  });
}