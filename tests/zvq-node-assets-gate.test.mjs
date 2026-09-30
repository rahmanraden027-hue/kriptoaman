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
  assert.match(node,/Node rewards',value:'Not enabled'/);
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
