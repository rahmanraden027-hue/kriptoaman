import { readFile } from 'node:fs/promises';

const evidencePath = process.argv[2];
if (!evidencePath) throw new Error('Usage: node verify-backup-restore-evidence.mjs <evidence.json>');

const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
const checksumPattern = /^[0-9a-f]{64}$/i;
const testedAt = Date.parse(evidence.testedAt);
const snapshotBlock = Number(evidence.snapshotBlock);
const restoredBlock = Number(evidence.restoredBlock);

const checks = {
  status: evidence.status === 'passed',
  recentTimestamp: Number.isFinite(testedAt) && testedAt <= Date.now() && Date.now() - testedAt <= 7 * 24 * 60 * 60 * 1000,
  backupChecksum: checksumPattern.test(String(evidence.backupChecksumSha256 || '')),
  restoredDataChecksum: checksumPattern.test(String(evidence.restoredDataChecksumSha256 || '')),
  restoredHeight: Number.isInteger(snapshotBlock) && Number.isInteger(restoredBlock) && restoredBlock >= snapshotBlock,
  isolatedTarget: evidence.restoreTarget === 'isolated-non-production',
};

const result = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  sourceFile: 'redacted-local-evidence',
  checks,
  ready: Object.values(checks).every(Boolean),
};

console.log(JSON.stringify(result, null, 2));
if (!result.ready) process.exitCode = 1;
