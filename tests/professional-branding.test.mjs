import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public and account entry screens use the official KriptoAman logo', async () => {
  const [authLayout, landing, kyc, market, profile, logo] = await Promise.all([
    read('src/components/AuthLayout.jsx'),
    read('src/components/landing/GLandingHero.jsx'),
    read('src/pages/KYC.jsx'),
    read('src/pages/Market.jsx'),
    read('src/pages/Profile.jsx'),
    read('src/components/brand/KriptoAmanLogo.jsx'),
  ]);

  for (const source of [authLayout, landing, kyc, market, profile]) {
    assert.match(source, /KriptoAmanLogo/);
  }
  assert.match(authLayout, /Digital Asset Monitoring/);
  assert.match(kyc, /KRIPTOAMAN IDENTITY/);
  assert.match(market, /text\.identity/);
  assert.match(logo, /kriptoaman-logo-primary\.png/);
  assert.match(logo, /alt="Logo KriptoAman"/);
});

test('authentication branding remains responsive and accessible', async () => {
  const authLayout = await read('src/components/AuthLayout.jsx');
  assert.match(authLayout, /max-w-md/);
  assert.match(authLayout, /sm:p-8/);
  assert.match(authLayout, /aria-hidden="true"/);
  assert.doesNotMatch(authLayout, /LogoSVG/);
});
