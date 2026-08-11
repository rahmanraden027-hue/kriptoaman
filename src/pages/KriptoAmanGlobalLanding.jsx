import React, { useEffect, useState } from 'react';
import GlobalLandingStyles from '@/components/landing/GlobalLandingStyles';
import GLandingHeader from '@/components/landing/GLandingHeader';
import GLandingHero from '@/components/landing/GLandingHero';
import GLandingBody from '@/components/landing/GLandingBody';
import GLandingFooter from '@/components/landing/GLandingFooter';

export default function KriptoAmanGlobalLanding() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('Beranda');
  const [stats, setStats] = useState({ loading: true, marketAvailable: false, lastUpdated: null });

  useEffect(() => {
    (async () => {
      const s = { loading: false, marketAvailable: false, lastUpdated: null };
      try {
        const response = await fetch('https://api.coinlore.net/api/tickers/?start=0&limit=1', {
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json();
        s.marketAvailable = response.ok && Array.isArray(payload?.data) && payload.data.length > 0;
        s.lastUpdated = s.marketAvailable ? Date.now() : null;
      } catch {
        // Public landing remains usable while the provider is temporarily unavailable.
      }
      setStats(s);
    })();

    const onScroll = () => {
      const sections = ['beranda', 'fitur', 'keamanan', 'tentang', 'faq', 'kontak'];
      const labels = ['Beranda', 'Fitur', 'Keamanan', 'Tentang Kami', 'FAQ', 'Kontak'];
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
        <GLandingBody stats={stats} />
      </main>
      <GLandingFooter />
    </div>
  );
}