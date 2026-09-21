import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const html=await readFile(new URL('../explorer-dashboard/zevaryq-production.html',import.meta.url),'utf8');
const deploy=await readFile(new URL('../scripts/deploy-zevaryq-explorer.sh',import.meta.url),'utf8');
test('Zevaryq production identity and chain are explicit',()=>{
 assert.match(html,/data-zevaryq-explorer-version="1\.0\.0"/);
 assert.match(html,/ZEVARYQ EXPLORER/); assert.match(html,/Zevaryq Network/); assert.match(html,/ZVQ Mainnet/);
 assert.match(html,/Chain ID <b>22028/); assert.match(html,/EXPECTED_CHAIN='0x560c'/);
});
test('required production panels and search routes exist',()=>{
 for(const marker of ['Satellite Network View','Consensus & Finality','Global Node Topology','Network Performance','Infrastructure Status','Security Intelligence','Network Activity Flow','Mempool & Fee Intelligence','Validator Intelligence','Realtime Block Stream','Latest Blocks']) assert.match(html,new RegExp(marker));
 assert.match(html,/\/block\/'); assert.match(html,/\/tx\/'); assert.match(html,/\/address\//);
 assert.match(html,/setInterval\(probe,12000\)/);
});
test('unverified values fail closed',()=>{
 for(const fake of ['21 / 21','128+ nodes','3.4 TPS','1,236 pending transactions','100% Secure']) assert.equal(html.includes(fake),false);
 assert.match(html,/Topology data unavailable/); assert.match(html,/Mempool telemetry unavailable/); assert.match(html,/No values are estimated/);
});
test('deployment is narrow and rollback safe',()=>{
 assert.match(deploy,/kam-dashboard\/index\.html/); assert.match(deploy,/rollback/); assert.match(deploy,/0x560c/);
 assert.doesNotMatch(deploy,/kriptoaman\.com\/\*/); assert.doesNotMatch(deploy,/genesis|validator private|postgres.*reset|redis.*reset/i);
});