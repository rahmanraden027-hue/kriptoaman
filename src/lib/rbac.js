/**
 * rbac — Role-Based Access Control for KriptoAman.
 * Centralizes the role → permission mapping and the owner check previously
 * duplicated across AdminRoute / AdminGuard.
 *
 * Roles: admin, compliance, support, finance, auditor, user, guest.
 */
import { useAuth } from '@/lib/AuthContext';

export const ROLES = {
  ADMIN: 'admin',
  COMPLIANCE: 'compliance',
  SUPPORT: 'support',
  FINANCE: 'finance',
  AUDITOR: 'auditor',
  USER: 'user',
  GUEST: 'guest',
};

// Owner email — only this account can access owner-only areas (kept from AdminGuard).
export const OWNER_EMAIL = 'rahmanraden027@gmail.com';

// Permission matrix: action -> allowed roles.
export const PERMISSIONS = {
  // ── Admin module ──
  'admin:access': ['admin'],
  'admin:manage': ['admin'],
  'admin:server_control': ['admin'],
  'admin:secure_vault': ['admin'],
  'admin:security_center': ['admin'],
  'admin:broadcast': ['admin'],
  'admin:bigquery': ['admin'],
  'admin:regulatory': ['admin'],
  'admin:docs': ['admin'],
  'admin:platform_assets': ['admin'],
  'owner:access': ['admin'],

  // ── KYC module ──
  'kyc:submit': ['admin', 'user'],
  'kyc:read_own': ['admin', 'compliance', 'auditor', 'user'],
  'kyc:review': ['admin', 'compliance'],
  'kyc:read_all': ['admin', 'compliance', 'auditor'],

  // ── AML module ──
  'aml:read': ['admin', 'compliance', 'auditor'],
  'aml:review': ['admin', 'compliance'],
  'aml:block': ['admin', 'compliance'],

  // ── Wallet module ──
  'wallet:read': ['admin', 'finance', 'auditor', 'user'],
  'wallet:write': ['admin', 'user'],
  'wallet:trade': ['admin', 'user'],
  'wallet:withdraw': ['admin', 'user'],

  // ── Trading module ──
  'trading:read': ['admin', 'auditor', 'user'],
  'trading:write': ['admin', 'user'],

  // ── Lending module ──
  'lending:read': ['admin', 'auditor', 'user'],
  'lending:write': ['admin', 'user'],

  // ── Deposit / Withdrawal / Payment ──
  'deposit:create': ['admin', 'user'],
  'deposit:review': ['admin', 'finance'],
  'deposit:read_all': ['admin', 'finance', 'auditor'],
  'withdrawal:create': ['admin', 'user'],
  'withdrawal:review': ['admin', 'finance'],
  'withdrawal:read_all': ['admin', 'finance', 'auditor'],
  'payment:manage': ['admin', 'finance'],

  // ── Notifications ──
  'notification:read': ['admin', 'user'],

  // ── Support module ──
  'support:read': ['admin', 'support'],
  'support:respond': ['admin', 'support'],
  'support:read_all': ['admin', 'support', 'auditor'],

  // ── Finance module ──
  'finance:profit_read': ['admin', 'finance', 'auditor'],
  'finance:profit_manage': ['admin', 'finance'],

  // ── Audit module ──
  'audit:read': ['admin', 'auditor'],

  // ── Settings ──
  'settings:read': ['admin', 'user'],
  'settings:write': ['admin', 'user'],

  // ── Public ──
  'public:read': ['admin', 'compliance', 'support', 'finance', 'auditor', 'user', 'guest'],
};

const VALID_ROLES = [ROLES.ADMIN, ROLES.COMPLIANCE, ROLES.SUPPORT, ROLES.FINANCE, ROLES.AUDITOR, ROLES.USER];

export function getUserRole(user) {
  if (!user) return ROLES.GUEST;
  return VALID_ROLES.includes(user.role) ? user.role : ROLES.USER;
}

export function hasPermission(user, action) {
  const allowed = PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.includes(getUserRole(user));
}

/** Roles allowed for a given action (useful when generating RLS rules). */
export function rolesForAction(action) {
  return PERMISSIONS[action] ? [...PERMISSIONS[action]] : [];
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