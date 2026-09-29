import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FROM_CANDIDATE,TO,AMOUNT_WEI,ALLOWED,assertInputs,makeExtraReadOnlyRpc,preview,
} from '../scripts/zvq-million-transfer-readonly-preview.mjs';
import {RPCS} from '../scripts/verify-zvq-same-block-balances.mjs';

const candidate = {
  chain_id:22028,both_rpc_heads_advanced:true,
  common_block_number:'0x44',common_block_hash:'0x'+'a'.repeat(64),
  balances:[{address:'0xab481451eaf642384d2d9888b355f10d327c5de9',balance_wei:'0',providers_agree:true},
    {address:TO,balance_wei:'1000000000000000000',providers_agree:true}],
};
const sharedProof=async()=>candidate;
function extra({underfunded=false,divergent=false,estimateFail=false}={}) {
  return async (endpoint, method) => {
    if(method==='eth_getBalance') {
      if(divergent && endpoint===RPCS[1])return '0x2';
      return underfunded?'0x0':'0x' + (2000000n*10n**18n).toString(16);
    }
    if(method==='eth_gasPrice')return '0x3b9aca00'; // 1 gwei
    if(method==='eth_getCode')return '0x';
    if(method==='eth_getTransactionCount')return '0x2';
    if(method==='eth_estimateGas') {
      if(estimateFail)throw Error('insufficient funds or method not supported');
      return '0x5208'; // 21,000
    }
    throw Error('Unknown');
  };
}
test('historical candidate and proposed destination are well formed, 1m ZVQ is exact',()=>{
  assert.doesNotThrow(assertInputs);
  assert.match(FROM_CANDIDATE,/^0x[a-f0-9]{40}$/i);
  assert.match(TO,/^0x[a-f0-9]{40}$/i);
  assert.equal(AMOUNT_WEI.toString(),'1000000000000000000000000');
});
test('preview uses same-block independent evidence with exact gas arithmetic and no transaction',async()=>{
  const d=await preview({sharedProof,extra:extra()});
  assert.equal(d.classification,'PUBLIC_READONLY_PREVIEW_NOT_GENESIS_PROOF');
  assert.equal(d.source.balance_zvq,'2000000.000000000000000000');
  assert.equal(d.receiver.balance_zvq,'1.000000000000000000');
  assert.equal(d.preview.amount_zvq,'1000000.000000000000000000');
  assert.equal(d.preview.gas_limit_estimated,'21000');
  assert.equal(d.preview.max_sampled_fee_wei,'21000000000000');
  assert.equal(d.preview.sufficient_for_sampled_fee,true);
  assert.equal(d.preview.destination_balance_after_if_confirmed_zvq,'1000001.000000000000000000');
  assert.equal(d.transaction_submitted,false);
  assert.equal(d.signing_performed,false);
  assert.equal(d.ready_to_submit,false);
  assert.equal(d.source_genesis_verified,false);
  assert.equal(d.recipient_ownership_verified,false);
});
test('insufficient funds, divergent state and estimation refusal fail closed',async()=>{
  const insufficient=await preview({sharedProof,extra:extra({underfunded:true})});
  assert.equal(insufficient.preview.sufficient_for_sampled_fee,false);
  await assert.rejects(preview({sharedProof,extra:extra({divergent:true})}),/balances disagree/);
  const unsupported=await preview({sharedProof,extra:extra({estimateFail:true})});
  assert.equal(unsupported.preview.gas_limit_estimated,null);
  assert.equal(unsupported.preview.sufficient_for_sampled_fee,false);
  assert.match(unsupported.preview.estimate_error,/insufficient funds/);
});
test('only approved public endpoints and read-only method allowlist',async()=>{
  const seen=[];
  const rpc=makeExtraReadOnlyRpc(async(url,opts)=>{
    seen.push({url,method:JSON.parse(opts.body).method});
    return {ok:true,json:async()=>({jsonrpc:'2.0',result:'0x1'})};
  });
  assert.equal(await rpc(RPCS[0],'eth_gasPrice'),'0x1');
  await assert.rejects(rpc('https://elsewhere.example/','eth_gasPrice'),/Only bounded/);
  await assert.rejects(rpc(RPCS[0],'eth_sendRawTransaction',['0xdead']),/Only bounded/);
  await assert.rejects(rpc(RPCS[0],'personal_sign',[]),/Only bounded/);
  assert.deepEqual(seen,[{url:RPCS[0],method:'eth_gasPrice'}]);
  assert.ok([...ALLOWED].every(name=>name.startsWith('eth_')));
});
