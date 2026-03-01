import mixpanel from 'mixpanel-browser';

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || '';

let initialized = false;

export function initAnalytics() {
  if (!TOKEN || initialized) return;
  mixpanel.init(TOKEN, {
    debug: import.meta.env.DEV,
    track_pageview: false,
    persistence: 'localStorage',
  });
  initialized = true;
}

export function identifyUser(user) {
  if (!initialized || !user?.id) return;
  mixpanel.identify(user.id);
  mixpanel.people.set({
    $email: user.email,
    $name: user.full_name,
    role: user.role,
    created_at: user.created_date,
  });
}

export function track(event, props = {}) {
  if (!initialized) return;
  try { mixpanel.track(event, props); } catch {}
}

// ── Preset event helpers ──────────────────────────────────────────────────────
export const Analytics = {
  // Auth
  loginSuccess: (method = 'email') => track('Login Success', { method }),
  logout: () => track('Logout'),

  // Wallet
  walletCreated: () => track('Wallet Created'),
  walletUnlocked: () => track('Wallet Unlocked'),

  // Transactions
  sendStarted: (coin) => track('Send Started', { coin }),
  sendCompleted: (coin, amount_usd) => track('Send Completed', { coin, amount_usd }),
  receiveViewed: (coin) => track('Receive Address Viewed', { coin }),

  // Swap
  swapStarted: (from_coin, to_coin) => track('Swap Started', { from_coin, to_coin }),
  swapConfirmed: (from_coin, to_coin, amount, amount_usd) =>
    track('Swap Confirmed', { from_coin, to_coin, amount, amount_usd }),
  swapCompleted: (from_coin, to_coin) => track('Swap Completed', { from_coin, to_coin }),

  // Trade
  tradeOpened: (pair, type) => track('Trade Opened', { pair, type }),
  tradeCompleted: (pair, type, pnl) => track('Trade Completed', { pair, type, pnl }),

  // Preferences
  themeChanged: (theme) => track('Theme Changed', { theme }),
  notificationToggled: (name, enabled) => track('Notification Toggled', { name, enabled }),
  dashboardRefreshChanged: (interval) => track('Dashboard Refresh Changed', { interval }),

  // Security
  pinEnabled: () => track('PIN Enabled'),
  pinDisabled: () => track('PIN Disabled'),
  biometricToggled: (enabled) => track('Biometric Toggled', { enabled }),
  sessionTimeoutChanged: (minutes) => track('Session Timeout Changed', { minutes }),
  twoFAEnabled: () => track('2FA Enabled'),
  twoFADisabled: () => track('2FA Disabled'),

  // Features
  bankModalOpened: () => track('Bank Modal Opened'),
  supportChatOpened: () => track('Support Chat Opened'),
  bridgeOpened: () => track('Cross-Chain Bridge Opened'),
  pageViewed: (page) => track('Page Viewed', { page }),
};