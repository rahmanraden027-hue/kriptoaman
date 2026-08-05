/**
 * rbac — Role-Based Access Control for KriptoAman.
 * Centralizes the role → permission mapping and the owner check previously
 * duplicated across AdminRoute / AdminGuard.
 */
import { useAuth } from '@/lib/AuthContext';

export const ROLES = { ADMIN: 'admin', USER: 'user', GUEST: 'guest' };

// Owner email — only this account can access owner-only areas (kept from AdminGuard).
export const OWNER_EMAIL = 'rahmanraden027@gmail.com';

// Permission matrix: action -> allowed roles
export const PERMISSIONS = {
  // Admin module
  'admin:access': ['admin'],
  'admin:manage': ['admin'],
  'admin:kyc_review': ['admin'],
  'admin:aml_review': ['admin'],
  'admin:profit': ['admin'],
  'admin:platform_assets': ['admin'],
  'admin:secure_vault': ['admin'],
  'admin:security_center': ['admin'],
  'admin:server_control': ['admin'],
  'admin:broadcast': ['admin'],
  'admin:bigquery': ['admin'],
  'admin:regulatory': ['admin'],
  'admin:docs': ['admin'],
  'admin:user_balances': ['admin'],
  'owner:access': ['admin'],

  // User module
  'wallet:read': ['admin', 'user'],
  'wallet:write': ['admin', 'user'],
  'wallet:trade': ['admin', 'user'],
  'wallet:withdraw': ['admin', 'user'],
  'kyc:submit': ['admin', 'user'],
  'trading:read': ['admin', 'user'],
  'trading:write': ['admin', 'user'],
  'lending:read': ['admin', 'user'],
  'lending:write': ['admin', 'user'],
  'notification:read': ['admin', 'user'],

  // Public
  'public:read': ['admin', 'user', 'guest'],
};

export function getUserRole(user) {
  if (!user) return ROLES.GUEST;
  return user.role === 'admin' ? ROLES.ADMIN : ROLES.USER;
}

export function hasPermission(user, action) {
  const allowed = PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.includes(getUserRole(user));
}

export function isOwner(user) {
  return !!(user && user.role === 'admin' && user.email === OWNER_EMAIL);
}

/**
 * usePermissions — React hook giving components a stable RBAC API.
 * Pure (no side effects); callers decide what to do on denial (e.g. log audit).
 */
export function usePermissions() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const role = getUserRole(user);
  return {
    can: (action) => hasPermission(user, action),
    role,
    isAdmin: role === ROLES.ADMIN,
    isOwner: isOwner(user),
    user,
    isAuthenticated,
    isLoadingAuth,
  };
}