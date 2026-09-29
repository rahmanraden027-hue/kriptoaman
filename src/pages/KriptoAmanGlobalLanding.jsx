import React, { useEffect, useState } from 'react';
import GlobalLandingStyles from '@/components/landing/GlobalLandingStyles';
import GLandingHeader from '@/components/landing/GLandingHeader';
import GLandingHero from '@/components/landing/GLandingHero';
import GLandingBody from '@/components/landing/GLandingBody';
import GLandingInstitutional from '@/components/landing/GLandingInstitutional';
import GLandingFooter from '@/components/landing/GLandingFooter';

export default function KriptoAmanGlobalLanding() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('Platform');
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
          if (platformPayload?.components) {
            next.overall = platformPayload.overall || 'unavailable';
            const market = platformPayload.components.market || {};
            const networks = platformPayload.components.networks || {};
            const kam = platformPayload.components.kam || {};

            next.marketAvailable = market.status === 'operational';
            next.assetCount = Number.isFinite(Number(market.assetCount)) && Number(market.assetCount) > 0 ? Number(market.assetCount) : null;
            next.lastUpdated = market.capturedAt || null;
            next.marketSource = market.source || null;
            next.networkActiveCount = Number.isFinite(Number(networks.online)) ? Number(networks.online) : undefined;
            next.networkCheckedAt = networks.checkedAt || kam.checkedAt || null;
            next.zvqBlockNumber = kam.blockNumber != null && Number.isFinite(Number(kam.blockNumber)) ? Number(kam.blockNumber) : null;
            next.zvqCheckedAt = kam.checkedAt || null;
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
            next.networkCheckedAt = payload.checked_at || next.networkCheckedAt;
            if (!Number.isFinite(Number(next.networkActiveCount))) {
              const online = payload.networks.filter((network) => network?.status === 'online').length;
              next.networkActiveCount = online;
            }
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

      const kamFromPlatform = platformPayload?.components?.kam;
      const kam = kamFromPlatform || {};
      const kamVerified = Boolean(
        (kam?.status === 'operational' && Number(kam.chainId) === 22028) ||
        (kamPayload?.verified === true && Number(kamPayload.chainId) === 22028),
      );
      const kamBlockNumber = kam.blockNumber ?? kamPayload?.blockNumber ?? null;
      const kamCheckedAt = kam.checkedAt || kamPayload?.checkedAt || null;

      if (kamVerified) {
        const hadKam = next.networks.some((network) => Number(network?.chainId) === 22028 || ['KAM Network', 'ZEVARYQ Network'].includes(network?.name));
        const kamNetworkEntry = kam?.status === 'operational'
          ? {
              name: 'ZEVARYQ Network',
              symbol: 'ZVQ',
              status: 'online',
              verification: 'platform-status',
              chainId: 22028,
              blockNumber: kamBlockNumber,
            }
          : {
              name: 'ZEVARYQ Network',
              symbol: 'ZVQ',
              status: 'online',
              verification: 'kam-network-status',
              chainId: 22028,
              blockNumber: kamBlockNumber,
            };
        next.networks = [...next.networks.filter((network) => Number(network?.chainId) !== 22028 && !['KAM Network', 'ZEVARYQ Network'].includes(network?.name)), kamNetworkEntry];
        next.networkCheckedAt = next.networkCheckedAt || kamCheckedAt;
        next.zvqBlockNumber = kamBlockNumber != null && Number.isFinite(Number(kamBlockNumber)) ? Number(kamBlockNumber) : next.zvqBlockNumber;
        next.zvqCheckedAt = kamCheckedAt || next.zvqCheckedAt;
        if (!hadKam) {
          next.networkActiveCount = (Number(next.networkActiveCount) || 0) + 1;
        }
        if (next.overall === 'unavailable') next.overall = 'degraded';
      }

      setStats(next);
    })();

    const onScroll = () => {
      const sections = ['beranda', 'fitur', 'keamanan', 'institutional'];
      const labels = ['Platform', 'Intelligence', 'Security', 'Company'];
      let cur = 'Platform';
      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 120) cur = labels[i];
      }
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div data-ka-public-landing="ready" data-ka-production-version="2" className={`ka-landing min-h-screen ${dark ? '' : 'light'} overflow-x-hidden`}>
      <GlobalLandingStyles />
      <GLandingHeader dark={dark} onToggleTheme={() => setDark((d) => !d)} active={active} />
      <main>
        <GLandingHero stats={stats} />
        <GLandingBody stats={stats} />
        <GLandingInstitutional />
      </main>
      <GLandingFooter />
    </div>
  );
}
