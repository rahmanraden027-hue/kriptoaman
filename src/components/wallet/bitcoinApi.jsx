// Uses BlockCypher public API (no API key required for basic usage)
const BASE_URL = 'https://api.blockcypher.com/v1/btc/main';

export async function getAddressInfo(address) {
  const res = await fetch(`${BASE_URL}/addrs/${address}/balance`);
  if (!res.ok) throw new Error('Failed to fetch balance');
  return res.json();
}

export async function getTransactions(address) {
  const res = await fetch(`${BASE_URL}/addrs/${address}/full?limit=50`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const data = await res.json();
  
  const txs = (data.txs || []).map(tx => {
    const isReceived = tx.outputs.some(o => o.addresses && o.addresses.includes(address));
    const isSent = tx.inputs.some(i => i.addresses && i.addresses.includes(address));

    let amount = 0;
    let counterparty = '';

    if (isSent && isReceived) {
      // change tx — compute net
      const sent = tx.inputs.filter(i => i.addresses && i.addresses.includes(address))
        .reduce((s, i) => s + i.output_value, 0);
      const received = tx.outputs.filter(o => o.addresses && o.addresses.includes(address))
        .reduce((s, o) => s + o.value, 0);
      amount = received - sent;
      counterparty = tx.outputs.find(o => o.addresses && !o.addresses.includes(address))?.addresses?.[0] || '';
    } else if (isSent) {
      amount = -tx.outputs.filter(o => o.addresses && !o.addresses.includes(address))
        .reduce((s, o) => s + o.value, 0);
      counterparty = tx.outputs.find(o => o.addresses && !o.addresses.includes(address))?.addresses?.[0] || '';
    } else {
      amount = tx.outputs.filter(o => o.addresses && o.addresses.includes(address))
        .reduce((s, o) => s + o.value, 0);
      counterparty = tx.inputs[0]?.addresses?.[0] || '';
    }

    return {
      hash: tx.hash,
      amount,
      type: amount >= 0 ? 'received' : 'sent',
      confirmations: tx.confirmations || 0,
      date: tx.confirmed || tx.received,
      fee: tx.fees || 0,
      counterparty,
    };
  });

  return txs;
}

export async function getRecommendedFees() {
  const res = await fetch(`${BASE_URL}`);
  if (!res.ok) return { low: 1, medium: 5, high: 10 };
  const data = await res.json();
  return {
    low: Math.floor((data.low_fee_per_kb || 1000) / 1000),
    medium: Math.floor((data.medium_fee_per_kb || 5000) / 1000),
    high: Math.floor((data.high_fee_per_kb || 10000) / 1000),
  };
}

export async function getUTXOs(address) {
  const res = await fetch(`${BASE_URL}/addrs/${address}?unspentOnly=true&includeScript=true`);
  if (!res.ok) throw new Error('Failed to fetch UTXOs');
  const data = await res.json();
  return data.txrefs || data.unconfirmed_txrefs ? [
    ...(data.txrefs || []),
    ...(data.unconfirmed_txrefs || []),
  ] : [];
}

export async function broadcastTransaction(hex) {
  const res = await fetch(`${BASE_URL}/txs/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx: hex }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Broadcast failed');
  return data;
}

export async function getBtcPrice() {
  try {
    const res = await fetch(
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
  {
    method: 'GET',
    headers: {
      'x-cg-pro-api-key': import.meta.env.COINGECKO_API_KEY
    }
  }
);
    if (!res.ok) return null;
    const data = await res.json();
    return data.bitcoin?.usd || null;
  } catch {
    return null;
  }
}
