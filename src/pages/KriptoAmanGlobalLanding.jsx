import React, { useEffect, useState } from 'react';
import GlobalLandingStyles from '@/components/landing/GlobalLandingStyles';
import GLandingHeader from '@/components/landing/GLandingHeader';
import GLandingHero from '@/components/landing/GLandingHero';
import GLandingNews from '@/components/landing/GLandingNews';
import GLandingBody from '@/components/landing/GLandingBody';
import GLandingInstitutional from '@/components/landing/GLandingInstitutional';
import GLandingFooter from '@/components/landing/GLandingFooter';

export default function KriptoAmanGlobalLanding() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('Beranda');
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
      };
      let platformPayload = null;
      let zevaryqPayload = null;

      const [statusResult, networkResult, zevaryqResult] = await Promise.allSettled([
        fetch('/api/platform-status', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        fetch('/api/network-health', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        fetch('/api/zevaryq/network-status', { cache: 'no-store', headers: { Accept: 'application/json' } }),
      ]);

      if (statusResult.status === 'fulfilled') {
        try {
          platformPayload = await statusResult.value.json();
          if (platformPayload?.components) {
            next.overall = platformPayload.overall || 'unavailable';
            const market = platformPayload.components.market || {};
            const networks = platformPayload.components.networks || {};
            const zevaryq = platformPayload.components.zevaryq || {};

            next.marketAvailable = market.status === 'operational';
            next.assetCount = Number.isFinite(Number(market.assetCount)) && Number(market.assetCount) > 0 ? Number(market.assetCount) : null;
            next.lastUpdated = market.capturedAt || null;
            next.marketSource = market.source || null;
            next.networkActiveCount = Number.isFinite(Number(networks.online)) ? Number(networks.online) : undefined;
            next.networkCheckedAt = networks.checkedAt || zevaryq.checkedAt || null;
          }
        } catch {
          // Public landing remains usable and never invents unavailable metrics.
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

      if (zevaryqResult.status === 'fulfilled') {
        try {
          zevaryqPayload = await zevaryqResult.value.json();
        } catch {
          zevaryqPayload = null;
        }
      }

      const zevaryqFromPlatform = platformPayload?.components?.zevaryq;
      const zevaryq = zevaryqFromPlatform || {};
      const zevaryqVerified = Boolean(
        (zevaryq?.status === 'operational' && Number(zevaryq.chainId) === 22028) ||
        (zevaryqPayload?.verified === true && Number(zevaryqPayload.chainId) === 22028),
      );
      const zevaryqBlockNumber = zevaryq.blockNumber ?? zevaryqPayload?.blockNumber ?? null;
      const zevaryqCheckedAt = zevaryq.checkedAt || zevaryqPayload?.checkedAt || null;

      if (zevaryqVerified) {
        const hadZevaryq = next.networks.some((network) => network?.name === 'ZEVARYQ Mainnet');
        const zevaryqNetworkEntry = zevaryq?.status === 'operational'
          ? {
              name: 'ZEVARYQ Mainnet',
              symbol: 'ZVQ',
              status: 'online',
              verification: 'platform-status',
              chainId: 22028,
              blockNumber: zevaryqBlockNumber,
            }
          : {
              name: 'ZEVARYQ Mainnet',
              symbol: 'ZVQ',
              status: 'online',
              verification: 'zevaryq-network-status',
              chainId: 22028,
              blockNumber: zevaryqBlockNumber,
            };
        next.networks = [...next.networks.filter((network) => network?.name !== 'ZEVARYQ Mainnet'), zevaryqNetworkEntry];
        next.networkCheckedAt = next.networkCheckedAt || zevaryqCheckedAt;
        if (!hadZevaryq) {
          next.networkActiveCount = (Number(next.networkActiveCount) || 0) + 1;
        }
        if (next.overall === 'unavailable') next.overall = 'degraded';
      }

      setStats(next);
    })();

    const onScroll = () => {
      const sections = ['beranda', 'berita', 'fitur', 'keamanan', 'institutional', 'faq', 'kontak'];
      const labels = ['Beranda', 'Berita', 'Fitur', 'Keamanan', 'Ekosistem', 'FAQ', 'Kontak'];
      let cur = 'Beranda';
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
    <div data-ka-public-landing="ready" className={`ka-landing min-h-screen ${dark ? '' : 'light'} overflow-x-hidden`}>
      <GlobalLandingStyles />
      <GLandingHeader dark={dark} onToggleTheme={() => setDark((d) => !d)} active={active} />
      <main>
        <GLandingHero stats={stats} />
        <GLandingNews />
        <GLandingBody stats={stats} />
        <GLandingInstitutional />
      </main>
      <GLandingFooter />
    </div>
  );
}