const endpoints = [
  'http://127.0.0.1:8648',
  'http://127.0.0.1:8545',
];

async function rpc(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: [] }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json())?.result ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function wsProbe(url) {
  return await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.close(); } catch {}
      resolve(value);
    };
    const socket = new WebSocket(url);
    const timer = setTimeout(() => finish(false), 4000);
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }));
    });
    socket.addEventListener('message', (message) => {
      try {
        const payload = JSON.parse(String(message.data));
        finish(String(payload?.result || '').toLowerCase() === '0x560c');
      } catch { finish(false); }
    });
    socket.addEventListener('error', () => finish(false), { once: true });
  });
}

let selectedHttp = null;
let blockNumber = null;
for (const url of endpoints) {
  const chain = String(await rpc(url, 'eth_chainId') || '').toLowerCase();
  if (chain !== '0x560c') continue;
  selectedHttp = url;
  blockNumber = await rpc(url, 'eth_blockNumber');
  break;
}

if (!selectedHttp) {
  console.error('FIRST_PARTY_ZVQ_HTTP=unavailable');
  process.exit(1);
}

const wsCandidates = ['ws://127.0.0.1:8546', 'ws://127.0.0.1:8649'];
let selectedWs = null;
for (const url of wsCandidates) {
  if (await wsProbe(url)) { selectedWs = url; break; }
}

console.log(`FIRST_PARTY_ZVQ_HTTP=verified endpoint=${selectedHttp} block=${blockNumber || 'unknown'}`);
console.log(`FIRST_PARTY_ZVQ_WS=${selectedWs ? `verified endpoint=${selectedWs}` : 'not-detected; listener will use first-party HTTP head polling while serving its own downstream WebSocket'}`);
