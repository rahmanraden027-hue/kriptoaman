import { useEffect, useMemo, useState } from 'react';
import { DATA_STATE } from '@/lib/dataState';

const EXPECTED_CHAIN_ID = 22028;
const EXPECTED_CHAIN_ID_HEX = '0x560c';
const NETWORK_ENDPOINTS = Object.freeze(['/api/zvq/network-status', '/api/kam/network-status']);
const ONCHAIN_ENDPOINT = '/api/zvq-token-intelligence';

export const ZEVARYQ_REFRESH = Object.freeze({
  networkMs: 30_000,
  onChainMs: 15_000,
});

export const ZEVARYQ_FRESHNESS = Object.freeze({
  networkMs: 90_000,
  onChainMs: 45_000,
});

const validSafeInteger = (value) => Number.isSafeInteger(Number(value)) && Number(value) >= 0;

const timestampMs = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const ageFrom = (value, fallback) => {
  const observed = timestampMs(value) ?? timestampMs(fallback);
  if (!Number.isFinite(observed)) return null;
  return Math.max(0, Date.now() - observed);
};

function useJsonPoll(endpointOrEndpoints, refreshMs) {
  const endpoints = Array.isArray(endpointOrEndpoints) ? endpointOrEndpoints : [endpointOrEndpoints];
  const [result, setResult] = useState({
    payload: null,
    ok: false,
    receivedAt: null,
    checking: true,
  });

  useEffect(() => {
    let active = true;
    let timer;

    const load = async () => {
      try {
        let payload = null;
        let ok = false;
        let selectedEndpoint = endpoints[0] || null;
        for (const endpoint of endpoints) {
          const response = await fetch(endpoint, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          });
          selectedEndpoint = endpoint;
          if (!response.ok && [404, 405].includes(response.status)) continue;
          payload = await response.json();
          ok = response.ok;
          break;
        }
        if (active) {
          setResult({
            payload,
            ok,
            endpoint: selectedEndpoint,
            receivedAt: Date.now(),
            checking: false,
          });
        }
      } catch {
        if (active) {
          setResult({
            payload: null,
            ok: false,
            endpoint: null,
            receivedAt: Date.now(),
            checking: false,
          });
        }
      } finally {
        if (active) timer = window.setTimeout(load, refreshMs);
      }
    };

    load();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [refreshMs, ...endpoints]);

  return result;
}

export default function useZevaryqSurface() {
  const networkResult = useJsonPoll(NETWORK_ENDPOINTS, ZEVARYQ_REFRESH.networkMs);
  const onChainResult = useJsonPoll(ONCHAIN_ENDPOINT, ZEVARYQ_REFRESH.onChainMs);

  return useMemo(() => {
    const networkPayload = networkResult.payload;
    const blockNumber = Number(networkPayload?.blockNumber);
    const networkIdentityVerified = Boolean(
      networkResult.ok
      && networkPayload?.live === true
      && networkPayload?.verified === true
      && Number(networkPayload?.chainId) === EXPECTED_CHAIN_ID
      && String(networkPayload?.chainIdHex || '').toLowerCase() === EXPECTED_CHAIN_ID_HEX
      && validSafeInteger(blockNumber),
    );
    const networkAgeMs = ageFrom(networkPayload?.checkedAt, networkResult.receivedAt);
    const networkFresh = Number.isFinite(networkAgeMs) && networkAgeMs <= ZEVARYQ_FRESHNESS.networkMs;
    const syncStatus = String(networkPayload?.syncStatus || '').toLowerCase();

    let networkState = DATA_STATE.CHECKING;
    if (!networkResult.checking) {
      if (!networkIdentityVerified) networkState = DATA_STATE.UNAVAILABLE;
      else if (!networkFresh) networkState = DATA_STATE.DELAYED;
      else if (syncStatus === 'synced') networkState = DATA_STATE.LIVE;
      else networkState = DATA_STATE.VERIFIED;
    }

    const syncState = !networkIdentityVerified
      ? (networkResult.checking ? DATA_STATE.CHECKING : DATA_STATE.UNAVAILABLE)
      : syncStatus === 'synced'
        ? DATA_STATE.SYNCED
        : DATA_STATE.CHECKING;

    const onChainPayload = onChainResult.payload;
    const onChainHead = Number(onChainPayload?.head?.number);
    const onChainVerified = Boolean(
      onChainResult.ok
      && onChainPayload?.status === 'live'
      && Number(onChainPayload?.chainId) === EXPECTED_CHAIN_ID
      && validSafeInteger(onChainHead)
      && onChainPayload?.provenance?.ownership === 'first-party'
      && onChainPayload?.provenance?.endpoint === 'rpc.kriptoaman.com',
    );
    const onChainAgeMs = ageFrom(onChainPayload?.observedAt, onChainResult.receivedAt);
    const onChainFresh = Number.isFinite(onChainAgeMs) && onChainAgeMs <= ZEVARYQ_FRESHNESS.onChainMs;

    let onChainState = DATA_STATE.CHECKING;
    if (!onChainResult.checking) {
      if (!onChainVerified) onChainState = DATA_STATE.UNAVAILABLE;
      else if (!onChainFresh) onChainState = DATA_STATE.DELAYED;
      else onChainState = DATA_STATE.LIVE;
    }

    const overallState = networkState === DATA_STATE.LIVE && onChainState === DATA_STATE.LIVE
      ? DATA_STATE.LIVE
      : [networkState, onChainState].includes(DATA_STATE.UNAVAILABLE)
        ? DATA_STATE.PARTIAL
        : [networkState, onChainState].includes(DATA_STATE.DELAYED)
          ? DATA_STATE.DELAYED
          : [networkState, onChainState].includes(DATA_STATE.CHECKING)
            ? DATA_STATE.CHECKING
            : DATA_STATE.VERIFIED;

    return Object.freeze({
      overallState,
      network: networkIdentityVerified ? networkPayload : null,
      networkState,
      networkAgeMs,
      networkObservedAt: networkPayload?.checkedAt || networkResult.receivedAt,
      syncState,
      onChain: onChainVerified ? onChainPayload : null,
      onChainState,
      onChainAgeMs,
      onChainObservedAt: onChainPayload?.observedAt || onChainResult.receivedAt,
      refresh: ZEVARYQ_REFRESH,
      freshness: ZEVARYQ_FRESHNESS,
      contract: Object.freeze({
        chainId: EXPECTED_CHAIN_ID,
        chainIdHex: EXPECTED_CHAIN_ID_HEX,
        networkEndpoint: NETWORK_ENDPOINTS[0],
        networkEndpointFallback: NETWORK_ENDPOINTS[1],
        networkEndpointSelected: networkResult.endpoint || null,
        onChainEndpoint: ONCHAIN_ENDPOINT,
      }),
    });
  }, [networkResult, onChainResult]);
}
