import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe, WalletCards, ExternalLink } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import { useLanguage } from '@/lib/LanguageContext';

const LINKS = [
  { label: 'Platform', href: '#beranda' },
  { label: 'Intelligence', href: '#fitur' },
  { label: 'Security', href: '#keamanan' },
  { label: 'Company', href: '#institutional' },
];

export default function GLandingHeader({ dark, onToggleTheme, active = 'Platform' }) {
  const { setLanguage } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: scrolled ? 'color-mix(in srgb, var(--ka-bg1) 90%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--ka-border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <a href="#beranda" className="flex items-center gap-2 min-w-0 shrink">
          <KriptoAmanLogo size={30} showText={false} animate={false} className="shrink-0" />
          <span className="font-extrabold tracking-[0.12em] sm:tracking-[0.16em] text-xs sm:text-sm uppercase whitespace-nowrap">
            <span className="ka-text">KRIPTO</span><span className="ka-blue">AMAN</span>
          </span>
        </a>

        <nav className="hidden xl:flex items-center gap-6 text-sm">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
               className={`ka-nav-link ${active === l.label ? 'active' : ''}`}>{l.label}</a>
          ))}
          <Link to="/ZEVARYQ" className="ka-nav-link font-bold">ZEVARYQ</Link>
          <a href="https://explorer.kriptoaman.com/developer" target="_blank" rel="noreferrer" className="ka-nav-link inline-flex items-center gap-1">
            Developers <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={onToggleTheme} aria-label="Ganti tema"
            className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center ka-card2">
            {dark ? <Sun className="w-4 h-4 ka-gold" /> : <Moon className="w-4 h-4 ka-blue" />}
          </button>
          <Link to="/en" onClick={() => setLanguage('en')} hrefLang="en" aria-label="Switch to English" className="hidden xl:flex items-center gap-1.5 h-9 px-3 rounded-lg ka-card2 text-xs font-bold ka-text2">
            <Globe className="w-3.5 h-3.5" /> EN
          </Link>
          <Link to="/wallet-app" className="hidden sm:inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg text-xs font-extrabold ka-wallet-cta">
            <WalletCards className="w-3.5 h-3.5" /> ZEVARYQ Wallet
          </Link>
          <Link to="/login"
            className="ka-btn-primary inline-flex items-center justify-center px-3 sm:px-4 h-9 text-xs sm:text-sm">
            Sign In
          </Link>
          <button className="xl:hidden w-9 h-9 rounded-lg flex items-center justify-center ka-card2"
            onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden ka-card2 border-t mx-3 sm:mx-4 mb-3 rounded-xl p-3 flex flex-col gap-1">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`ka-nav-link px-3 py-2 rounded-lg text-sm ${active === l.label ? 'active' : ''}`}>{l.label}</a>
          ))}
          <Link to="/ZEVARYQ" onClick={() => setOpen(false)} className="ka-nav-link px-3 py-2 rounded-lg text-sm">ZEVARYQ Network</Link>
          <Link to="/wallet-app" onClick={() => setOpen(false)} className="ka-nav-link px-3 py-2 rounded-lg text-sm font-bold ka-gold">ZEVARYQ Wallet</Link>
          <a href="https://explorer.kriptoaman.com/developer" target="_blank" rel="noreferrer" className="ka-nav-link px-3 py-2 rounded-lg text-sm">Developers</a>
          <Link
            to="/en"
            onClick={() => { setLanguage('en'); setOpen(false); }}
            hrefLang="en"
            className="ka-nav-link px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2"
          >
            <Globe className="w-4 h-4" /> English
          </Link>
        </div>
      )}
    </header>
  );
}
