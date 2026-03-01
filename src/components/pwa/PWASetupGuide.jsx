import React, { useState } from 'react';
import { Code2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SETUP_STEPS = [
  {
    id: 'html-setup',
    title: 'HTML Setup (index.html)',
    description: 'Add manifest and service worker to your HTML head',
    code: `<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Icons -->
<link rel="apple-touch-icon" href="/icon-192x192.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png">

<!-- Theme Color -->
<meta name="theme-color" content="#3b82f6">
<meta name="background-color" content="#0f172a">

<!-- Viewport for mobile -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

<!-- Status bar styling (iOS) -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="COINVAULT">`,
    status: 'pending'
  },
  {
    id: 'sw-register',
    title: 'Register Service Worker',
    description: 'Add to your React app entry point (main.jsx or App.jsx)',
    code: `// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    .then(reg => {
      console.log('Service Worker registered', reg);
      
      // Check for updates every hour
      setInterval(() => {
        reg.update();
      }, 60 * 60 * 1000);
    })
    .catch(err => console.log('SW registration failed:', err));
  });
}

// Listen for updates
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}`,
    status: 'pending'
  },
  {
    id: 'manifest',
    title: 'Create manifest.json',
    description: 'Add to public root directory with app metadata',
    code: `{
  "name": "COINVAULT - Cryptocurrency Wallet & Trading",
  "short_name": "COINVAULT",
  "description": "Secure crypto wallet with DEX trading",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}`,
    status: 'complete'
  },
  {
    id: 'https',
    title: 'Enable HTTPS',
    description: 'Critical requirement for PWA',
    code: `# Check HTTPS status
# Your domain must have a valid SSL certificate

# On Netlify (auto):
# Simply deploy - automatic HTTPS

# On Vercel (auto):
# Simply deploy - automatic HTTPS

# On custom server (nginx):
server {
  listen 443 ssl http2;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://localhost:3000;
  }
}`,
    status: 'pending'
  },
  {
    id: 'headers',
    title: 'Security Headers',
    description: 'Configure server to send security headers',
    code: `# Vercel (vercel.json):
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}`,
    status: 'pending'
  }
];

function CodeBlock({ code, stepId }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-700/50">
      <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-slate-700/50">
        <span className="text-xs font-mono text-slate-400">{stepId}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-7 text-xs border-slate-700 text-slate-400 hover:text-white"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function PWASetupGuide() {
  const [expandedStep, setExpandedStep] = useState(null);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Code2 className="w-8 h-8 text-indigo-400" />
          PWA Setup Guide
        </h1>
        <p className="text-slate-400">Step-by-step instructions to make COINVAULT a production-ready PWA</p>
      </div>

      <div className="space-y-4">
        {SETUP_STEPS.map((step, idx) => (
          <div key={step.id} className="border border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              className="w-full flex items-center gap-4 p-4 bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex-shrink-0">
                {step.status === 'complete' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">
                  {idx + 1}. {step.title}
                </p>
                <p className="text-sm text-slate-400">{step.description}</p>
              </div>
            </button>

            {expandedStep === step.id && (
              <div className="border-t border-slate-700/50 p-4 bg-slate-900/20">
                <CodeBlock code={step.code} stepId={step.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-2">
        <p className="font-semibold text-yellow-300">⚠️ Important Notes</p>
        <ul className="text-sm text-yellow-200 space-y-1">
          <li>• Service Worker works only on HTTPS (and localhost for development)</li>
          <li>• Test offline functionality: DevTools → Network → Offline</li>
          <li>• Icons should be square (PNG 192x192 minimum)</li>
          <li>• Maskable icons allow safe areas on adaptive devices</li>
          <li>• Use Lighthouse to validate: DevTools → Lighthouse → PWA</li>
        </ul>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
        <p className="font-semibold text-blue-300">✅ Testing Checklist</p>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>☐ Install app on Android (Play Store)</li>
          <li>☐ Install app on iOS (App Store or Home Screen)</li>
          <li>☐ Test offline mode (disable network)</li>
          <li>☐ Verify app loads in fullscreen mode</li>
          <li>☐ Check push notifications work</li>
          <li>☐ Verify background sync for transactions</li>
          <li>☐ Run Lighthouse audit (target: 90+)</li>
        </ul>
      </div>
    </div>
  );
}