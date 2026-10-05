import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import GlobalLandingStyles from '@/components/landing/GlobalLandingStyles';
import GLandingHeader from '@/components/landing/GLandingHeader';
import LandingLiveSystemStrip from '@/components/landing/LandingLiveSystemStrip';
import GLandingHero from '@/components/landing/GLandingHero';
import GLandingFooter from '@/components/landing/GLandingFooter';

const GLandingDeferredContent = lazy(() => import('@/components/landing/GLandingDeferredContent'));

function authoritativeSnapshot(payload) {
  const market = payload?.components?.market || {};
  const networks = payload?.components?.networks || {};
  const kam = payload?.components?.kam || {};
  const marketAssetCount = Number(market.assetCount);
  const networkOnline = Number(networks.online);
  const kamBlockNumber = Number(kam.blockNumber);
  const snapshotAgeMs = Number(payload?.delivery?.snapshotAgeMs);

  return {
    overall: payload?.overall || 'unavailable',
    marketAvailable: market.status === 'operational' && market.healthy === true,
    lastUpdated: market.capturedAt || null,
    assetCount: Number.isFinite(marketAssetCount) && marketAssetCount > 0 ? marketAssetCount : null,
    marketSource: market.source || null,
    networkActiveCount: Number.isFinite(networkOnline) ? networkOnline : undefined,
    networkCheckedAt: networks.checkedAt || null,
    zvqBlockNumber: kam.status === 'operational' && Number(kam.chainId) === 22028 && Number.isFinite(kamBlockNumber) ? kamBlockNumber : null,
    zvqCheckedAt: kam.checkedAt || null,
    snapshotGeneratedAt: payload?.generatedAt || null,
    snapshotReadMode: payload?.delivery?.aggregateRead || null,
    snapshotAgeMs: Number.isFinite(snapshotAgeMs) ? snapshotAgeMs : null,
  };
}

export default function KriptoAmanGlobalLanding() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('Platform');
  const [heroVisualReady, setHeroVisualReady] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches);
  const [deferredReady, setDeferredReady] = useState(false);
  const deferredTriggerRef = useRef(null);
  const [stats, setStats] = useState({
    loading: true,
    overall: 'unavailable',
    marketAvailable: false,
    lastUpdated: null,
    assetCount: null,
    marketSource: null,
    networks: [],
    networkActiveCount: undefined,
    networkCheckedAt: null,
    zvqBlockNumber: null,
    zvqCheckedAt: null,
    zvqSyncStatus: null,
    zvqProbeDurationMs: null,
    snapshotGeneratedAt: null,
    snapshotReadMode: null,
    snapshotAgeMs: null,
  });

  useEffect(() => {
    (async () => {
      const next = {
        loading: false,
        overall: 'unavailable',
        marketAvailable: false,
        lastUpdated: null,
        assetCount: null,
        marketSource: null,
        networks: [],
        networkActiveCount: undefined,
        networkCheckedAt: null,
        zvqBlockNumber: null,
        zvqCheckedAt: null,
        zvqSyncStatus: null,
        zvqProbeDurationMs: null,
        snapshotGeneratedAt: null,
        snapshotReadMode: null,
        snapshotAgeMs: null,
      };
      let platformPayload = null;
      let kamPayload = null;

      const [statusResult, networkResult, kamResult] = await Promise.allSettled([
        fetch('/api/platform-status', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        fetch('/api/network-health', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        fetch('/api/kam/network-status', { cache: 'no-store', headers: { Accept: 'application/json' } }),
      ]);

      if (statusResult.status === 'fulfilled') {
        try {
          platformPayload = await statusResult.value.json();
          if (statusResult.value.ok && platformPayload?.components) {
            Object.assign(next, authoritativeSnapshot(platformPayload));
          }
        } catch {
          // Production V2 never invents unavailable metrics.
        }
      }

      if (networkResult.status === 'fulfilled') {
        try {
          const payload = await networkResult.value.json();
          if (networkResult.value.ok && Array.isArray(payload?.networks)) {
            next.networks = payload.networks;
          }
        } catch {
          // Detailed network badges are optional; the aggregate contract remains authoritative.
        }
      }

      if (kamResult.status === 'fulfilled') {
        try {
          kamPayload = await kamResult.value.json();
        } catch {
          kamPayload = null;
        }
      }

      const kamFromPlatform = platformPayload?.components?.kam || {};
      const platformKamVerified = kamFromPlatform?.status === 'operational' && Number(kamFromPlatform.chainId) === 22028;
      const telemetryVerified = kamPayload?.verified === true && Number(kamPayload.chainId) === 22028;

      if (platformKamVerified) {
        const kamNetworkEntry = {
          name: 'ZEVARYQ Network',
          symbol: 'ZVQ',
          status: 'online',
          verification: 'platform-status',
          chainId: 22028,
          blockNumber: next.zvqBlockNumber,
        };
        next.networks = [...next.networks.filter((network) => Number(network?.chainId) !== 22028 && !['KAM Network', 'ZEVARYQ Network'].includes(network?.name)), kamNetworkEntry];
      }

      if (telemetryVerified) {
        next.zvqSyncStatus = kamPayload.syncStatus || null;
        next.zvqProbeDurationMs = Number.isFinite(Number(kamPayload.probeDurationMs)) ? Number(kamPayload.probeDurationMs) : null;
      }

      setStats(next);
    })();

    const refreshAuthoritativeSnapshot = async () => {
      try {
        const [statusResponse, telemetryResponse] = await Promise.all([
          fetch('/api/platform-status', { cache: 'no-store', headers: { Accept: 'application/json' } }),
          fetch('/api/kam/network-status', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        ]);
        if (!statusResponse.ok) return;
        const payload = await statusResponse.json();
        if (!payload?.components) return;
        const snapshot = authoritativeSnapshot(payload);
        let telemetry = null;
        if (telemetryResponse.ok) telemetry = await telemetryResponse.json().catch(() => null);
        const telemetryVerified = telemetry?.verified === true && Number(telemetry.chainId) === 22028;
        setStats((current) => ({
          ...current,
          ...snapshot,
          zvqSyncStatus: telemetryVerified ? (telemetry.syncStatus || null) : current.zvqSyncStatus,
          zvqProbeDurationMs: telemetryVerified && Number.isFinite(Number(telemetry.probeDurationMs))
            ? Number(telemetry.probeDurationMs)
            : current.zvqProbeDurationMs,
        }));
      } catch {
        // Keep the last verified aggregate; never replace unavailable evidence with synthetic values.
      }
    };
    const authoritativeSnapshotTimer = window.setInterval(refreshAuthoritativeSnapshot, 15_000);

    const onScroll = () => {
      const sections = ['beranda', 'fitur', 'network-operations', 'institutional'];
      const labels = ['Platform', 'Intelligence', 'Network', 'Company'];
      let cur = 'Platform';
      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 120) cur = labels[i];
      }
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearInterval(authoritativeSnapshotTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (heroVisualReady) return undefined;

    const activate = () => setHeroVisualReady(true);
    const onScroll = () => {
      if (window.scrollY > 180) activate();
    };
    const onHashChange = () => {
      if (window.location.hash) activate();
    };
    const timer = window.setTimeout(activate, 3000);

    if (window.location.hash) activate();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [heroVisualReady]);

  useEffect(() => {
    let observer = null;
    const activate = () => setDeferredReady(true);
    const onHashChange = () => {
      if (window.location.hash) activate();
    };
    const deferredDelayMs = window.matchMedia('(min-width: 768px)').matches ? 1200 : 3500;
    const timer = window.setTimeout(activate, deferredDelayMs);

    if (window.location.hash) activate();
    window.addEventListener('hashchange', onHashChange);

    if ('IntersectionObserver' in window && deferredTriggerRef.current) {
      observer = new window.IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            activate();
            observer?.disconnect();
          }
        },
        { rootMargin: '320px 0px' },
      );
      observer.observe(deferredTriggerRef.current);
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', onHashChange);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!deferredReady || !window.location.hash) return undefined;
    const timer = window.setTimeout(() => {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [deferredReady]);

  return (
    <div data-ka-public-landing="ready" data-ka-production-version="3.1" className={`ka-landing min-h-screen ${dark ? '' : 'light'} overflow-x-hidden`}>
      <GlobalLandingStyles />
      <GLandingHeader dark={dark} onToggleTheme={() => setDark((d) => !d)} active={active} />
      <main>
        <LandingLiveSystemStrip stats={stats} />
        <GLandingHero stats={stats} visualReady={heroVisualReady} />
        <div ref={deferredTriggerRef} className="h-px w-full" aria-hidden="true" />
        {deferredReady ? (
          <Suspense
            fallback={
              <section className="ka-deferred-placeholder px-4 sm:px-6" aria-label="Memuat modul intelligence">
                <div className="mx-auto min-h-[240px] max-w-[1440px] rounded-[24px] border border-blue-400/10 bg-blue-500/[.02]" />
              </section>
            }
          >
            <GLandingDeferredContent stats={stats} />
          </Suspense>
        ) : (
          <section className="ka-deferred-placeholder px-4 sm:px-6" aria-hidden="true">
            <div className="mx-auto min-h-[240px] max-w-[1440px] rounded-[24px] border border-blue-400/10 bg-blue-500/[.02]" />
          </section>
        )}
      </main>
      <GLandingFooter />
    </div>
  );
}
