#!/usr/bin/env node
// ONLY public read-only evidence for a proposed native ZVQ transfer. Never signs or submits.
// The source is a historical candidate; match it to the protected genesis.json before spending.
import { verify, RPCS, hexBigInt, format18 } from './verify-zvq-same-block-balances.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const FROM_CANDIDATE = '0xd74ea7d92bbb40d475bccea170367b85971acb0f';
export const TO = '0x9d4b034758202ce555504d038f92a344540d47b0';
export const AMOUNT_WEI = 1000000n * 10n ** 18n;
export const ALLOWED = new Set([
  'eth_getBalance', 'eth_getCode', 'eth_gasPrice',
  'eth_estimateGas', 'eth_getTransactionCount',
]);
export function assertInputs() {
  if (![FROM_CANDIDATE, TO].every(a => /^0x[0-9a-f]{40}$/i.test(a)) ||
      FROM_CANDIDATE.toLowerCase() === TO.toLowerCase()) {
    throw new Error('Invalid or identical transfer addresses');
  }
}
export function makeExtraReadOnlyRpc(fetchFn=fetch) {
  let calls=0;
  return async (url, method, params=[]) => {
    if (!RPCS.includes(url) || !ALLOWED.has(method) || ++calls > 9) {
      throw new Error('Only bounded public read-only RPC calls are permitted');
    }
    const response=await fetchFn(url, {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:calls,method,params}),
      signal:AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(method+' HTTP '+response.status);
    const body=await response.json();
    if (body?.jsonrpc!=='2.0' || body.error || body.result===null || body.result===undefined) {
      throw new Error(method+' refused by RPC');
    }
    return body.result;
  };
}
export async function preview({ sharedProof=verify, extra=makeExtraReadOnlyRpc() }={}) {
  assertInputs();
  const proof=await sharedProof(); // two independent RPCs agree on moving heads, block+parent hashes, recipient balance
  if(proof.chain_id!==22028 || !proof.both_rpc_heads_advanced || proof.balances.length!==2 ||
     !proof.balances.every(b=>b.providers_agree)) throw new Error('Unverified shared-block evidence');
  const tag=proof.common_block_number;
  const recipient=proof.balances.find(b=>b.address.toLowerCase()===TO.toLowerCase());
  if(!recipient)throw new Error('Recipient balance absent from independent proof');
  const fromValues=await Promise.all(RPCS.map(url=>extra(url,'eth_getBalance',[FROM_CANDIDATE,tag])));
  const sourceWei=fromValues.map(hexBigInt);
  if(sourceWei[0]!==sourceWei[1])throw new Error('Source RPC balances disagree at same block');
  const gasPrice=hexBigInt(await extra(RPCS[0],'eth_gasPrice'));
  const recipientCode=await extra(RPCS[0],'eth_getCode',[TO,tag]);
  if(typeof recipientCode!=='string' || !/^0x[0-9a-f]*$/i.test(recipientCode))throw new Error('Recipient code malformed');
  const nonce=hexBigInt(await extra(RPCS[0],'eth_getTransactionCount',[FROM_CANDIDATE,tag]));
  let estimatedGas=null,estimateError=null, gasFeeWei=null, requiredWei=null;
  try {
    const raw=await extra(RPCS[0],'eth_estimateGas',[{
      from:FROM_CANDIDATE,to:TO,value:'0x'+AMOUNT_WEI.toString(16),
    }]);
    estimatedGas=hexBigInt(raw);
    if(estimatedGas===0n || estimatedGas>30000000n)throw new Error('Unreasonable gas estimate');
    gasFeeWei=estimatedGas*gasPrice;
    requiredWei=AMOUNT_WEI+gasFeeWei;
  } catch(error) {
    // Do not infer gas limit when the RPC refuses or the account is underfunded.
    estimateError=String(error.message).slice(0,160);
  }
  const recipientWei=BigInt(recipient.balance_wei);
  return {
    observed_at:new Date().toISOString(),
    classification:'PUBLIC_READONLY_PREVIEW_NOT_GENESIS_PROOF',
    chain_id:22028,token:'ZVQ',decimals:18,
    at_block:tag,block_hash:proof.common_block_hash,
    both_rpc_heads_advanced:true,providers_agree:true,
    source:{address:FROM_CANDIDATE,origin:'historical Genesis candidate; exact protected genesis.json allocation not independently verified',
      balance_wei:sourceWei[0].toString(),balance_zvq:format18(sourceWei[0]),nonce_at_block:nonce.toString()},
    receiver:{address:TO,ownership_verified:false,balance_wei:recipientWei.toString(),
      balance_zvq:format18(recipientWei),is_contract:recipientCode!=='0x'},
    preview:{amount_zvq:'1000000.000000000000000000',amount_wei:AMOUNT_WEI.toString(),
      gas_price_wei:gasPrice.toString(),
      gas_limit_estimated:estimatedGas?.toString()??null,
      max_sampled_fee_wei:gasFeeWei?.toString()??null,
      max_sampled_fee_zvq:gasFeeWei===null?null:format18(gasFeeWei),
      total_required_wei:requiredWei?.toString()??null,
      sufficient_for_sampled_fee:requiredWei===null?false:sourceWei[0]>=requiredWei,
      estimate_error:estimateError,
      destination_balance_after_if_confirmed_zvq:format18(recipientWei+AMOUNT_WEI)},
    all_read_only:true,signing_performed:false,transaction_submitted:false,
    source_genesis_verified:false,recipient_ownership_verified:false,
    ready_to_submit:false,
  };
}
if(process.argv[1] && pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  try { console.log('ZVQ_MILLION_PREVIEW '+JSON.stringify(await preview())); }
  catch(e) { console.error('ZVQ_MILLION_PREVIEW_BLOCKED '+String(e.message)); process.exitCode=1; }
}
