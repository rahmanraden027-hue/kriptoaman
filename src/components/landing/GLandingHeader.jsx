import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import { useLanguage } from '@/lib/LanguageContext';

const LINKS = [
  { label: 'Platform', href: '#beranda' },
  { label: 'Intelligence', href: '#fitur' },
  { label: 'Network', href: '#network-operations' },
  { label: 'Company', href: '/company' },
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
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-[60px] flex items-center justify-between gap-2 sm:gap-4">
        <a href="#beranda" className="flex items-center gap-2 min-w-0 shrink">
          <KriptoAmanLogo size={36} showText={false} animate={false} className="shrink-0" src="/icons/kriptoaman-192.png" fetchPriority="low" decoding="async" />
          <span className="font-extrabold tracking-[0.11em] sm:tracking-[0.16em] text-sm sm:text-[15px] uppercase whitespace-nowrap">
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
            Developers <span aria-hidden="true">↗</span>
          </a>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={onToggleTheme} aria-label="Ganti tema"
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center ka-card2">
            <span aria-hidden="true" className={dark ? "ka-gold text-sm" : "ka-blue text-sm"}>{dark ? "☀" : "◐"}</span>
          </button>
          <Link to="/en" onClick={() => setLanguage('en')} hrefLang="en" aria-label="Switch to English" className="hidden xl:flex items-center gap-1.5 h-8 px-3 rounded-lg ka-card2 text-xs font-bold ka-text2">
            <span aria-hidden="true">◎</span> EN
          </Link>
          <Link to="/wallet-app" className="hidden sm:inline-flex items-center justify-center gap-2 h-8 px-3 rounded-lg text-xs font-extrabold ka-wallet-cta">
            <span aria-hidden="true">◇</span> ZEVARYQ Wallet
          </Link>
          <Link to="/login"
            className="ka-btn-primary inline-flex items-center justify-center px-3 sm:px-4 h-8 text-xs sm:text-sm">
            Sign In
          </Link>
          <button className="xl:hidden w-8 h-8 rounded-lg flex items-center justify-center ka-card2"
            onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <span aria-hidden="true" className="text-lg leading-none">{open ? "×" : "☰"}</span>
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
            <span aria-hidden="true">◎</span> English
          </Link>
        </div>
      )}
    </header>
  );
}
