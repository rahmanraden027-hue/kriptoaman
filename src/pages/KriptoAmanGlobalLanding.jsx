import React, { useEffect, useState } from 'react';
import GlobalLandingStyles from '@/components/landing/GlobalLandingStyles';
import GLandingHeader from '@/components/landing/GLandingHeader';
import GLandingHero from '@/components/landing/GLandingHero';
import GLandingNews from '@/components/landing/GLandingNews';
import GLandingBody from '@/components/landing/GLandingBody';
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

      const [statusResult, networkResult] = await Promise.allSettled([
        fetch('/api/platform-status', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        fetch('/api/network-health', { cache: 'no-store', headers: { Accept: 'application/json' } }),
      ]);

      if (statusResult.status === 'fulfilled') {
        try {
          const payload = await statusResult.value.json();
          if (payload?.components) {
            next.overall = payload.overall || 'unavailable';
            const market = payload.components.market || {};
            const networks = payload.components.networks || {};
            const kam = payload.components.kam || {};

            next.marketAvailable = market.status === 'operational';
            next.assetCount = Number.isFinite(Number(market.assetCount)) && Number(market.assetCount) > 0 ? Number(market.assetCount) : null;
            next.lastUpdated = market.capturedAt || null;
            next.marketSource = market.source || null;
            next.networkActiveCount = Number.isFinite(Number(networks.online)) ? Number(networks.online) : undefined;
            next.networkCheckedAt = networks.checkedAt || kam.checkedAt || null;

            if (kam.status === 'operational' && Number(kam.chainId) === 22028) {
              next.networkActiveCount = (Number(next.networkActiveCount) || 0) + 1;
            }
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
          }
        } catch {
          // Detailed network badges are optional; the aggregate contract remains authoritative.
        }
      }

      if (statusResult.status === 'fulfilled') {
        try {
          const payload = await statusResult.value.clone().json();
          const kam = payload?.components?.kam;
          if (kam?.status === 'operational' && Number(kam.chainId) === 22028) {
            next.networks = [...next.networks.filter((network) => network?.name !== 'KAM Network'), {
              name: 'KAM Network',
              symbol: 'KAM',
              status: 'online',
              verification: 'platform-status',
              chainId: 22028,
              blockNumber: kam.blockNumber ?? null,
            }];
          }
        } catch {
          // KAM remains additive and verified-only.
        }
      }

      setStats(next);
    })();

    const onScroll = () => {
      const sections = ['beranda', 'berita', 'fitur', 'keamanan', 'tentang', 'faq', 'kontak'];
      const labels = ['Beranda', 'Berita', 'Fitur', 'Keamanan', 'Tentang Kami', 'FAQ', 'Kontak'];
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
        <GLandingHero />
        <GLandingNews />
        <GLandingBody stats={stats} />
      </main>
      <GLandingFooter />
    </div>
  );
}
