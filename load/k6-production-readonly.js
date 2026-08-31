import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'https://kriptoaman.com').replace(/\/$/, '');
const STAGE = __ENV.KA_LOAD_STAGE || 'smoke';
const ALLOW_PROD = __ENV.ALLOW_PRODUCTION_LOAD_TEST === 'YES';

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
  },
  noConnectionReuse: false,
};

const endpointErrorRate = new Rate('ka_endpoint_error');
const endpointLatency = new Trend('ka_endpoint_latency', true);

const endpoints = [
  { name: 'homepage', path: '/', json: false },
  { name: 'platform-status', path: '/api/platform-status', json: true },
  { name: 'network-health', path: '/api/network-health', json: true },
  { name: 'kam-network-status', path: '/api/kam/network-status', json: true },
];

export default function () {
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint.path}`, {
    tags: { endpoint: endpoint.name },
    headers: { Accept: endpoint.json ? 'application/json' : 'text/html,application/xhtml+xml' },
    timeout: '10s',
  });

  endpointLatency.add(res.timings.duration, { endpoint: endpoint.name });
  const ok = check(res, {
    'HTTP status is successful': (r) => r.status >= 200 && r.status < 400,
    'response is non-empty': (r) => typeof r.body === 'string' && r.body.length > 0,
  }, { endpoint: endpoint.name });

  endpointErrorRate.add(!ok, { endpoint: endpoint.name });
  sleep(0.5 + Math.random());
}
