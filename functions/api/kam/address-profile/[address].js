const TREASURY_ADDRESS = '0xab481451eaf642384d2d9888b355f10d327c5de9';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=300, s-maxage=3600',
    'access-control-allow-origin': '*',
  },
});

const profile = (username = null) => ({
  user_profile: {
    username,
  },
});

export async function onRequestGet({ params }) {
  const address = String(params?.address || '').toLowerCase();

  if (!/^0x[a-f0-9]{40}$/.test(address)) {
    return json(profile(null), 400);
  }

  if (address !== TREASURY_ADDRESS) {
    return json(profile(null));
  }

  return json({
    ...profile('KAM Treasury — PT Kripto Aman Indonesia'),
    label: 'KAM Treasury',
    organization: 'PT Kripto Aman Indonesia',
    category: 'Official Treasury',
    verified: true,
    network: 'KriptoAman Mainnet',
    chain_id: 22028,
    address: TREASURY_ADDRESS,
  });
}
