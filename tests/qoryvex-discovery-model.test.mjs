import test from 'node:test';import assert from 'node:assert/strict';
import {assetPassport,launchDNA,discoveryRecord} from '../services/kriptoaman-indexer/discovery-model.mjs';
const A='0x'+'a'.repeat(40),H='0x'+'b'.repeat(64),T='0x'+'c'.repeat(64),C='0x'+'d'.repeat(40);
const event={contractAddress:A,blockNumber:100,blockHash:H,txHash:T,from:C,observedAt:1,confirmationState:'observed'};
test('passport refuses to call an unproven contract a token',()=>{const p=assetPassport(event,{});assert.equal(p.classification,'unclassified-contract');assert.equal(p.symbol,null)});
test('passport promotes only proven ERC-20 metadata',()=>{const p=assetPassport(event,{type:'ERC-20',name:'Alpha',symbol:'ALP'});assert.equal(p.classification,'verified-token');assert.equal(p.symbol,'ALP')});
test('launch DNA contains factual evidence and no investment score',()=>{const d=launchDNA(assetPassport(event,{type:'ERC-20',name:'Alpha',symbol:'ALP'}),{bytecode:'0x6000',headNumber:120});assert.equal(d.fingerprint.confirmations,20);assert.equal(d.fingerprint.bytecodeBytes,2);assert.equal('score' in d,false);assert.match(d.disclaimer,/not an audit/)});
test('QoryVEx discovery preserves provenance',()=>{const d=discoveryRecord(event,{type:'ERC-20',name:'Alpha',symbol:'ALP'},{headNumber:101});assert.equal(d.kind,'NEW_TOKEN');assert.equal(d.passport.provenance.txHash,T)});
test('invalid address never enters discovery',()=>assert.equal(discoveryRecord({...event,contractAddress:'bad'},{}),null));