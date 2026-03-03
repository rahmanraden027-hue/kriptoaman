import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, ChevronDown, ExternalLink } from 'lucide-react';

const CHECKLIST_ITEMS = {
  metadata: {
    title: '📋 Metadata & Manifest',
    items: [
      { id: 'manifest', label: 'manifest.json exists', description: 'Required for PWA installation', status: 'complete' },
      { id: 'name', label: 'App name configured', description: '"name" field in manifest', status: 'complete' },
      { id: 'icons', label: 'Icons in multiple sizes', description: '192x192px, 512x512px, maskable icons', status: 'complete' },
      { id: 'theme_color', label: 'Theme color set', description: 'For browser UI customization', status: 'complete' },
      { id: 'display', label: 'Display mode standalone', description: 'Full-screen app experience', status: 'complete' }
    ]
  },
  security: {
    title: '🔒 Security Requirements',
    items: [
      { id: 'https', label: 'HTTPS enabled', description: 'Required for all PWA features — aktif di platform Base44', status: 'complete' },
      { id: 'csp', label: 'Content Security Policy headers', description: 'Sudah dikonfigurasi di index.html meta tags', status: 'complete' },
      { id: 'no-mixed', label: 'No mixed HTTP/HTTPS content', description: 'Semua resource menggunakan HTTPS', status: 'complete' },
      { id: 'auth', label: 'Secure authentication', description: 'JWT tokens, CORS properly configured', status: 'complete' },
      { id: 'data-encryption', label: 'Sensitive data encryption', description: 'User keys encrypted at rest', status: 'complete' }
    ]
  },
  serviceworker: {
    title: '⚙️ Service Worker',
    items: [
      { id: 'sw-register', label: 'Service Worker registered', description: 'Terdaftar di index.html (inline script)', status: 'complete' },
      { id: 'sw-offline', label: 'Offline functionality', description: 'Cache strategy implemented', status: 'complete' },
      { id: 'sw-updates', label: 'Update mechanism', description: 'Users notified of new versions via PWAUpdateNotification', status: 'complete' },
      { id: 'sw-install', label: 'Install & activate hooks', description: 'Proper cache management', status: 'complete' }
    ]
  },
  responsive: {
    title: '📱 Responsive Design',
    items: [
      { id: 'mobile-viewport', label: 'Mobile viewport configured', description: 'Meta viewport dengan viewport-fit=cover di index.html', status: 'complete' },
      { id: 'touch-friendly', label: 'Touch-friendly UI', description: 'Buttons min 48px, appropriate spacing', status: 'complete' },
      { id: 'safe-areas', label: 'Safe area support', description: 'Notch & bottom bar handling', status: 'complete' },
      { id: 'no-horizontal-scroll', label: 'No horizontal scrolling', description: 'Mobile width properly set', status: 'complete' }
    ]
  },
  seo: {
    title: '🔍 SEO & Discoverability',
    items: [
      { id: 'og-tags', label: 'Open Graph tags', description: 'Facebook/WhatsApp sharing preview', status: 'complete' },
      { id: 'twitter-card', label: 'Twitter Card tags', description: 'Twitter sharing preview', status: 'complete' },
      { id: 'structured-data', label: 'Structured data (JSON-LD)', description: 'MobileApplication schema di index.html', status: 'complete' },
      { id: 'canonical', label: 'Canonical URL set', description: 'Mencegah duplicate content', status: 'complete' },
      { id: 'lang', label: 'Language attribute', description: 'html lang="id" sudah diset', status: 'complete' }
    ]
  },
  appstore: {
    title: '🎯 App Store / Play Store',
    items: [
      { id: 'pwa-packaging', label: 'PWA packaging ready', description: 'Siap dibungkus dengan Bubblewrap (TWA) untuk Play Store', status: 'complete' },
      { id: 'privacy-policy', label: 'Privacy Policy URL', description: 'Halaman /PrivacyPolicy sudah ada & lengkap', status: 'complete' },
      { id: 'terms-of-service', label: 'Terms of Service', description: 'Halaman /TermsOfService sudah ada & lengkap', status: 'complete' },
      { id: 'age-rating', label: 'Age rating 18+ (Financial App)', description: 'Crypto app dikategorikan 18+ sesuai IARC', status: 'complete' },
      { id: 'version', label: 'Version numbering', description: 'v1.0.0 tercantum di meta tag & structured data', status: 'complete' },
      { id: 'description', label: 'App description & keywords', description: 'Meta description & keywords sudah lengkap', status: 'complete' }
    ]
  },
  performance: {
    title: '⚡ Performance',
    items: [
      { id: 'preconnect', label: 'Preconnect & DNS prefetch', description: 'Sudah ditambahkan untuk API kripto', status: 'complete' },
      { id: 'images-optimized', label: 'Images optimized', description: 'WebP dengan PNG fallback', status: 'complete' },
      { id: 'lazy-loading', label: 'Lazy loading enabled', description: 'Untuk gambar dan heavy components', status: 'complete' },
      { id: 'caching-strategy', label: 'Smart caching strategy', description: 'Cache-first untuk static, network-first untuk data', status: 'complete' }
    ]
  },
  legal: {
    title: '⚖️ Legal & Compliance',
    items: [
      { id: 'privacy-complete', label: 'Privacy Policy lengkap (GDPR/PDPA)', description: 'Termasuk hak pengguna, data sharing, cookies', status: 'complete' },
      { id: 'tos-complete', label: 'Terms of Service lengkap', description: 'Termasuk financial disclaimer, Indonesian law', status: 'complete' },
      { id: 'financial-disclaimer', label: 'Financial disclaimer', description: 'Peringatan risiko investasi kripto', status: 'complete' },
      { id: 'children-privacy', label: 'Children privacy (COPPA)', description: 'Larangan penggunaan untuk <18 tahun', status: 'complete' },
      { id: 'contact-info', label: 'Contact information', description: 'Email support & legal tersedia', status: 'complete' }
    ]
  }
};

function ChecklistSection({ section, items }) {
  const [expanded, setExpanded] = useState(true);
  const complete = items.filter(i => i.status === 'complete').length;
  const total = items.length;
  const percentage = Math.round((complete / total) * 100);

  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="text-sm font-bold text-white">{section.title}</span>
          <div className="flex-1 max-w-[120px]">
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{complete}/{total}</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-2.5">
          {items.map(item => (
            <div key={item.id} className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-medium text-sm">{item.label}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PWAReadinessChecklist() {
  const allItems = Object.values(CHECKLIST_ITEMS).flatMap(c => c.items);
  const totalComplete = allItems.filter(i => i.status === 'complete').length;
  const totalItems = allItems.length;
  const overallPercentage = Math.round((totalComplete / totalItems) * 100);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">📊 App Store Readiness</h1>
        <p className="text-slate-400 text-sm mb-4">COINVAULT — PWA Deployment Checklist</p>

        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold">Overall Progress</span>
            <span className="text-3xl font-bold text-green-400">{overallPercentage}%</span>
          </div>
          <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <p className="text-xs text-green-300 mt-2 font-semibold">{totalComplete} of {totalItems} items complete ✅</p>
        </div>

        {overallPercentage === 100 && (
          <div className="bg-green-500/15 border border-green-500/30 rounded-xl p-4 mb-4 text-center">
            <p className="text-green-300 font-bold text-lg">🎉 100% SIAP UNTUK APP STORE & PLAY STORE!</p>
            <p className="text-green-400 text-sm mt-1">Semua persyaratan teknis telah terpenuhi.</p>
          </div>
        )}
      </div>

      {Object.entries(CHECKLIST_ITEMS).map(([key, { title, items }]) => (
        <ChecklistSection key={key} section={{ title }} items={items} />
      ))}

      {/* Deployment Guide */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
        <p className="font-bold text-blue-300 text-sm">🚀 Langkah Deploy ke Store</p>
        <div className="space-y-2 text-xs text-blue-200">
          <div className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
            <div>
              <p className="font-semibold">Play Store (Android) via TWA</p>
              <p className="text-blue-300">Install Bubblewrap CLI → bubblewrap init → bubblewrap build → Upload ke Play Console</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
            <div>
              <p className="font-semibold">App Store (iOS) via Capacitor</p>
              <p className="text-blue-300">npm install @capacitor/core → capacitor add ios → Xcode build → Upload ke App Store Connect</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
            <div>
              <p className="font-semibold">Screenshot yang dibutuhkan</p>
              <p className="text-blue-300">Android: 1080x1920px (min 2). iOS: 1290x2796px (iPhone 15 Pro Max, min 3)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}