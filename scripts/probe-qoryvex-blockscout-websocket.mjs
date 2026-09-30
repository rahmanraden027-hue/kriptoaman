#!/usr/bin/env node
const candidates = [
  'wss://explorer.kriptoaman.com/socket/v2/websocket?locale=en&vsn=2.0.0',
  'wss://explorer.kriptoaman.com/socket/websocket?locale=en&vsn=2.0.0',
];

function probe(url, timeoutMs = 30000) {
  return new Promise((resolve) => {
    let socket;
    let joined = false;
    let finished = false;
    let heartbeat = null;
    const finish = (ok, reason, evidence = {}) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      clearInterval(heartbeat);
      try { socket?.close(); } catch {}
      resolve({ ok, url, joined, reason, ...evidence });
    };
    const timer = setTimeout(() => finish(false, joined ? 'joined-no-block-event' : 'timeout-before-join'), timeoutMs);

    try { socket = new WebSocket(url); }
    catch (error) { return finish(false, error?.message || 'constructor-failed'); }

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify(['1', '1', 'blocks:new_block', 'phx_join', {}]));
      heartbeat = setInterval(() => {
        if (socket.readyState === 1) socket.send(JSON.stringify([null, String(Date.now()), 'phoenix', 'heartbeat', {}]));
      }, 10000);
    });

    socket.addEventListener('message', (message) => {
      let payload;
      try { payload = JSON.parse(String(message.data)); } catch { return; }
      if (Array.isArray(payload) && payload.length >= 5) {
        const [, , topic, event, body] = payload;
        if (topic === 'blocks:new_block' && event === 'phx_reply' && body?.status === 'ok') {
          joined = true;
          return;
        }
        if (topic === 'blocks:new_block' && event === 'new_block') {
          return finish(true, 'new-block-event', {
            blockEvent: true,
            payloadType: typeof body,
            blockNumber: body?.block?.height ?? body?.block?.number ?? body?.height ?? body?.number ?? null,
          });
        }
      }
    });
    socket.addEventListener('error', () => finish(false, 'websocket-error'));
    socket.addEventListener('close', (event) => {
      if (!finished) finish(false, `closed-${event.code}`);
    });
  });
}

let last = null;
for (const url of candidates) {
  const result = await probe(url);
  console.log(JSON.stringify({ ...result, url: result.url.replace(/\?.*$/, '') }));
  if (result.ok) {
    console.log('qoryvex_blockscout_websocket=pass');
    process.exit(0);
  }
  last = result;
}
console.error('qoryvex_blockscout_websocket=failed', last?.reason || 'no-candidate');
process.exit(1);
