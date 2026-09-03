import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'https://kriptoaman.com').replace(/\/$/, '');
const STAGE = __ENV.KA_LOAD_STAGE || 'smoke';
const ALLOW_PROD = __ENV.ALLOW_PRODUCTION_LOAD_TEST === 'YES';
const INCLUDE_HOT_MARKET = __ENV.KA_INCLUDE_HOT_MARKET === 'YES';

const profiles = {
  smoke: { vus: 5, duration: '30s' },
  '1000': { vus: 1000, duration: '2m' },
  '2500': { vus: 2500, duration: '2m' },
  '5000': { vus: 5000, duration: '2m' },
  '10000': { vus: 10000, duration: '2m' },
};

if (!profiles[STAGE]) {
  throw new Error(`Unknown KA_LOAD_STAGE=${STAGE}. Use smoke, 1000, 2500, 5000, or 10000.`);
}

if (STAGE !== 'smoke' && BASE_URL === 'https://kriptoaman.com' && !ALLOW_PROD) {
  throw new Error('High-load production testing is blocked. Set ALLOW_PRODUCTION_LOAD_TEST=YES only in an approved observation window.');
}

export const options = {
  vus: profiles[STAGE].vus,
  duration: profiles[STAGE].duration,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    ka_endpoint_error: ['rate<0.01'],
    ka_endpoint_latency: ['p(95)<1500'],
    'http_req_duration{endpoint:market-hot}': ['p(95)<750'],
    'http_req_duration{endpoint:market-page}': ['p(95)<1000'],
  },
  noConnectionReuse: false,
};

const endpointErrorRate = new Rate('ka_endpoint_error');
const endpointLatency = new Trend('ka_endpoint_latency', true);

const endpoints = [
  { name: 'homepage', path: '/', json: false, weight: 24 },
  ...(INCLUDE_HOT_MARKET ? [{ name: 'market-hot', path: '/api/market-hot', json: true, weight: 28 }] : []),
  { name: 'market-page', path: '/api/market-snapshot-page?page=0&limit=100', json: true, weight: 24 },
  { name: 'platform-status', path: '/api/platform-status', json: true, weight: 10 },
  { name: 'network-health', path: '/api/network-health', json: true, weight: 7 },
  { name: 'kam-network-status', path: '/api/kam/network-status', json: true, weight: 7 },
];

const weightedEndpoints = endpoints.flatMap((endpoint) => Array.from({ length: endpoint.weight }, () => endpoint));

export default function () {
  const endpoint = weightedEndpoints[Math.floor(Math.random() * weightedEndpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint.path}`, {
    tags: { endpoint: endpoint.name },
    headers: { Accept: endpoint.json ? 'application/json' : 'text/html,application/xhtml+xml' },
    timeout: '10s',
  });

  endpointLatency.add(res.timings.duration, { endpoint: endpoint.name });
  const ok = check(res, {
    'HTTP status is successful': (r) => r.status >= 200 && r.status < 400,
    'response is non-empty': (r) => typeof r.body === 'string' && r.body.length > 0,
    'market hot contains BTC when selected': (r) => endpoint.name !== 'market-hot' || r.body.includes('"symbol":"BTC"'),
    'market page returns bounded data when selected': (r) => endpoint.name !== 'market-page' || r.body.includes('"pageSize":100'),
  }, { endpoint: endpoint.name });

  endpointErrorRate.add(!ok, { endpoint: endpoint.name });
  sleep(0.5 + Math.random());
}
