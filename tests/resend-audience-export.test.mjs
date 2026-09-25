import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(
  new URL('../base44/functions/exportResendContacts/entry.ts', import.meta.url),
  'utf8'
).replace(/^import\s+\{[^\n]+\}\s+from\s+[^\n]+;\s*/m, '');

function loadHandler({ role = 'admin', pages = [{ data: [], has_more: false }] } = {}) {
  let handler;
  let listCalls = 0;
  const sdk = {
    auth: { me: async () => role === null ? null : { role } },
    asServiceRole: {
      entities: {
        User: {
          list: async () => {
            const result = pages[listCalls++];
            if (!result) throw new Error('Unexpected page request');
            return result;
          }
        }
      }
    }
  };
  runInNewContext(source, {
    createClientFromRequest: () => sdk,
    Deno: { serve: (fn) => { handler = fn; } },
    Response,
    console: { error: () => {} }
  });
  return { handler, calls: () => listCalls };
}

const verified = (email, extra = {}) => ({
  email,
  email_verified: true,
  marketing_opt_in: true,
  ...extra
});

test('rejects unauthenticated and non-admin requests without querying records', async () => {
  for (const [role, status] of [[null, 401], ['user', 403]]) {
    const { handler, calls } = loadHandler({ role });
    const result = await handler({ method: 'POST' });
    assert.equal(result.status, status);
    assert.equal(calls(), 0);
  }
  const { handler, calls } = loadHandler();
  const result = await handler({ method: 'GET' });
  assert.equal(result.status, 405);
  assert.equal(calls(), 0);
});

test('exports only distinct, verified, explicitly opted-in email addresses', async () => {
  const { handler } = loadHandler({
    pages: [
      {
        has_more: true,
        data: [
          verified('KEEP@example.com'),
          verified('DuP@example.com'),
          verified('excluded@example.com', { email_verified: false }),
          verified('unsub@example.com', { unsubscribed: true })
        ]
      },
      {
        has_more: false,
        data: [
          verified('keep@example.com'),
          verified('dup@example.com', { marketing_opt_in: false }),
          { email: 'unknown@example.com', email_verified: true },
          verified('=malicious@example.com'),
          verified('second@example.org', { email_verified: false, email_verified_at: '2026-01-01' })
        ]
      }
    ]
  });

  const response = await handler({ method: 'POST' });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const data = await response.json();
  assert.equal(data.sent, 0);
  assert.equal(data.totalAccounts, 9);
  assert.equal(data.eligibleCount, 2);
  assert.equal(data.csv, 'email\r\nkeep@example.com\r\nsecond@example.org\r\n');
  assert.doesNotMatch(data.csv, /dup@|unsub@|unknown@|malicious@/);
});

test('never provides partial CSV on a pagination failure', async () => {
  const { handler } = loadHandler({
    pages: [{ has_more: true, data: [verified('only@example.com')] }]
  });
  const response = await handler({ method: 'POST' });
  assert.equal(response.status, 500);
  const data = await response.json();
  assert.equal(data.csv, undefined);
  assert.doesNotMatch(JSON.stringify(data), /only@example.com/);
});
