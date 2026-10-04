import assert from 'node:assert/strict';
import fs from 'node:fs';

const landing = fs.readFileSync(new URL('../src/pages/KriptoAmanGlobalLanding.jsx', import.meta.url), 'utf8');
const strip = fs.readFileSync(new URL('../src/components/landing/LandingLiveSystemStrip.jsx', import.meta.url), 'utf8');

assert.match(landing, /networkActiveCount:\s*undefined/);
assert.doesNotMatch(landing, /networkActiveCount:\s*null/);
assert.match(strip, /const chains = Number\(stats\?\.networkActiveCount\)/);
assert.match(strip, /Number\.isFinite\(chains\)/);

assert.equal(Number.isFinite(Number(undefined)), false, 'Unavailable telemetry must render as unknown, not zero');
assert.equal(Number.isFinite(Number(0)), true, 'A verified zero from the health endpoint remains a valid zero');

console.log('landing network telemetry null regression: ok');
