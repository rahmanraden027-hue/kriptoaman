async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || 'Authentication request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const kriptoAuth = {
  async me() { const data = await request('/api/auth/me'); return data.user; },
  async isAuthenticated() { try { await this.me(); return true; } catch { return false; } },
  async loginViaEmailPassword(email, password) { return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); },
  async loginWith2FA(email, password, code) { return request('/api/auth/login-2fa', { method: 'POST', body: JSON.stringify({ email, password, code }) }); },
  async get2FAStatus() { return request('/api/auth/2fa/status'); },
  async setup2FA() { return request('/api/auth/2fa/setup', { method: 'POST', body: JSON.stringify({}) }); },
  async verify2FASetup(code) { return request('/api/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) }); },
  async getSessions() { const data = await request('/api/auth/sessions'); return data.sessions || []; },
  async revokeSession(sessionId) { return request('/api/auth/sessions', { method: 'DELETE', body: JSON.stringify({ sessionId }) }); },
  async revokeOtherSessions() { return request('/api/auth/sessions', { method: 'DELETE', body: JSON.stringify({ others: true }) }); },
  async getAdminBalance() { return request('/api/auth/admin/balance'); },
  async updateAdminBalance(balances) { return request('/api/auth/admin/balance', { method: 'PUT', body: JSON.stringify({ balances }) }); },
  async getKamPoints() { return request('/api/auth/kam-points'); },
  async getReferral() { return request('/api/auth/referral'); },
  async registerReferral(referralCode) { return request('/api/auth/referral', { method: 'POST', body: JSON.stringify({ referralCode }) }); },
  async getAdminKamRewards() { return request('/api/auth/admin/kam-rewards'); },
  async grantKamCampaignReward({ email, campaignId, amount, reason }) { return request('/api/auth/admin/kam-rewards', { method: 'POST', body: JSON.stringify({ email, campaignId, amount, reason }) }); },
  async getKamCampaigns() { return request('/api/auth/admin/kam-campaigns'); },
  async getKamAnalytics() { return request('/api/auth/admin/kam-analytics'); },
  async getKamSnapshotReadiness() { return request('/api/auth/admin/kam-snapshot-readiness'); },
  async verifyKamAuditSnapshot(snapshotId) { return request(`/api/auth/admin/kam-snapshot-readiness?action=verify&snapshotId=${encodeURIComponent(snapshotId)}`); },
  async compareKamAuditSnapshots(baseSnapshotId, targetSnapshotId) { return request(`/api/auth/admin/kam-snapshot-readiness?action=compare&baseSnapshotId=${encodeURIComponent(baseSnapshotId)}&targetSnapshotId=${encodeURIComponent(targetSnapshotId)}`); },
  async freezeKamPointsAuditSnapshot(code) { return request('/api/auth/admin/kam-snapshot-readiness', { method: 'POST', body: JSON.stringify({ code }) }); },
  async reviewKamAuditSnapshot(snapshotId, notes) { return request('/api/auth/admin/kam-snapshot-readiness', { method: 'PATCH', body: JSON.stringify({ action: 'review', snapshotId, notes }) }); },
  async approveKamAuditSnapshot(snapshotId, notes) { return request('/api/auth/admin/kam-snapshot-readiness', { method: 'PATCH', body: JSON.stringify({ action: 'approve', snapshotId, notes }) }); },
  async createKamCampaign(campaign) { return request('/api/auth/admin/kam-campaigns', { method: 'POST', body: JSON.stringify(campaign) }); },
  async updateKamCampaignStatus(code, status) { return request('/api/auth/admin/kam-campaigns', { method: 'PATCH', body: JSON.stringify({ code, status }) }); },
  async requestAdminLink(email) { return request('/api/auth/admin/request-link', { method: 'POST', body: JSON.stringify({ email }) }); },
  async register({ email, password, termsAccepted }) { return request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, termsAccepted }) }); },
  async verifyOtp({ email, otpCode }) { return request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code: otpCode }) }); },
  async resendOtp(email) { return request('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }); },
  async resetPasswordRequest(email) { return request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); },
  async resetPassword({ resetToken, newPassword }) { return request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, newPassword }) }); },
  async updateMe(changes) { const data = await request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(changes) }); return data.user; },
  async deleteAccount(confirmation) { return request('/api/auth/delete-account', { method: 'POST', body: JSON.stringify({ confirmation }) }); },
  loginWithProvider(provider) { if (provider !== 'google') throw new Error('Unsupported authentication provider'); window.location.assign('/api/auth/google/start'); },
  redirectToLogin() { window.location.assign('/login'); },
  logout(redirect = '/login') { const operation = request('/api/auth/logout', { method: 'POST' }).catch(() => null); if (redirect) operation.finally(() => window.location.assign(redirect)); return operation; },
  setToken() { /* First-party authentication uses HttpOnly cookies. */ },
};
