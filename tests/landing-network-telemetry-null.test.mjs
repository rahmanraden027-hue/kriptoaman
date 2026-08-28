import assert from 'node:assert/strict';
import fs from 'node:fs';

const landing = fs.readFileSync(new URL('../src/pages/KriptoAmanGlobalLanding.jsx', import.meta.url), 'utf8');
const body = fs.readFileSync(new URL('../src/components/landing/GLandingBody.jsx', import.meta.url), 'utf8');

assert.match(landing, /networkActiveCount:\s*undefined/);
assert.doesNotMatch(landing, /networkActiveCount:\s*null/);
assert.match(body, /Number\.isFinite\(Number\(stats\?\.networkActiveCount\)\)/);

assert.equal(Number.isFinite(Number(undefined)), false, 'Unavailable telemetry must render as unknown, not zero');
assert.equal(Number.isFinite(Number(0)), true, 'A verified zero from the health endpoint remains a valid zero');

console.log('landing network telemetry null regression: ok');
