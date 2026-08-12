import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PUBLIC_META = {
  '/': {
    title: 'KriptoAman — Informasi & Pemantauan Kripto Indonesia',
    description: 'KriptoAman menyediakan informasi, pemantauan pasar, edukasi, dan analisis risiko aset digital untuk membantu pengguna memahami aktivitas kripto secara lebih transparan.',
    robots: 'index, follow, max-image-preview:large',
  },
  '/en': {
    title: 'KriptoAman — Crypto Information & Monitoring',
    description: 'KriptoAman provides crypto market information, monitoring, education, and risk analysis to help users understand digital asset activity more transparently.',
    robots: 'index, follow, max-image-preview:large',
  },
  '/AboutUs': {
    title: 'Tentang KriptoAman — Informasi Platform',
    description: 'Pelajari tujuan, ruang lingkup, dan pendekatan KriptoAman dalam menyediakan informasi, pemantauan, edukasi, dan analisis risiko aset digital.',
    robots: 'index, follow, max-image-preview:large',
  },
  '/Edukasi': {
    title: 'Edukasi Kripto — KriptoAman',
    description: 'Materi edukasi untuk membantu pengguna memahami aset digital, blockchain, risiko, dan praktik keamanan kripto.',
    robots: 'index, follow, max-image-preview:large',
  },
  '/Contact': {
    title: 'Kontak — KriptoAman',
    description: 'Informasi kontak resmi KriptoAman untuk pertanyaan terkait platform dan dukungan pengguna.',
    robots: 'index, follow, max-image-preview:large',
  },
  '/PrivacyPolicy': {
    title: 'Kebijakan Privasi — KriptoAman',
    description: 'Kebijakan privasi KriptoAman mengenai pengelolaan dan perlindungan data pengguna.',
    robots: 'index, follow',
  },
  '/TermsOfService': {
    title: 'Ketentuan Layanan — KriptoAman',
    description: 'Ketentuan penggunaan layanan dan fitur KriptoAman.',
    robots: 'index, follow',
  },
  '/Disclaimer': {
    title: 'Disclaimer — KriptoAman',
    description: 'Batasan informasi dan penggunaan layanan KriptoAman.',
    robots: 'index, follow',
  },
  '/AccountDeletion': {
    title: 'Penghapusan Akun — KriptoAman',
    description: 'Informasi resmi mengenai proses penghapusan akun KriptoAman.',
    robots: 'index, follow',
  },
};

const NOINDEX_PREFIXES = [
  '/login', '/register', '/forgot-password', '/reset-password', '/dashboard',
  '/Profile', '/Settings', '/Wallet', '/Alerts', '/Market', '/Admin',
  '/ServerControl', '/SecureVault', '/SecurityCenter', '/AMLDashboard',
  '/AMLAssistant', '/BigQueryKYCReports', '/FeatureUpdateBroadcast',
  '/MultiChainWallet', '/Services', '/SecurityHub',
];

function setMeta(name, content, attribute = 'name') {
  let node = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, name);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function setCanonical(pathname) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'canonical');
    document.head.appendChild(node);
  }
  node.setAttribute('href', `https://kriptoaman.com${pathname === '/' ? '/' : pathname}`);
}

export default function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageMeta = PUBLIC_META[pathname];
    const shouldNoIndex = !pageMeta || NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    const title = pageMeta?.title || 'KriptoAman — Area Pengguna';
    const description = pageMeta?.description || 'Area pengguna KriptoAman untuk fitur informasi dan pemantauan aset digital.';
    const robots = shouldNoIndex ? 'noindex, nofollow, noarchive' : pageMeta.robots;

    document.title = title;
    setMeta('description', description);
    setMeta('robots', robots);
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', `https://kriptoaman.com${pathname === '/' ? '/' : pathname}`, 'property');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setCanonical(pathname);
  }, [pathname]);

  return null;
}
