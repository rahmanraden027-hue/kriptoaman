import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AES-256-GCM encryption for user balance data using Web Crypto API
const ENC_KEY = Deno.env.get("DATA_ENCRYPTION_KEY");
const KEY_ALG = "AES-GCM";

async function getEncKey() {
  if (!ENC_KEY) throw new Error("DATA_ENCRYPTION_KEY not configured");
  // Derive a 256-bit key from the hex secret
  const keyBytes = new Uint8Array(32);
  const hex = ENC_KEY.replace(/[^0-9a-fA-F]/g, '').padEnd(64, '0').slice(0, 64);
  for (let i = 0; i < 32; i++) {
    keyBytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return crypto.subtle.importKey("raw", keyBytes, { name: KEY_ALG }, false, ["encrypt", "decrypt"]);
}

async function encryptValue(plaintext) {
  const key = await getEncKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const data = enc.encode(String(plaintext));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: KEY_ALG, iv }, key, data));
  // Pack iv + ciphertext as base64
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptValue(encryptedB64) {
  if (!encryptedB64 || typeof encryptedB64 !== 'string') return null;
  const key = await getEncKey();
  const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: KEY_ALG, iv }, key, ciphertext);
  const text = new TextDecoder().decode(decrypted);
  const num = Number(text);
  return isNaN(num) ? text : num;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // --- Get user balances (decrypted) ---
    if (action === 'get_balances') {
      const balances = await base44.entities.UserBalance.filter({ userEmail: user.email });
      const decrypted = await Promise.all(
        balances.map(async (b) => ({
          ...b,
          amount: b.amountEncrypted ? await decryptValue(b.amountEncrypted) : b.amount
        }))
      );
      return Response.json({ balances: decrypted });
    }

    // --- Set balance (encrypted) ---
    if (action === 'set_balance') {
      const { coin, amount } = body;
      if (!coin || amount === undefined) return Response.json({ error: 'coin and amount required' }, { status: 400 });
      const encrypted = await encryptValue(amount);
      // Find existing
      const existing = await base44.entities.UserBalance.filter({ userEmail: user.email, coin });
      if (existing.length > 0) {
        const updated = await base44.asServiceRole.entities.UserBalance.update(existing[0].id, {
          amountEncrypted: encrypted,
          amount: 0 // Keep at 0 to not expose real value; encrypted field holds the truth
        });
        return Response.json({ success: true, coin, balance: amount });
      } else {
        const created = await base44.asServiceRole.entities.UserBalance.create({
          userEmail: user.email,
          coin,
          amount: 0,
          amountEncrypted: encrypted
        });
        return Response.json({ success: true, coin, balance: amount });
      }
    }

    // --- Add to balance (encrypted) ---
    if (action === 'add_balance') {
      const { coin, amount } = body;
      if (!coin || amount === undefined) return Response.json({ error: 'coin and amount required' }, { status: 400 });
      const existing = await base44.entities.UserBalance.filter({ userEmail: user.email, coin });
      let currentAmount = 0;
      if (existing.length > 0 && existing[0].amountEncrypted) {
        currentAmount = await decryptValue(existing[0].amountEncrypted);
      } else if (existing.length > 0) {
        currentAmount = existing[0].amount || 0;
      }
      const newAmount = Number(currentAmount) + Number(amount);
      const encrypted = await encryptValue(newAmount);
      if (existing.length > 0) {
        await base44.asServiceRole.entities.UserBalance.update(existing[0].id, {
          amountEncrypted: encrypted,
          amount: 0
        });
      } else {
        await base44.asServiceRole.entities.UserBalance.create({
          userEmail: user.email,
          coin,
          amount: 0,
          amountEncrypted: encrypted
        });
      }
      return Response.json({ success: true, coin, balance: newAmount });
    }

    // --- Subtract from balance (encrypted) ---
    if (action === 'subtract_balance') {
      const { coin, amount } = body;
      if (!coin || amount === undefined) return Response.json({ error: 'coin and amount required' }, { status: 400 });
      const existing = await base44.entities.UserBalance.filter({ userEmail: user.email, coin });
      if (existing.length === 0) return Response.json({ error: 'Insufficient balance' }, { status: 400 });
      let currentAmount = 0;
      if (existing[0].amountEncrypted) {
        currentAmount = await decryptValue(existing[0].amountEncrypted);
      } else {
        currentAmount = existing[0].amount || 0;
      }
      if (Number(currentAmount) < Number(amount)) {
        return Response.json({ error: 'Insufficient balance', current: currentAmount, requested: amount }, { status: 400 });
      }
      const newAmount = Number(currentAmount) - Number(amount);
      const encrypted = await encryptValue(newAmount);
      await base44.asServiceRole.entities.UserBalance.update(existing[0].id, {
        amountEncrypted: encrypted,
        amount: 0
      });
      return Response.json({ success: true, coin, balance: newAmount });
    }

    // --- Admin: get all user balances (decrypted) ---
    if (action === 'admin_get_all') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const balances = await base44.asServiceRole.entities.UserBalance.list('-created_date', 500);
      const decrypted = await Promise.all(
        balances.map(async (b) => ({
          ...b,
          amount: b.amountEncrypted ? await decryptValue(b.amountEncrypted) : b.amount
        }))
      );
      return Response.json({ balances: decrypted });
    }

    // --- Admin: set balance for specific user (encrypted) ---
    if (action === 'admin_set_balance') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { userEmail, coin, amount } = body;
      if (!userEmail || !coin || amount === undefined) return Response.json({ error: 'userEmail, coin, and amount required' }, { status: 400 });
      const encrypted = await encryptValue(amount);
      const existing = await base44.asServiceRole.entities.UserBalance.filter({ userEmail, coin });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.UserBalance.update(existing[0].id, {
          amountEncrypted: encrypted,
          amount: 0
        });
      } else {
        await base44.asServiceRole.entities.UserBalance.create({
          userEmail, coin, amount: 0, amountEncrypted: encrypted
        });
      }
      return Response.json({ success: true, userEmail, coin, balance: amount });
    }

    // --- Migrate: encrypt existing plaintext balances ---
    if (action === 'migrate_encrypt') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const balances = await base44.asServiceRole.entities.UserBalance.list('-created_date', 500);
      let migrated = 0;
      for (const b of balances) {
        if (!b.amountEncrypted && b.amount && b.amount > 0) {
          const encrypted = await encryptValue(b.amount);
          await base44.asServiceRole.entities.UserBalance.update(b.id, {
            amountEncrypted: encrypted,
            amount: 0
          });
          migrated++;
        }
      }
      return Response.json({ success: true, migrated, total: balances.length });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    console.error('secureBalanceManager error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});