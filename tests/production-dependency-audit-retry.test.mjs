import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyAuditResult, runAuditWithRetries } from '../scripts/audit-production-deps.mjs';

const silentLogger = {
  log() {},
  error() {},
};

test('transient npm registry failures are retryable', () => {
  assert.equal(
    classifyAuditResult({
      exitCode: 1,
      stderr: 'npm warn audit 503 Service Unavailable - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick',
    }),
    'transient',
  );

  assert.equal(classifyAuditResult({ exitCode: 1, stderr: 'ECONNRESET while contacting registry.npmjs.org' }), 'transient');
  assert.equal(classifyAuditResult({ exitCode: 1, timedOut: true }), 'transient');
});

test('high or critical vulnerability reports are never retried as transient', () => {
  const stdout = JSON.stringify({
    auditReportVersion: 2,
    vulnerabilities: {
      vulnerablePackage: { severity: 'high', via: ['GHSA-example'] },
    },
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } },
  });

  assert.equal(
    classifyAuditResult({
      exitCode: 1,
      stdout,
      stderr: '503 text must not override an actual high-severity advisory',
    }),
    'vulnerability',
  );
});

test('unknown non-zero audit errors fail closed', () => {
  assert.equal(classifyAuditResult({ exitCode: 1, stderr: 'unexpected npm audit failure' }), 'failure');
});

test('bounded retry succeeds after transient registry recovery', async () => {
  let calls = 0;
  const sleeps = [];
  const results = [
    { exitCode: 1, stderr: '503 Service Unavailable' },
    { exitCode: 1, stderr: 'EAI_AGAIN registry.npmjs.org' },
    { exitCode: 0, stdout: JSON.stringify({ auditReportVersion: 2, vulnerabilities: {} }) },
  ];

  const outcome = await runAuditWithRetries({
    executor: async () => results[calls++],
    sleep: async (ms) => sleeps.push(ms),
    logger: silentLogger,
  });

  assert.equal(outcome.classification, 'success');
  assert.equal(outcome.attempts, 3);
  assert.equal(calls, 3);
  assert.deepEqual(sleeps, [5_000, 10_000]);
});

test('real vulnerability fails immediately without consuming retries', async () => {
  let calls = 0;
  const vulnerabilityReport = JSON.stringify({
    auditReportVersion: 2,
    vulnerabilities: { packageA: { severity: 'critical' } },
    metadata: { vulnerabilities: { high: 0, critical: 1 } },
  });

  await assert.rejects(
    runAuditWithRetries({
      executor: async () => {
        calls += 1;
        return { exitCode: 1, stdout: vulnerabilityReport };
      },
      sleep: async () => {
        throw new Error('sleep must not run for a vulnerability');
      },
      logger: silentLogger,
    }),
    (error) => error.category === 'vulnerability' && error.attempts === 1,
  );

  assert.equal(calls, 1);
});

test('persistent transient failure remains a hard failure after four attempts', async () => {
  let calls = 0;
  const sleeps = [];

  await assert.rejects(
    runAuditWithRetries({
      executor: async () => {
        calls += 1;
        return { exitCode: 1, stderr: '504 Gateway Timeout' };
      },
      sleep: async (ms) => sleeps.push(ms),
      logger: silentLogger,
    }),
    (error) => error.category === 'transient' && error.attempts === 4,
  );

  assert.equal(calls, 4);
  assert.deepEqual(sleeps, [5_000, 10_000, 20_000]);
});
