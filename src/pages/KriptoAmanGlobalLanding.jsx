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
    marketAvailable: false,
    lastUpdated: null,
    assetCount: null,
    marketSource: null,
    networks: [],
    networkActiveCount: null,
    networkCheckedAt: null,
  });

  useEffect(() => {
    (async () => {
      const next = {
        loading: false,
        marketAvailable: false,
        lastUpdated: null,
        assetCount: null,
        marketSource: null,
        networks: [],
        networkActiveCount: null,
        networkCheckedAt: null,
      };

      const [marketResult, networkResult, kamResult] = await Promise.allSettled([
        fetch('/api/market-snapshot?health=1', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        fetch('/api/network-health', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        fetch('/api/kam/network-status', { cache: 'no-store', headers: { Accept: 'application/json' } }),
      ]);

      if (marketResult.status === 'fulfilled') {
        try {
          const payload = await marketResult.value.json();
          if (marketResult.value.ok && Number(payload?.assetCount) > 0) {
            next.marketAvailable = Boolean(payload.healthy);
            next.assetCount = Number(payload.assetCount);
            next.lastUpdated = Number(payload.capturedAt) || null;
            next.marketSource = payload.source || null;
          }
        } catch {}
      }

      if (networkResult.status === 'fulfilled') {
        try {
          const payload = await networkResult.value.json();
          if (networkResult.value.ok && Array.isArray(payload?.networks)) {
            next.networks = payload.networks;
            next.networkActiveCount = Number(payload?.summary?.online) || 0;
            next.networkCheckedAt = payload.checked_at || null;
          }
        } catch {}
      }

      if (kamResult.status === 'fulfilled') {
        try {
          const payload = await kamResult.value.json();
          const kamVerified = kamResult.value.ok && payload?.verified === true && Number(payload?.chainId) === 22028;
          if (kamVerified) {
            next.networks = [...next.networks, { name: 'KAM Network', symbol: 'KAM', status: 'online', verification: 'rpc-chain-id', chainId: 22028, blockNumber: payload.blockNumber ?? null }];
            next.networkActiveCount = (Number(next.networkActiveCount) || 0) + 1;
            next.networkCheckedAt = payload.checkedAt || next.networkCheckedAt;
          }
        } catch {}
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
    <div className={`ka-landing min-h-screen ${dark ? '' : 'light'} overflow-x-hidden`}>
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
