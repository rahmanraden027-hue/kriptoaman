import { useEffect, useState } from 'react';

const SITE_URL = 'https://kriptoaman.com';
const DEFAULT_IMAGE = `${SITE_URL}/kriptoaman-logo-primary.png`;

const PUBLIC_META = {
  '/': {
    title: 'KriptoAman — Crypto Intelligence & Digital Asset Monitoring',
    description: 'KriptoAman menghadirkan intelijen pasar, pemantauan aset digital, edukasi, dan konteks risiko dalam pengalaman modern yang dirancang untuk pengguna Indonesia dan global.',
    robots: 'index, follow, max-image-preview:large',
    locale: 'id_ID',
    language: 'id',
  },
  '/en': {
    title: 'KriptoAman — Crypto Intelligence & Digital Asset Monitoring',
    description: 'KriptoAman brings together market intelligence, digital asset monitoring, education, and risk context in a modern experience designed for global users.',
    robots: 'index, follow, max-image-preview:large',
    locale: 'en_US',
    language: 'en',
  },
  '/AboutUs': {
    title: 'About KriptoAman — Digital Asset Intelligence Platform',
    description: 'Learn about KriptoAman, its platform scope, approach to digital asset intelligence, monitoring, education, transparency, and responsible risk communication.',
    robots: 'index, follow, max-image-preview:large',
    locale: 'id_ID',
    language: 'id',
  },
  '/Edukasi': {
    title: 'Crypto Education — KriptoAman',
    description: 'Materi edukasi KriptoAman untuk membantu pengguna memahami aset digital, blockchain, risiko, dan praktik keamanan kripto secara lebih bertanggung jawab.',
    robots: 'index, follow, max-image-preview:large',
    locale: 'id_ID',
    language: 'id',
  },
  '/Contact': {
    title: 'Contact — KriptoAman',
    description: 'Official KriptoAman contact information for platform, partnership, media, and user-support inquiries.',
    robots: 'index, follow, max-image-preview:large',
    locale: 'id_ID',
    language: 'id',
  },
  '/PrivacyPolicy': {
    title: 'Privacy Policy — KriptoAman',
    description: 'KriptoAman privacy policy covering how user information is handled and protected.',
    robots: 'index, follow',
    locale: 'id_ID',
    language: 'id',
  },
  '/TermsOfService': {
    title: 'Terms of Service — KriptoAman',
    description: 'Terms governing the use of KriptoAman services and platform features.',
    robots: 'index, follow',
    locale: 'id_ID',
    language: 'id',
  },
  '/Disclaimer': {
    title: 'Risk & Information Disclaimer — KriptoAman',
    description: 'Important information about the scope, limitations, and responsible use of information available through KriptoAman.',
    robots: 'index, follow',
    locale: 'id_ID',
    language: 'id',
  },
  '/AccountDeletion': {
    title: 'Account Deletion — KriptoAman',
    description: 'Official information about the KriptoAman account deletion process.',
    robots: 'index, follow',
    locale: 'id_ID',
    language: 'id',
  },
};

function upsertMeta(name, content, attribute = 'name') {
  let node = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, name);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function upsertLink(rel, href, attrs = {}) {
  const selector = Object.entries(attrs).reduce(
    (value, [key, item]) => `${value}[${key}="${item}"]`,
    `link[rel="${rel}"]`
  );
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

function absoluteUrl(pathname) {
  return `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
}

function updateAlternateLinks() {
  upsertLink('alternate', `${SITE_URL}/`, { hreflang: 'id' });
  upsertLink('alternate', `${SITE_URL}/en`, { hreflang: 'en' });
  upsertLink('alternate', `${SITE_URL}/`, { hreflang: 'x-default' });
}

export default function RouteSeo() {
  const [pathname, setPathname] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const notify = () => setPathname(window.location.pathname || '/');
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      notify();
    };
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      notify();
    };
    window.addEventListener('popstate', notify);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', notify);
    };
  }, []);

  useEffect(() => {
    const pageMeta = PUBLIC_META[pathname];
    const isEnglish = pathname === '/en';
    const title = pageMeta?.title || (isEnglish ? 'KriptoAman — User Workspace' : 'KriptoAman — Area Pengguna');
    const description = pageMeta?.description || (isEnglish
      ? 'KriptoAman user workspace for digital asset information and monitoring.'
      : 'Area pengguna KriptoAman untuk informasi dan pemantauan aset digital.');
    const robots = pageMeta?.robots || 'noindex, nofollow, noarchive';
    const locale = pageMeta?.locale || (isEnglish ? 'en_US' : 'id_ID');
    const language = pageMeta?.language || (isEnglish ? 'en' : 'id');
    const url = absoluteUrl(pathname);

    document.title = title;
    document.documentElement.lang = language;

    upsertMeta('description', description);
    upsertMeta('robots', robots);
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('og:site_name', 'KriptoAman', 'property');
    upsertMeta('og:title', title, 'property');
    upsertMeta('og:description', description, 'property');
    upsertMeta('og:url', url, 'property');
    upsertMeta('og:image', DEFAULT_IMAGE, 'property');
    upsertMeta('og:image:alt', 'KriptoAman digital asset intelligence platform', 'property');
    upsertMeta('og:locale', locale, 'property');
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', title);
    upsertMeta('twitter:description', description);
    upsertMeta('twitter:image', DEFAULT_IMAGE);

    upsertLink('canonical', url);
    updateAlternateLinks();
  }, [pathname]);

  return null;
}
