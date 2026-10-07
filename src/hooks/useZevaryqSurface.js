import { useEffect, useMemo, useState } from 'react';
import { DATA_STATE } from '@/lib/dataState';

const EXPECTED_CHAIN_ID = 22028;
const EXPECTED_CHAIN_ID_HEX = '0x560c';
const NETWORK_ENDPOINT = '/api/kam/network-status';
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

function useJsonPoll(endpoint, refreshMs) {
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
        const response = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();
        if (active) {
          setResult({
            payload,
            ok: response.ok,
            receivedAt: Date.now(),
            checking: false,
          });
        }
      } catch {
        if (active) {
          setResult({
            payload: null,
            ok: false,
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
  }, [endpoint, refreshMs]);

  return result;
}

export default function useZevaryqSurface() {
  const networkResult = useJsonPoll(NETWORK_ENDPOINT, ZEVARYQ_REFRESH.networkMs);
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
    const networkStatusUsable = networkIdentityVerified && networkFresh;
    const syncStatus = String(networkPayload?.syncStatus || '').toLowerCase();

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

    // Runtime state unification: a fresh first-party JSON-RPC evidence head can
    // corroborate network availability when the status endpoint is temporarily
    // stale/unavailable. It never fabricates SYNCED: sync remains CHECKING
    // until the canonical network-status endpoint proves it.
    const networkCorroboratedByOnChain = Boolean(
      !networkStatusUsable
      && onChainVerified
      && onChainFresh,
    );
    const networkSourceMode = networkStatusUsable
      ? 'NETWORK_STATUS'
      : networkCorroboratedByOnChain
        ? 'FIRST_PARTY_CORROBORATED'
        : 'UNAVAILABLE';

    const effectiveNetwork = networkStatusUsable
      ? networkPayload
      : networkCorroboratedByOnChain
        ? Object.freeze({
            blockNumber: onChainHead,
            probeDurationMs: Number.isFinite(Number(onChainPayload?.latencyMs))
              ? Number(onChainPayload.latencyMs)
              : null,
            checkedAt: onChainPayload?.observedAt || onChainResult.receivedAt,
            live: true,
            verified: true,
            chainId: EXPECTED_CHAIN_ID,
            chainIdHex: EXPECTED_CHAIN_ID_HEX,
            syncStatus: 'checking',
            evidenceMode: 'FIRST_PARTY_CORROBORATED',
          })
        : null;

    let networkState = DATA_STATE.CHECKING;
    if (!networkResult.checking || !onChainResult.checking) {
      if (networkStatusUsable) networkState = syncStatus === 'synced' ? DATA_STATE.LIVE : DATA_STATE.VERIFIED;
      else if (networkCorroboratedByOnChain) networkState = DATA_STATE.VERIFIED;
      else if (networkIdentityVerified && !networkFresh) networkState = DATA_STATE.DELAYED;
      else networkState = DATA_STATE.UNAVAILABLE;
    }

    const syncState = networkStatusUsable
      ? (syncStatus === 'synced' ? DATA_STATE.SYNCED : DATA_STATE.CHECKING)
      : networkCorroboratedByOnChain
        ? DATA_STATE.CHECKING
        : (networkResult.checking ? DATA_STATE.CHECKING : DATA_STATE.UNAVAILABLE);

    const effectiveNetworkAgeMs = networkSourceMode === 'NETWORK_STATUS' ? networkAgeMs : onChainAgeMs;
    const effectiveNetworkObservedAt = networkSourceMode === 'NETWORK_STATUS'
      ? (networkPayload?.checkedAt || networkResult.receivedAt)
      : networkSourceMode === 'FIRST_PARTY_CORROBORATED'
        ? (onChainPayload?.observedAt || onChainResult.receivedAt)
        : (networkPayload?.checkedAt || networkResult.receivedAt);

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
      network: effectiveNetwork,
      networkState,
      networkAgeMs: effectiveNetworkAgeMs,
      networkObservedAt: effectiveNetworkObservedAt,
      networkSourceMode,
      networkCorroboratedByOnChain,
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
        networkEndpoint: NETWORK_ENDPOINT,
        onChainEndpoint: ONCHAIN_ENDPOINT,
      }),
    });
  }, [networkResult, onChainResult]);
}
