import { useEffect, useMemo, useState } from 'react';
import { DATA_STATE } from '@/lib/dataState';

const ENDPOINT = '/api/zvq-live-blocks';
const REFRESH_MS = 12_000;
const FRESHNESS_MS = 45_000;

const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const observedAtMs = (value) => {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms : null;
};

export default function useZevaryqNetworkInspection() {
  const [result, setResult] = useState({
    payload: null,
    ok: false,
    checking: true,
    receivedAt: null,
  });

  useEffect(() => {
    let active = true;
    let timer;

    const load = async () => {
      try {
        const response = await fetch(ENDPOINT, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json();
        if (active) {
          setResult({
            payload,
            ok: response.ok,
            checking: false,
            receivedAt: Date.now(),
          });
        }
      } catch {
        if (active) {
          setResult({ payload: null, ok: false, checking: false, receivedAt: Date.now() });
        }
      } finally {
        if (active) timer = window.setTimeout(load, REFRESH_MS);
      }
    };

    load();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  return useMemo(() => {
    const payload = result.payload;
    const checkedAt = observedAtMs(payload?.checkedAt) ?? result.receivedAt;
    const ageMs = checkedAt ? Math.max(0, Date.now() - checkedAt) : null;
    const verified = Boolean(
      result.ok
      && payload?.status === 'live'
      && Number(payload?.chainId) === 22028
      && String(payload?.chainIdHex || '').toLowerCase() === '0x560c'
      && Number.isSafeInteger(Number(payload?.head?.number))
      && Array.isArray(payload?.blocks)
      && payload.blocks.length > 0
      && payload?.provenance?.ownership === 'first-party'
      && payload?.provenance?.rpcEndpoint === 'rpc.kriptoaman.com'
    );
    const fresh = Number.isFinite(ageMs) && ageMs <= FRESHNESS_MS;

    const state = result.checking
      ? DATA_STATE.CHECKING
      : !verified
        ? DATA_STATE.UNAVAILABLE
        : !fresh
          ? DATA_STATE.DELAYED
          : DATA_STATE.LIVE;

    const blocks = verified
      ? payload.blocks
          .map((block) => ({
            ...block,
            number: asNumber(block?.number),
            timestamp: asNumber(block?.timestamp),
            txCount: asNumber(block?.txCount),
            gasUsed: asNumber(block?.gasUsed),
            gasLimit: asNumber(block?.gasLimit),
            confirmations: asNumber(block?.confirmations),
          }))
          .filter((block) => Number.isSafeInteger(block.number))
      : [];

    const utilizationSeries = blocks
      .map((block) => ({
        number: block.number,
        utilization: block.gasLimit && block.gasUsed != null && block.gasLimit > 0
          ? Math.max(0, Math.min(100, (block.gasUsed / block.gasLimit) * 100))
          : null,
        txCount: block.txCount,
      }))
      .filter((row) => row.utilization != null || row.txCount != null)
      .reverse();

    return Object.freeze({
      state,
      verified,
      fresh,
      ageMs,
      checkedAt: payload?.checkedAt || null,
      head: verified ? payload.head : null,
      blocks,
      metrics: verified ? payload.metrics || null : null,
      evidence: verified ? payload.networkEvidence || null : null,
      provenance: verified ? payload.provenance || null : null,
      truthPolicy: payload?.truthPolicy || null,
      utilizationSeries,
      endpoint: ENDPOINT,
      refreshMs: REFRESH_MS,
      freshnessMs: FRESHNESS_MS,
    });
  }, [result]);
}
