const RPC = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const DEPLOYER = '0x9D4b034758202cE555504d038F92A344540D47B0';
const EXPECTED_FACTORY = '0x5024017B0496113269E80817d9b0F11733AE6de2';
const EXPECTED_ROUTER = '0x4a413674245EE0959183604C153e386C00409122';
const RECORDED_BLOCK = 384625;

async function rpc(method, params = []) {
  const response = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

function same(a, b) {
  return Boolean(a && b && String(a).toLowerCase() === String(b).toLowerCase());
}

const blockHex = `0x${RECORDED_BLOCK.toString(16)}`;
const block = await rpc('eth_getBlockByNumber', [blockHex, true]);
if (!block) throw new Error(`Block ${RECORDED_BLOCK} not found`);

const candidateTransactions = (block.transactions || []).filter((tx) => same(tx.from, DEPLOYER));
const receipts = [];
for (const tx of candidateTransactions) {
  const receipt = await rpc('eth_getTransactionReceipt', [tx.hash]);
  receipts.push({
    txHash: tx.hash,
    nonce: tx.nonce,
    to: tx.to,
    inputBytes: tx.input && tx.input !== '0x' ? (tx.input.length - 2) / 2 : 0,
    status: receipt?.status ?? null,
    contractAddress: receipt?.contractAddress ?? null,
    gasUsed: receipt?.gasUsed ?? null,
    blockNumber: receipt?.blockNumber ?? null,
  });
}

const factoryReceipt = receipts.find((item) => same(item.contractAddress, EXPECTED_FACTORY)) || null;
const routerReceipt = receipts.find((item) => same(item.contractAddress, EXPECTED_ROUTER)) || null;

const report = {
  checkedAt: new Date().toISOString(),
  mode: 'READ_ONLY_DEPLOYMENT_PROVENANCE_RECOVERY',
  rpc: RPC,
  deployer: DEPLOYER,
  blockNumber: RECORDED_BLOCK,
  blockHash: block.hash,
  transactionCount: (block.transactions || []).length,
  deployerTransactionCount: candidateTransactions.length,
  deployerReceipts: receipts,
  recovered: {
    factory: factoryReceipt,
    router: routerReceipt,
  },
  checks: {
    factoryCreationRecovered: Boolean(factoryReceipt),
    routerCreationRecovered: Boolean(routerReceipt),
    factorySucceeded: factoryReceipt?.status === '0x1',
    routerSucceeded: routerReceipt?.status === '0x1',
  },
};

console.log(JSON.stringify(report, null, 2));
if (!Object.values(report.checks).every(Boolean)) process.exitCode = 1;
