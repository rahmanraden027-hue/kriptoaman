import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('language selection persists and updates document language', async () => {
  const context = await read('src/lib/LanguageContext.jsx');
  assert.match(context, /ka_language/);
  assert.match(context, /localStorage\.setItem/);
  assert.match(context, /document\.documentElement\.lang = language/);
  assert.match(context, /navigator\.language/);
});

test('language selector is accessible and available on public, auth, and app surfaces', async () => {
  const [switcher, auth, layout, market] = await Promise.all([
    read('src/components/LanguageSwitcher.jsx'),
    read('src/components/AuthLayout.jsx'),
    read('src/Layout.jsx'),
    read('src/pages/Market.jsx'),
  ]);
  assert.match(switcher, /role="group"/);
  assert.match(switcher, /aria-pressed/);
  assert.match(auth, /LanguageSwitcher/);
  assert.match(layout, /LanguageSwitcher/);
  assert.match(market, /LanguageSwitcher/);
});

test('market provides bilingual identity and transparent methodology', async () => {
  const market = await read('src/pages/Market.jsx');
  assert.match(market, /KRIPTOAMAN MARKET INTELLIGENCE/);
  assert.match(market, /Pasar Kripto/);
  assert.match(market, /Crypto Market/);
  assert.match(market, /Sumber & metodologi/);
  assert.match(market, /Source & methodology/);
  assert.match(market, /Sumber pasar/);
  assert.match(market, /Market source/);
  assert.match(market, /tidak menjamin keuntungan/);
  assert.match(market, /does not guarantee returns/);
});


test('authentication surfaces follow the shared ID and EN language selection', async () => {
  const pages = await Promise.all([
    read('src/pages/Login.jsx'),
    read('src/pages/Register.jsx'),
    read('src/pages/ForgotPassword.jsx'),
    read('src/pages/ResetPassword.jsx'),
  ]);
  for (const page of pages) {
    assert.match(page, /useLanguage/);
    assert.match(page, /const COPY =/);
    assert.match(page, /\bid:/);
    assert.match(page, /\ben:/);
  }
});
