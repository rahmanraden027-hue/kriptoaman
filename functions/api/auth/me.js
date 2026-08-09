import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { getUserById, updateUserProfile } from '../../../server/auth/users.js';

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    const token = getSessionToken(request);
    const session = await verifySessionToken(env.SESSION_SECRET, token);
    if (!session) return json({ authenticated: false }, { status: 401 });
    const user = await getUserById(env.AUTH_DB, session.sub);
    if (!user) return json({ authenticated: false }, { status: 401 });
    return json({ authenticated: true, user });
  } catch (error) {
    console.error('Session lookup failed', error);
    return json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session) return json({ authenticated: false }, { status: 401 });
    const body = await request.json();
    const changes = {};
    const allowedKeys = new Set(['full_name', 'bio', 'phone', 'kycStatus', 'kycData', 'referralCode']);
    const unsupported = Object.keys(body).filter((key) => !allowedKeys.has(key));
    if (unsupported.length) return json({ error: 'Unsupported profile field' }, { status: 400 });
    if (body.full_name !== undefined) changes.full_name = String(body.full_name).trim().slice(0, 120);
    if (body.bio !== undefined) changes.bio = String(body.bio).trim().slice(0, 500);
    if (body.phone !== undefined) changes.phone = String(body.phone).trim().slice(0, 32);
    if (body.kycStatus !== undefined) {
      if (body.kycStatus !== 'pending') return json({ error: 'KYC status can only be changed by the verification service' }, { status: 403 });
      changes.kycStatus = 'pending';
    }
    if (body.kycData !== undefined) {
      const serialized = JSON.stringify(body.kycData);
      if (serialized.length > 20000) return json({ error: 'KYC data is too large' }, { status: 413 });
      changes.kycData = body.kycData;
    }
    if (body.referralCode !== undefined) {
      const referralCode = String(body.referralCode).trim().toUpperCase();
      if (!/^KA[A-Z0-9]{6}$/.test(referralCode)) return json({ error: 'Invalid referral code' }, { status: 400 });
      changes.referralCode = referralCode;
    }
    const user = await updateUserProfile(env.AUTH_DB, session.sub, changes);
    if (!user) return json({ authenticated: false }, { status: 401 });
    return json({ authenticated: true, user });
  } catch (error) {
    console.error('Profile update failed', error);
    return json({ error: 'Profile service unavailable' }, { status: 503 });
  }
}
