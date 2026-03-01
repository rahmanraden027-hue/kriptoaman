import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, ChevronDown } from 'lucide-react';

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
      { id: 'https', label: 'HTTPS enabled', description: 'Required for all PWA features', status: 'pending', note: 'Must deploy with HTTPS certificate' },
      { id: 'csp', label: 'Content Security Policy headers', description: 'Prevent XSS attacks', status: 'pending', note: 'Configure on server' },
      { id: 'no-mixed', label: 'No mixed HTTP/HTTPS content', description: 'All resources must be HTTPS', status: 'pending' },
      { id: 'auth', label: 'Secure authentication', description: 'JWT tokens, CORS properly configured', status: 'complete' },
      { id: 'data-encryption', label: 'Sensitive data encryption', description: 'User keys encrypted at rest', status: 'complete' }
    ]
  },
  serviceworker: {
    title: '⚙️ Service Worker',
    items: [
      { id: 'sw-register', label: 'Service Worker registered', description: 'In application entry point', status: 'pending' },
      { id: 'sw-offline', label: 'Offline functionality', description: 'Cache strategy implemented', status: 'complete' },
      { id: 'sw-updates', label: 'Update mechanism', description: 'Users notified of new versions', status: 'pending' },
      { id: 'sw-install', label: 'Install & activate hooks', description: 'Proper cache management', status: 'complete' }
    ]
  },
  responsive: {
    title: '📱 Responsive Design',
    items: [
      { id: 'mobile-viewport', label: 'Mobile viewport configured', description: 'Meta viewport in HTML head', status: 'complete' },
      { id: 'touch-friendly', label: 'Touch-friendly UI', description: 'Buttons min 48px, appropriate spacing', status: 'complete' },
      { id: 'safe-areas', label: 'Safe area support', description: 'Notch & bottom bar handling', status: 'complete' },
      { id: 'no-horizontal-scroll', label: 'No horizontal scrolling', description: 'Mobile width properly set', status: 'complete' }
    ]
  },
  appstore: {
    title: '🎯 App Store / Play Store',
    items: [
      { id: 'pwa-packaging', label: 'PWA packaging ready', description: 'Use Tools4App or similar for stores', status: 'pending', note: 'Requires tool like Bubblewrap for Play Store' },
      { id: 'privacy-policy', label: 'Privacy Policy URL', description: 'Public URL with full policy', status: 'pending' },
      { id: 'terms-of-service', label: 'Terms of Service', description: 'Legal document for app usage', status: 'pending' },
      { id: 'age-rating', label: 'Age rating classification', description: 'IARC questionnaire completed', status: 'pending' },
      { id: 'screenshots', label: 'Store screenshots', description: 'Min 2 screenshots per device type', status: 'pending' },
      { id: 'description', label: 'App description & keywords', description: 'For store listing optimization', status: 'pending' },
      { id: 'version', label: 'Version numbering', description: 'Semantic versioning (1.0.0)', status: 'pending' }
    ]
  },
  performance: {
    title: '⚡ Performance',
    items: [
      { id: 'load-time', label: 'Load time < 3 seconds', description: 'Especially on 3G networks', status: 'pending', note: 'Use Lighthouse to measure' },
      { id: 'bundle-size', label: 'Optimized bundle size', description: 'Minimize JS/CSS bundles', status: 'pending' },
      { id: 'images-optimized', label: 'Images optimized', description: 'WebP with PNG fallback', status: 'complete' },
      { id: 'lazy-loading', label: 'Lazy loading enabled', description: 'For images and heavy components', status: 'complete' },
      { id: 'caching-strategy', label: 'Smart caching strategy', description: 'Cache-first for static, network-first for data', status: 'complete' }
    ]
  },
  testing: {
    title: '✅ Testing & Validation',
    items: [
      { id: 'lighthouse', label: 'Lighthouse audit 90+', description: 'Performance, PWA, Accessibility, SEO', status: 'pending' },
      { id: 'offline-test', label: 'Offline functionality tested', description: 'Use DevTools to simulate offline', status: 'pending' },
      { id: 'install-test', label: 'Installation tested', description: 'On mobile devices (iOS & Android)', status: 'pending' },
      { id: 'permissions', label: 'Permissions properly handled', description: 'Location, camera, microphone', status: 'complete' },
      { id: 'cross-browser', label: 'Cross-browser compatibility', description: 'iOS Safari, Chrome, Firefox, Edge', status: 'pending' }
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
          <span className="text-xl">{section.title}</span>
          <div className="flex-1 max-w-[150px]">
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{complete}/{total} complete</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex gap-3">
              {item.status === 'complete' && (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              )}
              {item.status === 'pending' && (
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${item.status === 'complete' ? 'text-green-300' : 'text-yellow-300'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-400">{item.description}</p>
                {item.note && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <Info className="w-3 h-3" />
                    {item.note}
                  </div>
                )}
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
        <h1 className="text-3xl font-bold text-white mb-2">📊 PWA App Store Readiness Checklist</h1>
        <p className="text-slate-400 mb-4">COINVAULT - Progressive Web App Deployment Checklist</p>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold">Overall Progress</span>
            <span className="text-2xl font-bold text-indigo-400">{overallPercentage}%</span>
          </div>
          <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 transition-all"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{totalComplete} of {totalItems} items complete</p>
        </div>
      </div>

      {Object.entries(CHECKLIST_ITEMS).map(([key, { title, items }]) => (
        <ChecklistSection key={key} section={{ title }} items={items} />
      ))}

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
        <p className="font-semibold text-blue-300">⚠️ Next Steps</p>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>✓ Configure HTTPS for your domain</li>
          <li>✓ Register Service Worker in index.html</li>
          <li>✓ Add Privacy Policy & Terms of Service URLs</li>
          <li>✓ Prepare screenshots for store listings</li>
          <li>✓ Run Lighthouse audit (DevTools)</li>
          <li>✓ Test installation on actual devices</li>
          <li>✓ Use Bubblewrap or similar for Play Store packaging</li>
        </ul>
      </div>
    </div>
  );
}