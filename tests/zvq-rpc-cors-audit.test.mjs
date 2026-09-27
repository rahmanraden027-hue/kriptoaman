import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {evaluatePreflight,evaluateUnapprovedPreflight,parseRpcResult,classifyAdminResponse} from '../scripts/audit-zvq-rpc-cors.mjs';
const headers=(origin,methods='POST, OPTIONS',allowed='Content-Type')=>new Headers({
 'access-control-allow-origin':origin,'access-control-allow-methods':methods,
 'access-control-allow-headers':allowed
});
test('approved origin needs 204, exact ACAO, POST and content-type',()=>{
 const origin='https://explorer.kriptoaman.com';
 assert.equal(evaluatePreflight(204,headers(origin),origin).pass,true);
 assert.equal(evaluatePreflight(403,headers(origin),origin).pass,false);
 assert.equal(evaluatePreflight(204,headers('*'),origin).pass,false);
 assert.equal(evaluatePreflight(204,headers(origin,'GET'),origin).pass,false);
 assert.equal(evaluatePreflight(204,headers(origin,'POST','X-Unrelated'),origin).pass,false);
});
test('unapproved origin must be denied without wildcard ACAO',()=>{
 assert.equal(evaluateUnapprovedPreflight(403,new Headers()).pass,true);
 assert.equal(evaluateUnapprovedPreflight(403,new Headers({'access-control-allow-origin':'*'})).pass,false);
 assert.equal(evaluateUnapprovedPreflight(204,new Headers()).pass,false);
});
test('Chain ID and block height are verified, never estimated',()=>{
 assert.equal(parseRpcResult({jsonrpc:'2.0',result:'0x560c'},'eth_chainId'),'0x560c');
 assert.equal(parseRpcResult({jsonrpc:'2.0',result:'0xa5'},'eth_blockNumber'),'0xa5');
 assert.throws(()=>parseRpcResult({jsonrpc:'2.0',result:'0x1'},'eth_chainId'));
 assert.throws(()=>parseRpcResult({jsonrpc:'2.0',result:'synthetic'},'eth_blockNumber'));
});
test('audit is bounded, read-only and does not submit transactions',()=>{
 const source=readFileSync(new URL('../scripts/audit-zvq-rpc-cors.mjs',import.meta.url),'utf8');
 assert.match(source,/requestsMaximum:8/);
 assert.doesNotMatch(source,/eth_sendRawTransaction|personal_unlockAccount|debug_trace/i);
 assert.match(source,/admin_peers/);
});

test('HTTP 200 is denied only when JSON-RPC explicitly rejects the method',()=>{
 const error={jsonrpc:'2.0',id:3,error:{code:-32601,message:'Method not found'}};
 assert.equal(classifyAdminResponse(200,error).blocked,true);
 assert.equal(classifyAdminResponse(200,{jsonrpc:'2.0',error:{code:-32604,message:'Method not enabled'}}).blocked,true);
 assert.equal(classifyAdminResponse(403,null).blocked,true);
 assert.equal(classifyAdminResponse(200,{jsonrpc:'2.0',id:3,result:[]}).blocked,false);
 assert.equal(classifyAdminResponse(200,{jsonrpc:'2.0',id:3,error:{code:-32000,message:'backend unavailable'}}).blocked,false);
});
