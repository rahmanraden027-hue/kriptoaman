import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { makePreview, previewParameters, rpc } from '../scripts/preview-zvq-genesis-1m-readonly.mjs';
const H='0x'+'a'.repeat(64), P='0x'+'b'.repeat(64);
function mock({sourceWei=2000000n*10n**18n,chain='0x560c',mismatch=false,estimateFails=false}={}) {
  let heightCalls=0;
  return async(url,method,params=[])=>{
    switch(method){
      case 'eth_chainId':return chain;
      case 'eth_blockNumber':return '0x'+(100n+BigInt(Math.floor(heightCalls++/2)*2)).toString(16);
      case 'eth_getBlockByNumber':return {number:params[0],hash:url.endsWith('/rpc')&&mismatch?'0x'+'c'.repeat(64):H,parentHash:P};
      case 'eth_getBalance':return params[0]===previewParameters.source?'0x'+sourceWei.toString(16):'0x0';
      case 'eth_getCode':return '0x';
      case 'eth_gasPrice':return '0x3b9aca00';
      case 'eth_estimateGas':if(estimateFails)throw new Error('upstream unavailable');return '0x5208';
      default:throw Error('unexpected read '+method);
    }
  };
}
test('strict approved one-million ZVQ preview has sufficient balance but no signature or send',async()=>{
  const p=await makePreview({read:mock(),sleep:async()=>{}});
  assert.equal(p.status,'balance-and-fee-sufficient');
  assert.equal(p.chain_id,22028);
  assert.equal(p.amount_wei,'1000000000000000000000000');
  assert.equal(p.gas_estimate,'21000');
  assert.equal(p.transactions_sent,0);
  assert.equal(p.signature_created,false);
  assert.equal(p.user_labelled_genesis_ownership_verified,false);
  assert.equal(p.balance_sufficient,true);
});
test('same-block independent consensus mismatch refuses preview',async()=>{
  await assert.rejects(()=>makePreview({read:mock({mismatch:true}),sleep:async()=>{}}),/mismatch|parent/i);
});
test('insufficient native balance blocks payment preview',async()=>{
  const p=await makePreview({read:mock({sourceWei:0n}),sleep:async()=>{}});
  assert.equal(p.balance_sufficient,false);
  assert.equal(p.status,'insufficient-balance');
});
test('failed estimate remains explicitly unverified even with EOA baseline',async()=>{
  const p=await makePreview({read:mock({estimateFails:true}),sleep:async()=>{}});
  assert.equal(p.gas_estimate,null);
  assert.equal(p.gas_limit_for_reserve,'21000');
  assert.match(p.estimate_warning,/upstream unavailable/);
});
test('reject wrong chain and disallow signing or transaction methods',async()=>{
  await assert.rejects(()=>makePreview({read:mock({chain:'0x1'}),sleep:async()=>{}}),/Wrong network/);
  await assert.rejects(()=>rpc('https://rpc.kriptoaman.com/','eth_sendRawTransaction',[]),/Read-only/);
  await assert.rejects(()=>rpc('https://rpc.kriptoaman.com/','personal_sign',[]),/Read-only/);
  const source=readFileSync(new URL('../scripts/preview-zvq-genesis-1m-readonly.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/privateKey|seedPhrase|signTransaction\s*\(/);
});