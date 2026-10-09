import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestGet } from '../functions/api/zvq-liquidity-evidence.js';

const addr = character => '0x' + character.repeat(40);
const word = address => '0x' + address.slice(2).padStart(64, '0');
const integerWord = number => BigInt(number).toString(16).padStart(64, '0');
const router = addr('1');
const token = addr('2');
const factory = addr('3');
const wrapped = addr('4');
const pair = addr('5');
const goodHash = '0x' + 'a'.repeat(64);
const changedHash = '0x' + 'b'.repeat(64);

async function observe({ reorg = false, noPair = false, wrongChain = false } = {}) {
  const calls = [];
  let blockReads = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const request = JSON.parse(init.body);
    calls.push(request);
    let result;
    switch (request.method) {
      case 'eth_chainId': result = wrongChain ? '0x1' : '0x560c'; break;
      case 'eth_blockNumber': result = '0x9a'; break;
      case 'eth_getBlockByNumber':
        blockReads += 1;
        result = {number:'0x9a',hash:reorg && blockReads === 2 ? changedHash : goodHash};
        break;
      case 'eth_getCode': result = '0x6001'; break;
      case 'eth_call': {
        const selector = request.params[0].data.slice(0, 10);
        if (selector === '0xc45a0155') result = word(factory);
        else if (selector === '0xad5c4648') result = word(wrapped);
        else if (selector === '0xe6a43905') result = word(noPair ? addr('0') : pair);
        else if (selector === '0x0dfe1681') result = word(wrapped);
        else if (selector === '0xd21220a7') result = word(token);
        else if (selector === '0x0902f1ac') result = '0x' + integerWord(100) + integerWord(200) + integerWord(42);
        else throw Error('Unexpected eth_call selector ' + selector);
        break;
      }
      default: throw Error('Unexpected or unsafe RPC method ' + request.method);
    }
    return new Response(JSON.stringify({jsonrpc:'2.0',id:request.id,result}), {
      status: 200, headers: {'content-type':'application/json'},
    });
  };
  try {
    const response = await onRequestGet({ env: { ZEVARYQ_SWAP_ROUTER:router, ZEVARYQ_LIQUIDITY_TOKEN:token } });
    return { response, body:await response.json(), calls, blockReads };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('liquidity diagnostics pin every contract read to one block and verify its canonical hash twice', async () => {
  const { response, body, calls, blockReads } = await observe();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'live');
  assert.equal(body.snapshotBlock, '0x9a');
  assert.equal(body.snapshotBlockHash, goodHash);
  assert.equal(body.pair, pair);
  assert.equal(body.reserve0, '100');
  assert.equal(body.reserve1, '200');
  assert.equal(body.executionEnabled, false);
  assert.equal(blockReads, 2);
  const reads = calls.filter(x => x.method === 'eth_getCode' || x.method === 'eth_call');
  assert.equal(reads.length, 11);
  for (const call of reads) assert.equal(call.params[1], '0x9a', call.method + ' not pinned');
  assert.equal(calls.some(x => /send|personal|admin|debug|sign/i.test(x.method)), false);
});

test('read-only no-pair evidence also verifies canonical block hash', async () => {
  const { response, body, blockReads } = await observe({ noPair:true });
  assert.equal(response.status, 200);
  assert.equal(body.poolEvidence, 'NO_PAIR');
  assert.equal(body.liquidityEvidence, 'UNAVAILABLE');
  assert.equal(blockReads, 2);
  assert.equal(body.executionEnabled, false);
});

test('reorganization or conflicting block identity fails closed instead of claiming verified reserves', async () => {
  const { response, body, blockReads } = await observe({ reorg:true });
  assert.equal(response.status, 503);
  assert.equal(body.status, 'unavailable');
  assert.equal(body.code, 'LIQUIDITY_EVIDENCE_UNAVAILABLE');
  assert.equal(body.executionEnabled, false);
  assert.equal(blockReads, 2);
});

test('invalid chain identity refuses contract reads', async () => {
  const { response, body, calls } = await observe({ wrongChain:true });
  assert.equal(response.status, 503);
  assert.equal(body.executionEnabled, false);
  assert.equal(calls.some(x => x.method === 'eth_getCode' || x.method === 'eth_call'), false);
});

test('unconfigured registry remains 503 fail-closed and performs no RPC reads', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw Error('Must not access RPC without approved addresses'); };
  try {
    const response = await onRequestGet({env:{}});
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.code, 'REGISTRY_NOT_CONFIGURED');
    assert.equal(body.executionEnabled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
