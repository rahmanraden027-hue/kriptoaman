import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import GlobalLandingStyles from '@/components/landing/GlobalLandingStyles';
import GLandingHeader from '@/components/landing/GLandingHeader';
import GLandingHero from '@/components/landing/GLandingHero';
import GLandingBody from '@/components/landing/GLandingBody';
import GLandingFooter from '@/components/landing/GLandingFooter';

export default function KriptoAmanGlobalLanding() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('Beranda');
  const [stats, setStats] = useState({ loading: true, users: null, screenings: null, assets: null, lastUpdated: null });

  useEffect(() => {
    (async () => {
      const s = { loading: false, users: null, screenings: null, assets: null, lastUpdated: null };
      try {
        const prices = await base44.entities.CachedPrice.list('-fetchedAt', 200);
        s.assets = prices.length;
        s.lastUpdated = prices[0]?.fetchedAt || null;
      } catch { /* not accessible publicly — show "—" */ }
      try { const u = await base44.entities.User.list(); s.users = u.length; } catch { /* RLS */ }
      try { const a = await base44.entities.AMLScreening.list('-created_date', 200); s.screenings = a.length; } catch { /* RLS */ }
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