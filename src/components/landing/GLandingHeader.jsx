import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import { useLanguage } from '@/lib/LanguageContext';

const LINKS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Keamanan', href: '#keamanan' },
  { label: 'Tentang Kami', href: '#tentang' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Kontak', href: '#kontak' },
];

export default function GLandingHeader({ dark, onToggleTheme, active = 'Beranda' }) {
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
        background: scrolled ? 'color-mix(in srgb, var(--ka-bg1) 88%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--ka-border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <a href="#beranda" className="flex items-center gap-2 shrink-0">
          <KriptoAmanLogo size={30} showText={false} animate={false} />
          <span className="font-extrabold tracking-[0.18em] text-sm uppercase">
            <span className="ka-text">KRIPTO</span><span className="ka-blue">AMAN</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-7 text-sm">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
               className={`ka-nav-link ${active === l.label ? 'active' : ''}`}>{l.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={onToggleTheme} aria-label="Ganti tema"
            className="w-9 h-9 rounded-lg flex items-center justify-center ka-card2">
            {dark ? <Sun className="w-4 h-4 ka-gold" /> : <Moon className="w-4 h-4 ka-blue" />}
          </button>
          <Link to="/en" onClick={() => setLanguage('en')} hrefLang="en" aria-label="Switch to English" className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg ka-card2 text-xs font-bold ka-text2 hover:ka-blue">
            <Globe className="w-3.5 h-3.5" /> EN
          </Link>
          <Link to="/login"
            className="ka-btn-primary inline-flex items-center justify-center px-4 h-9 text-sm">
            Masuk
          </Link>
          <button className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center ka-card2"
            onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden ka-card2 border-t mx-4 mb-3 rounded-xl p-3 flex flex-col gap-1">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`ka-nav-link px-3 py-2 rounded-lg text-sm ${active === l.label ? 'active' : ''}`}>{l.label}</a>
          ))}
        </div>
      )}
    </header>
  );
}