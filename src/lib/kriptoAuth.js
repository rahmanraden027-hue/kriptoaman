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
  async me() {
    const data = await request('/api/auth/me');
    return data.user;
  },

  async isAuthenticated() {
    try { await this.me(); return true; } catch { return false; }
  },

  async loginViaEmailPassword(email, password) {
    return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },

  async requestAdminLink(email) {
    return request('/api/auth/admin/request-link', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async register({ email, password, termsAccepted }) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, termsAccepted }),
    });
  },

  async verifyOtp({ email, otpCode }) {
    return request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code: otpCode }) });
  },

  async resendOtp(email) {
    return request('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async resetPasswordRequest(email) {
    return request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async resetPassword({ resetToken, newPassword }) {
    return request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, newPassword }) });
  },

  async updateMe(changes) {
    const data = await request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(changes) });
    return data.user;
  },

  loginWithProvider(provider) {
    if (provider !== 'google') throw new Error('Unsupported authentication provider');
    window.location.assign('/api/auth/google/start');
  },

  redirectToLogin() {
    window.location.assign('/login');
  },

  logout(redirect = '/login') {
    const operation = request('/api/auth/logout', { method: 'POST' }).catch(() => null);
    if (redirect) operation.finally(() => window.location.assign(redirect));
    return operation;
  },

  setToken() {
    // First-party authentication uses HttpOnly cookies; browser JavaScript never receives session tokens.
  },
};
