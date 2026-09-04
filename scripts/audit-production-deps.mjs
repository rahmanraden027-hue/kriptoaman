import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);

export const AUDIT_ARGS = ['audit', '--omit=dev', '--audit-level=high', '--json'];
export const DEFAULT_MAX_ATTEMPTS = 4;
export const DEFAULT_ATTEMPT_TIMEOUT_MS = 120_000;
export const DEFAULT_BACKOFF_MS = [5_000, 10_000, 20_000];

const TRANSIENT_AUDIT_PATTERN =
  /(?:\b(?:429|500|502|503|504)\b|service unavailable|audit endpoint returned an error|econnreset|etimedout|eai_again|enotfound|socket hang up|network timeout|fetch failed)/i;

function parseJson(text) {
  if (!text || !String(text).trim()) return null;
  try {
    return JSON.parse(String(text));
  } catch {
    return null;
  }
}

function hasHighSeverityFinding(report) {
  if (!report || typeof report !== 'object') return false;

  const counts = report?.metadata?.vulnerabilities;
  if (Number(counts?.high || 0) > 0 || Number(counts?.critical || 0) > 0) return true;

  const vulnerabilities = report?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== 'object') return false;

  return Object.values(vulnerabilities).some((finding) => {
    const severity = String(finding?.severity || '').toLowerCase();
    return severity === 'high' || severity === 'critical';
  });
}

export function classifyAuditResult({ exitCode, stdout = '', stderr = '', timedOut = false }) {
  if (exitCode === 0) return 'success';

  const report = parseJson(stdout);
  if (hasHighSeverityFinding(report)) return 'vulnerability';

  const combined = `${stdout}\n${stderr}`;
  if (timedOut || TRANSIENT_AUDIT_PATTERN.test(combined)) return 'transient';

  return 'failure';
}

export async function executeNpmAudit({ timeoutMs = DEFAULT_ATTEMPT_TIMEOUT_MS } = {}) {
  try {
    const { stdout = '', stderr = '' } = await execFileAsync('npm', AUDIT_ARGS, {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env: process.env,
    });
    return { exitCode: 0, stdout, stderr, timedOut: false };
  } catch (error) {
    const timedOut = Boolean(error?.killed || error?.signal === 'SIGTERM' || error?.code === 'ETIMEDOUT');
    const exitCode = typeof error?.code === 'number' ? error.code : 1;
    return {
      exitCode,
      stdout: error?.stdout || '',
      stderr: error?.stderr || error?.message || '',
      timedOut,
    };
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emitAuditOutput(result, logger) {
  if (result.stdout?.trim()) logger.log(result.stdout.trim());
  if (result.stderr?.trim()) logger.error(result.stderr.trim());
}

export async function runAuditWithRetries({
  executor = () => executeNpmAudit(),
  sleep = delay,
  logger = console,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  backoffMs = DEFAULT_BACKOFF_MS,
} = {}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new Error('maxAttempts must be a positive integer');

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    logger.log(`Production dependency audit attempt ${attempt}/${maxAttempts}`);
    const result = await executor(attempt);
    const classification = classifyAuditResult(result);

    if (classification === 'success') {
      emitAuditOutput(result, logger);
      logger.log('Production dependency audit passed.');
      return { attempts: attempt, classification };
    }

    if (classification !== 'transient') {
      emitAuditOutput(result, logger);
      const error = new Error(
        classification === 'vulnerability'
          ? 'Production dependency audit found a high/critical vulnerability.'
          : 'Production dependency audit failed with a non-transient error.',
      );
      error.category = classification;
      error.attempts = attempt;
      throw error;
    }

    emitAuditOutput(result, logger);
    if (attempt === maxAttempts) {
      const error = new Error(`Production dependency audit registry/network failure persisted after ${maxAttempts} attempts.`);
      error.category = 'transient';
      error.attempts = attempt;
      throw error;
    }

    const waitMs = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 0;
    logger.error(`Transient npm audit registry/network failure; retrying in ${waitMs}ms.`);
    if (waitMs > 0) await sleep(waitMs);
  }

  throw new Error('Production dependency audit exhausted unexpectedly.');
}

async function main() {
  await runAuditWithRetries();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  });
}
