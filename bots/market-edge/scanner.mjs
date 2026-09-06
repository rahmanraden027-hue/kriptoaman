#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  SOL_MINT,
  decimalToRaw,
  rawToDecimal,
  orderedVenuePairs,
  routeLabels,
  hasSharedAmm,
  priceImpactPct,
  evaluateRoundTrip,
} from './lib.mjs';

const API_BASE = 'https://api.jup.ag/swap/v1';
const DEFAULT_CONFIG = new URL('./config.example.json', import.meta.url);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let minRequestGapMs = 1300;
let nextRequestAt = 0;

function parseArgs(argv) {
  return {
    once: argv.includes('--once'),
    listVenues: argv.includes('--list-venues'),
    config: argv.find((x) => x.startsWith('--config='))?.slice('--config='.length),
  };
}

async function loadConfig(fileArg) {
  const file = fileArg ? path.resolve(fileArg) : DEFAULT_CONFIG;
  const raw = await fs.readFile(file, 'utf8');
  const config = JSON.parse(raw);
  if (!Array.isArray(config.markets) || config.markets.length === 0) throw new Error('config.markets must contain at least one market');
  return config;
}

function headers() {
  const apiKey = process.env.JUPITER_API_KEY;
  if (!apiKey) throw new Error('Missing JUPITER_API_KEY. Create a free key in the Jupiter Developer Portal and export it locally. Never commit it.');
  return { 'x-api-key': apiKey };
}

async function waitForRequestSlot() {
  const waitMs = Math.max(0, nextRequestAt - Date.now());
  if (waitMs > 0) await sleep(waitMs);
  nextRequestAt = Date.now() + minRequestGapMs;
}

async function fetchJson(url, { max429Retries = 3 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    await waitForRequestSlot();
    const response = await fetch(url, { headers: headers() });
    if (response.ok) return response.json();

    const body = await response.text();
    if (response.status === 429 && attempt < max429Retries) {
      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      const retryMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? Math.ceil(retryAfterSeconds * 1000)
        : Math.max(minRequestGapMs, 1500 * (2 ** attempt));
      console.warn(`[rate-limit] HTTP 429 from Jupiter; retrying in ${retryMs}ms (${attempt + 1}/${max429Retries})`);
      await sleep(retryMs);
      continue;
    }
    throw new Error(`HTTP ${response.status}: ${body}`);
  }
}

async function getVenueLabels() {
  const data = await fetchJson(`${API_BASE}/program-id-to-label`);
  return [...new Set(Object.values(data || {}))].sort();
}

async function quote({ inputMint, outputMint, amountRaw, venue, slippageBps }) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amountRaw.toString(),
    slippageBps: String(slippageBps),
    instructionVersion: 'V2',
    onlyDirectRoutes: 'true',
    dexes: venue,
  });
  return fetchJson(`${API_BASE}/quote?${params}`);
}

async function appendJsonLine(file, payload) {
  if (!file) return;
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await fs.appendFile(file, `${JSON.stringify(payload)}\n`, 'utf8');
}

function marketBase(market) {
  return {
    mint: market.baseMint || SOL_MINT,
    decimals: Number.isInteger(market.baseDecimals) ? market.baseDecimals : 9,
    symbol: market.baseSymbol || 'SOL',
  };
}

async function scanMarket(config, market, availableVenues) {
  if (market.enabled === false) return [];
  const base = marketBase(market);
  const requestedVenues = market.venues || config.venues || [];
  const venues = requestedVenues.filter((v) => availableVenues.has(v));
  const unknown = requestedVenues.filter((v) => !availableVenues.has(v));
  if (unknown.length) console.warn(`[${market.symbol}] ignored unknown Jupiter venue labels: ${unknown.join(', ')}`);
  if (venues.length < 2) {
    console.log(`[${market.symbol}] no cross-venue arbitrage scan: need >=2 valid venues; have ${venues.length}`);
    return [];
  }

  const probeAmountRaw = decimalToRaw(market.probeAmountUi ?? config.probeAmountUi ?? '0.01', base.decimals);
  const slippageBps = Number(market.slippageBps ?? config.slippageBps ?? 30);
  const maxPriceImpactPct = Number(market.maxPriceImpactPct ?? config.maxPriceImpactPct ?? 1.0);
  const executionCostBps = Number(market.executionCostBps ?? config.executionCostBps ?? 20);
  const minNetProfitBps = Number(market.minNetProfitBps ?? config.minNetProfitBps ?? 50);
  const results = [];

  for (const [buyVenue, sellVenue] of orderedVenuePairs(venues)) {
    try {
      const buy = await quote({
        inputMint: base.mint,
        outputMint: market.mint,
        amountRaw: probeAmountRaw,
        venue: buyVenue,
        slippageBps,
      });
      if (!buy?.outAmount || BigInt(buy.outAmount) <= 0n) continue;
      if (priceImpactPct(buy) > maxPriceImpactPct) continue;

      const sell = await quote({
        inputMint: market.mint,
        outputMint: base.mint,
        amountRaw: BigInt(buy.outAmount),
        venue: sellVenue,
        slippageBps,
      });
      if (!sell?.outAmount || BigInt(sell.outAmount) <= 0n) continue;
      if (priceImpactPct(sell) > maxPriceImpactPct) continue;
      if (hasSharedAmm(buy, sell)) continue;

      const evaluation = evaluateRoundTrip({
        inputRaw: probeAmountRaw,
        outputRaw: BigInt(sell.outAmount),
        executionCostBps,
        minNetProfitBps,
      });

      const result = {
        timestamp: new Date().toISOString(),
        mode: 'PAPER_ONLY',
        market: market.symbol,
        mint: market.mint,
        base: base.symbol,
        probeAmountUi: rawToDecimal(probeAmountRaw, base.decimals),
        roundTripOutUi: rawToDecimal(BigInt(sell.outAmount), base.decimals),
        buyVenue,
        sellVenue,
        buyRoute: routeLabels(buy),
        sellRoute: routeLabels(sell),
        buyPriceImpactPct: priceImpactPct(buy),
        sellPriceImpactPct: priceImpactPct(sell),
        grossProfitBps: evaluation.grossProfitBps,
        executionCostBufferBps: executionCostBps,
        netProfitBps: evaluation.netProfitBps,
        opportunity: evaluation.profitable,
      };
      results.push(result);
      console.log(JSON.stringify(result));
      if (evaluation.profitable) await appendJsonLine(config.opportunityLogPath, result);
    } catch (error) {
      console.warn(`[${market.symbol}] ${buyVenue} -> ${sellVenue}: ${error?.message || error}`);
    }
  }
  return results;
}

async function runCycle(config, availableVenues) {
  const cycle = [];
  for (const market of config.markets) cycle.push(...await scanMarket(config, market, availableVenues));
  const opportunities = cycle.filter((x) => x.opportunity);
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), summary: true, scannedRoutes: cycle.length, opportunities: opportunities.length }));
  return opportunities;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.listVenues) {
    for (const label of await getVenueLabels()) console.log(label);
    return;
  }

  const config = await loadConfig(args.config);
  const configuredGap = Number(config.requestDelayMs ?? 1300);
  minRequestGapMs = Number.isFinite(configuredGap) ? Math.max(1100, configuredGap) : 1300;

  const labels = new Set(await getVenueLabels());
  console.log(`MarketEdge PAPER scanner started; Jupiter venues available: ${labels.size}; min request gap: ${minRequestGapMs}ms`);
  console.log('LIVE EXECUTION IS INTENTIONALLY DISABLED IN V1. No wallet key is loaded and no transaction can be signed.');

  do {
    await runCycle(config, labels);
    if (args.once) break;
    await sleep(Number(config.scanIntervalMs ?? 30000));
  } while (true);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
