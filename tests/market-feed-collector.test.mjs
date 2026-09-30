import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildConsensus, buildFeedPayload, normalizeObservation, normalizeVenueSymbol } from '../services/kriptoaman-market-feed/model.mjs';
import { coinbaseRows, krakenRows } from '../services/kriptoaman-market-feed/collector.mjs';
import { validatePayload, verifySignature } from '../functions/api/market-feed-ingest.js';

const NOW=1_800_000_000_000;

test('venue symbols normalize to canonical USD assets',()=>{
  assert.equal(normalizeVenueSymbol('BTC-USD'),'BTC');
  assert.equal(normalizeVenueSymbol('ETH/USD'),'ETH');
  assert.equal(normalizeVenueSymbol('BTC-USDT'),null);
});

test('observation validation rejects unsupported or invalid market data',()=>{
  assert.equal(normalizeObservation({venue:'coinbase',symbol:'BTC',price:100,observedAt:NOW})?.symbol,'BTC');
  assert.equal(normalizeObservation({venue:'fake',symbol:'BTC',price:100,observedAt:NOW}),null);
  assert.equal(normalizeObservation({venue:'kraken',symbol:'BTC',price:-1,observedAt:NOW}),null);
});

test('consensus uses fresh multi-venue observations and drops stale/outlier values',()=>{
  const rows=[
    {venue:'coinbase',symbol:'BTC',price:100,change24h:1,observedAt:NOW-1000},
    {venue:'kraken',symbol:'BTC',price:100.5,change24h:1.2,observedAt:NOW-900},
    {venue:'coinbase',symbol:'ETH',price:50,observedAt:NOW-500},
    {venue:'kraken',symbol:'ETH',price:5000,observedAt:NOW-400},
    {venue:'coinbase',symbol:'SOL',price:20,observedAt:NOW-30000},
  ];
  const data=buildConsensus(rows,NOW,20_000);
  const btc=data.find(x=>x.symbol==='BTC');
  assert.equal(btc.venueCount,2);
  assert.equal(btc.quality,'multi-venue');
  assert.ok(btc.price>100&&btc.price<100.5);
  const eth=data.find(x=>x.symbol==='ETH');
  assert.equal(eth.venueCount,1);
  assert.equal(eth.price,50);
  assert.equal(data.some(x=>x.symbol==='SOL'),false);
});

test('collector parsers normalize Coinbase and Kraken ticker messages',()=>{
  const cb=coinbaseRows({events:[{tickers:[{product_id:'BTC-USD',price:'101',price_percent_chg_24_h:'2',volume_24_h:'3',high_24_h:'105',low_24_h:'95'}]}]});
  assert.equal(cb[0].venue,'coinbase');
  assert.equal(cb[0].symbol,'BTC');
  assert.equal(cb[0].price,'101');

  const kr=krakenRows({channel:'ticker',data:[{symbol:'ETH/USD',last:51,change_pct:2.5,volume:100,high:55,low:48}]});
  assert.equal(kr[0].venue,'kraken');
  assert.equal(kr[0].symbol,'ETH');
  assert.equal(kr[0].price,51);
});

test('feed payload separates KriptoAman collector ownership from venue origin',()=>{
  const rows=[
    {venue:'coinbase',symbol:'BTC',price:100,observedAt:NOW-100},
    {venue:'kraken',symbol:'BTC',price:100.1,observedAt:NOW-90},
    {venue:'coinbase',symbol:'ETH',price:50,observedAt:NOW-100},
    {venue:'kraken',symbol:'ETH',price:50.1,observedAt:NOW-90},
    {venue:'coinbase',symbol:'SOL',price:20,observedAt:NOW-100},
    {venue:'kraken',symbol:'SOL',price:20.1,observedAt:NOW-90},
    {venue:'coinbase',symbol:'XRP',price:1,observedAt:NOW-100},
    {venue:'kraken',symbol:'XRP',price:1.001,observedAt:NOW-90},
    {venue:'coinbase',symbol:'ADA',price:.5,observedAt:NOW-100},
    {venue:'kraken',symbol:'ADA',price:.501,observedAt:NOW-90},
    {venue:'coinbase',symbol:'DOGE',price:.1,observedAt:NOW-100},
    {venue:'kraken',symbol:'DOGE',price:.101,observedAt:NOW-90},
    {venue:'coinbase',symbol:'AVAX',price:30,observedAt:NOW-100},
    {venue:'kraken',symbol:'AVAX',price:30.1,observedAt:NOW-90},
    {venue:'coinbase',symbol:'DOT',price:8,observedAt:NOW-100},
    {venue:'kraken',symbol:'DOT',price:8.01,observedAt:NOW-90},
  ];
  const payload=buildFeedPayload(rows,{coinbase:{connected:true,lastMessageAt:NOW},kraken:{connected:true,lastMessageAt:NOW}},NOW);
  assert.equal(payload.status,'live');
  assert.equal(payload.collector.ownership,'KriptoAman');
  assert.equal(payload.provenance.marketPriceOrigin,'external-trading-venues');
  assert.equal(payload.provenance.browserDirectVenueAccess,false);
  assert.equal(payload.collector.syntheticValues,false);
  assert.equal(validatePayload(payload),true);
});

test('HMAC ingest verification accepts exact body and rejects tampering',async()=>{
  const body='{"schema":"kriptoaman.market-feed.v1"}';
  const timestamp=String(Date.now());
  const secret='test-secret-123';
  const sig=crypto.createHmac('sha256',secret).update(timestamp+'.'+body).digest('hex');
  assert.equal(await verifySignature(secret,timestamp,body,sig),true);
  assert.equal(await verifySignature(secret,timestamp,body+'x',sig),false);
});
