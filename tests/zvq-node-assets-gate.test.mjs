import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const wallet=readFileSync('src/pages/Wallet.jsx','utf8');
const node=readFileSync('src/components/zevaryq-wallet/ZevaryqNodeMining.jsx','utf8');
const nav=readFileSync('src/components/zevaryq-wallet/WalletBottomNavigation.jsx','utf8');
test('node screen is accessible and read-only',()=>{
  assert.match(wallet,/screen==='node'&&<ZevaryqNodeMining/);
  assert.match(nav,/id:'node',label:'Node'/);
  assert.match(node,/data-mode="read-only"/);
  assert.match(node,/Validator enrollment, staking and rewards: disabled/);
  assert.match(node,/const POLL_MS = 30_000/);
  assert.match(node,/const STALE_MS = 90_000/);
  assert.match(node,/const MAX_LAG = 12/);
  assert.match(node,/delta < 0 \? 'CHECK SOURCES'/);
  assert.match(node,/Indexed block evidence/);
  assert.doesNotMatch(node,/sendTransaction|privateKey|eth_sendTransaction|mint\(/);
});
test('planned token identities are not presented as holdings',()=>{
  for(const symbol of ['zUSDT','zUSDC']) {
    assert.match(wallet,new RegExp("symbol: '"+symbol+"'"));
    assert.match(wallet,new RegExp(symbol.toLowerCase()+'-v2.svg'));
  }
  assert.match(wallet,/Identity preview only · not wallet holdings/);
  assert.match(wallet,/issuer\/bridge provenance and backing pending/);
});
