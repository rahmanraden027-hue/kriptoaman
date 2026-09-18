const targets = [
  { name: 'public-rpc', url: 'https://rpc.kriptoaman.com' },
  { name: 'explorer-public-rpc', url: 'https://explorer.kriptoaman.com/rpc' },
  { name: 'explorer-new-rpc', url: 'https://explorer-new.kriptoaman.com/rpc' },
  { name: 'explorer-origin-ip', url: 'http://146.190.93.254/rpc' },
  { name: 'explorer-origin-ip-host', url: 'http://146.190.93.254/rpc', host: 'explorer-new.kriptoaman.com' },
];

async function probe(target) {
  const started = Date.now();
  try {
    const response = await fetch(target.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(target.host ? { host: target.host } : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    const text = await response.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch {}
    return {
      name: target.name,
      url: target.url,
      status: response.status,
      location: response.headers.get('location'),
      chainId: payload?.result ?? null,
      rpcError: payload?.error ?? null,
      bodyPreview: payload ? undefined : text.slice(0, 160),
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      name: target.name,
      url: target.url,
      status: null,
      error: String(error?.message || error),
      latencyMs: Date.now() - started,
    };
  }
}

const results = [];
for (const target of targets) results.push(await probe(target));
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
