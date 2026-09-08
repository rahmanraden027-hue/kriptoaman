import { readFile, writeFile } from 'node:fs/promises';

const files = {
  index: 'explorer-dashboard/index.html',
  status: 'explorer-dashboard/status.html',
  validators: 'explorer-dashboard/validators.html',
  addresses: 'explorer-dashboard/addresses.html',
  stats: 'explorer-dashboard/stats.html',
};

const checkOnly = process.argv.includes('--check');

function replaceOnce(text, from, to, label) {
  const first = text.indexOf(from);
  if (first < 0) throw new Error(`refinement anchor missing: ${label}`);
  if (text.indexOf(from, first + from.length) >= 0) throw new Error(`refinement anchor duplicated: ${label}`);
  return text.slice(0, first) + to + text.slice(first + from.length);
}

async function patch(path, transform) {
  const original = await readFile(path, 'utf8');
  const refined = transform(original);
  if (refined === original) throw new Error(`no refinement produced for ${path}`);
  if (!checkOnly) await writeFile(path, refined);
  return refined;
}

const index = await patch(files.index, text => {
  text = replaceOnce(text,
    '<nav class="toplinks" aria-label="Explorer navigation"><a class="miniLink" href="/blocks">Blocks</a><a class="miniLink" href="/txs">Transactions</a><a class="miniLink" href="/tokens">Tokens</a><a class="miniLink" href="/api-docs">API</a></nav>',
    '<nav class="toplinks" aria-label="Explorer navigation"><a class="miniLink" href="/blocks">Blocks</a><a class="miniLink" href="/txs">Transactions</a><a class="miniLink" href="/addresses">Addresses</a><a class="miniLink" href="/validators">Validators</a><a class="miniLink" href="/developer">Network</a><a class="miniLink" href="/api-docs">API</a></nav>',
    'homepage primary navigation');
  text = replaceOnce(text,
    'placeholder="Search address / transaction / block number…"',
    'placeholder="Search address / transaction / block / token or contract…"',
    'homepage search placeholder');
  text = replaceOnce(text,
    '<span>Indexer distance</span><b class="state" id="hDistance">—</b>',
    '<span>Indexer state</span><b class="state" id="hDistance">—</b>',
    'indexer label');
  text = replaceOnce(text,
    '.state.warn{color:var(--amber)}',
    '.state.warn{color:var(--amber)}.state.info{color:#7dd3fc}',
    'neutral integrity state');
  text = replaceOnce(text,
    '<nav class="quick" aria-label="Quick explorer links"><a href="/blocks">▣ Blocks</a><a href="/txs">⇄ Transactions</a><a href="/addresses">◉ Addresses</a><a href="/tokens">◇ Tokens</a><a href="/stats">⌁ Stats</a><a href="/api-docs">{ } API</a></nav>',
    '<nav class="quick" aria-label="Quick explorer links"><a href="/blocks">▣ Blocks</a><a href="/txs">⇄ Transactions</a><a href="/addresses">◉ Addresses</a><a href="/tokens">◇ Tokens</a><a href="/validators">◎ Validators</a><a href="/developer">⌘ Network</a><a href="/stats">⌁ Stats</a><a href="/api-docs">{ } API</a></nav>',
    'homepage quick navigation');
  text = replaceOnce(text,
    "$('hRpc').textContent=rpcR.error?'Browser CORS unavailable':`${rpcR.ms} ms`;$('hRpc').className='state '+(rpcR.error?'warn':'ok');",
    "if(rpcR.error){$('hRpc').textContent='Browser access restricted';$('hRpc').className='state info'}else{$('hRpc').textContent=`Reachable · ${rpcR.ms} ms`;$('hRpc').className='state ok'}",
    'RPC browser policy');
  text = replaceOnce(text,
    "const distance=state.rpcHeight&&latest?Math.abs(state.rpcHeight-latest.height):null;$('hDistance').textContent=distance==null?'Unavailable':`${distance} block${distance===1?'':'s'}`;$('hDistance').className='state '+(distance==null?'warn':distance<=5?'ok':'warn');",
    "const distance=state.rpcHeight!=null&&latest?Math.abs(state.rpcHeight-Number(latest.height)):null;if(distance!=null){$('hDistance').textContent=distance<=5?`Synced · ${distance} block${distance===1?'':'s'}`:`Lagging · ${distance} blocks`;$('hDistance').className='state '+(distance<=5?'ok':'warn')}else if(latest&&latestAge<30){$('hDistance').textContent='Fresh indexed head';$('hDistance').className='state ok'}else{$('hDistance').textContent='Freshness pending';$('hDistance').className='state warn'}",
    'indexer freshness state');
  text = replaceOnce(text,
    '</style>\n</head>',
    `</style>\n<style>\n@media(max-width:720px){\n  .table{min-width:0}.table thead{display:none}.table,.table tbody,.table tr,.table td{display:block;width:100%}.table tr{padding:8px 0;border-bottom:1px solid rgba(83,144,209,.12)}.table tr:last-child{border-bottom:0}.table td{border:0;white-space:normal;padding:6px 4px}.table td+td{color:#9eb6ce}.tablePanel .tableWrap{overflow:visible}\n}\n</style>\n</head>`,
    'mobile table cards');
  return text;
});

const status = await patch(files.status, text => {
  text = replaceOnce(text,
    '<nav class="nav"><a href="/">Explorer</a><a href="/developer">Developers</a><a href="/stats">Stats</a><a href="/contracts">Contracts</a></nav>',
    '<nav class="nav"><a href="/">Explorer</a><a href="/blocks">Blocks</a><a href="/txs">Transactions</a><a href="/validators">Validators</a><a href="/developer">Network</a></nav>',
    'status navigation');
  text = replaceOnce(text,
    '<h1>Operational evidence, not decorative uptime claims.</h1>',
    '<h1>Live operational evidence for KAM Network.</h1>',
    'status positive heading');
  return text;
});

const validators = await patch(files.validators, text => {
  text = replaceOnce(text, 'KAM Proposer Observatory · KriptoAman Mainnet', 'KAM Validators & Proposers · KriptoAman Mainnet', 'validator title');
  text = replaceOnce(text, '<strong>KAM Proposer Observatory</strong>', '<strong>KAM Validators & Proposers</strong>', 'validator brand');
  text = replaceOnce(text,
    '<nav class="nav"><a href="/">Explorer</a><a href="/developer">Developers</a><a href="/addresses">Addresses</a><a href="/contracts">Contracts</a></nav>',
    '<nav class="nav"><a href="/">Explorer</a><a href="/blocks">Blocks</a><a href="/txs">Transactions</a><a href="/addresses">Addresses</a><a href="/developer">Network</a></nav>',
    'validator navigation');
  text = replaceOnce(text,
    '<h1>Observe block proposers without inventing validator data.</h1>',
    '<h1>Observe proposer activity with verifiable consensus evidence.</h1>',
    'validator positive heading');
  return text;
});

const addresses = await patch(files.addresses, text => {
  text = replaceOnce(text,
    '<nav class="nav"><a href="/">Explorer</a><a href="/developer">Developers</a><a href="/validators">Proposers</a><a href="/contracts">Contracts</a></nav>',
    '<nav class="nav"><a href="/">Explorer</a><a href="/blocks">Blocks</a><a href="/txs">Transactions</a><a href="/validators">Validators</a><a href="/developer">Network</a></nav>',
    'addresses navigation');
  text = replaceOnce(text,
    'Address detail pages remain served by the underlying Blockscout explorer.',
    'Open any address for the full Blockscout detail surface: KAM balance, transaction history, token activity, and contract fields when indexed.',
    'address detail guidance');
  return text;
});

const stats = await patch(files.stats, text => {
  text = replaceOnce(text,
    '<h1><em>Network statistics</em><br/>without invented data.</h1>',
    '<h1><em>Network statistics</em><br/>built on verifiable on-chain data.</h1>',
    'stats positive heading');
  return text;
});

for (const [name, html] of Object.entries({ index, status, validators, addresses, stats })) {
  if (/Browser CORS unavailable/.test(html)) throw new Error(`${name}: legacy browser CORS warning remains`);
}
if (!index.includes('Browser access restricted') || !index.includes('Fresh indexed head')) throw new Error('homepage integrity refinement incomplete');
if (!validators.includes('does not claim stake weight, validator uptime')) throw new Error('validator evidence boundary missing');
if (!addresses.includes('not a fabricated holder ranking')) throw new Error('address evidence boundary missing');
if (!status.match(/may intentionally restrict browser CORS/i)) throw new Error('status CORS boundary missing');

console.log(checkOnly ? 'KAM Explorer priority refinement anchors verified.' : 'KAM Explorer priority refinement applied.');
