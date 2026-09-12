import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('global markets prefer a server-side professional provider and preserve reference fallback', async () => {
  const endpoint = await read('functions/api/global-markets.js');
  assert.match(endpoint, /TWELVE_DATA_API_KEY/);
  assert.match(endpoint, /Authorization:\s*`apikey \$\{apiKey\}`/);
  assert.match(endpoint, /ExchangeRate\.fun/);
  assert.match(endpoint, /fallback-reference/);
  assert.match(endpoint, /professional/);
  assert.match(endpoint, /XAU\/USD/);
  assert.match(endpoint, /DXY/);
  assert.doesNotMatch(endpoint, /TWELVE_DATA_API_KEY\s*=\s*['"][^'"]+['"]/);
});

test('OHLC endpoint is allowlisted and never exposes the provider key to the browser', async () => {
  const endpoint = await read('functions/api/global-markets-history.js');
  assert.match(endpoint, /ALLOWED_SYMBOLS/);
  assert.match(endpoint, /ALLOWED_INTERVALS/);
  assert.match(endpoint, /XAU\/USD/);
  assert.match(endpoint, /BTC\/USD/);
  assert.match(endpoint, /DXY/);
  assert.match(endpoint, /Authorization:\s*`apikey \$\{apiKey\}`/);
  assert.match(endpoint, /Data provided by Twelve Data/);
  assert.doesNotMatch(endpoint, /apikey=\$\{apiKey\}/);
});

test('cross-asset intelligence calculates descriptive statistics rather than signals', async () => {
  const endpoint = await read('functions/api/global-market-intelligence.js');
  assert.match(endpoint, /Pearson correlation/);
  assert.match(endpoint, /sqrt\(252\)/);
  assert.match(endpoint, /20-session/);
  assert.match(endpoint, /btcGold/);
  assert.match(endpoint, /goldDxy/);
  assert.match(endpoint, /btcDxy/);
  assert.match(endpoint, /not forecasts, investment advice, or trading signals/);
  assert.doesNotMatch(endpoint, /buySignal|sellSignal|executeTrade|placeOrder/i);
});

test('economic calendar requires an explicit provider credential and does not use guest access', async () => {
  const endpoint = await read('functions/api/economic-calendar.js');
  assert.match(endpoint, /TRADING_ECONOMICS_CREDENTIAL/);
  assert.match(endpoint, /calendar\/country\/united%20states/);
  assert.match(endpoint, /importance >= 2/);
  assert.doesNotMatch(endpoint, /guest:guest/);
});

test('Market V2 composes professional intelligence without removing KAM and crypto surfaces', async () => {
  const marketPage = await read('src/pages/MarketGlobal.jsx');
  const v2 = await read('src/components/market/GlobalMarketsHubV2.jsx');
  const panel = await read('src/components/market/GlobalMarketIntelligencePanel.jsx');
  assert.match(marketPage, /GlobalMarketsHubV2/);
  assert.match(marketPage, /MarketWithKAM/);
  assert.match(v2, /GlobalMarketsHub/);
  assert.match(v2, /GlobalMarketIntelligencePanel/);
  assert.match(panel, /Gold · Dollar · Crypto Context/);
  assert.match(panel, /Local Price Alert/);
  assert.match(panel, /tidak melakukan transaksi/);
  assert.match(panel, /Twelve Data/);
});
