#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  return {
    file: argv.find((x) => x.startsWith('--file='))?.slice('--file='.length) || 'var/market-edge-observations.jsonl',
    top: Math.max(1, Number(argv.find((x) => x.startsWith('--top='))?.slice('--top='.length) || 15)),
  };
}

function round(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = path.resolve(args.file);
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      console.log(`No observation log yet: ${file}`);
      return;
    }
    throw error;
  }

  const rows = text.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });

  if (!rows.length) {
    console.log('No valid observations yet.');
    return;
  }

  const groups = new Map();
  for (const row of rows) {
    if (!row?.market || !row?.buyVenue || !row?.sellVenue) continue;
    const key = `${row.market}|${row.buyVenue}|${row.sellVenue}`;
    const current = groups.get(key) || {
      market: row.market,
      buyVenue: row.buyVenue,
      sellVenue: row.sellVenue,
      observations: 0,
      opportunities: 0,
      sumNetProfitBps: 0,
      bestNetProfitBps: -Infinity,
      latestNetProfitBps: null,
      latestAt: null,
    };
    const net = Number(row.netProfitBps);
    if (!Number.isFinite(net)) continue;
    current.observations += 1;
    current.opportunities += row.opportunity ? 1 : 0;
    current.sumNetProfitBps += net;
    current.bestNetProfitBps = Math.max(current.bestNetProfitBps, net);
    current.latestNetProfitBps = net;
    current.latestAt = row.timestamp || current.latestAt;
    groups.set(key, current);
  }

  const leaderboard = [...groups.values()].map((x) => ({
    market: x.market,
    route: `${x.buyVenue} -> ${x.sellVenue}`,
    observations: x.observations,
    opportunities: x.opportunities,
    avgNetBps: round(x.sumNetProfitBps / x.observations),
    bestNetBps: round(x.bestNetProfitBps),
    latestNetBps: round(x.latestNetProfitBps),
    latestAt: x.latestAt,
  })).sort((a, b) => b.bestNetBps - a.bestNetBps || b.avgNetBps - a.avgNetBps);

  console.table(leaderboard.slice(0, args.top));
  const totalOpportunities = leaderboard.reduce((sum, x) => sum + x.opportunities, 0);
  console.log(JSON.stringify({
    observations: rows.length,
    routes: leaderboard.length,
    opportunityObservations: totalOpportunities,
    best: leaderboard[0] || null,
  }));
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
