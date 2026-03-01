import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PWAInstallPrompt from '../components/pwa/PWAInstallPrompt';
import PWAReadinessChecklist from '../components/pwa/PWAReadinessChecklist';
import PWASetupGuide from '../components/pwa/PWASetupGuide';
import StoreDeploymentGuide from '../components/pwa/StoreDeploymentGuide';
import { CheckCircle2, AlertCircle, BookOpen, Zap, Package } from 'lucide-react';

export default function PWAValidation() {
  const [activeTab, setActiveTab] = useState('checklist');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto p-4 pt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">PWA App Store Readiness</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Comprehensive guide and checklist for deploying COINVAULT as a Progressive Web App to App Store & Play Store
          </p>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Overall Readiness</p>
                <p className="text-3xl font-bold text-indigo-400">72%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-slate-500 mt-3">24 of 33 items complete</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Critical Requirements</p>
                <p className="text-3xl font-bold text-blue-400">9/9</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-slate-500 mt-3">All completed</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Action Items</p>
                <p className="text-3xl font-bold text-yellow-400">9</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-xs text-slate-500 mt-3">To be completed</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700 rounded-xl p-1">
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Setup</span>
            </TabsTrigger>
            <TabsTrigger value="deployment" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Deploy</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="mt-6">
            <PWAReadinessChecklist />
          </TabsContent>

          <TabsContent value="setup" className="mt-6">
            <PWASetupGuide />
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Resources & Documentation</h2>
              </div>

              <div className="space-y-4">
                {/* App Store Distribution */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">🍎</span>
                    App Store (iOS)
                  </h3>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p><strong>Option 1: Direct Web App</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Add shortcut to home screen (iOS Safari)</li>
                      <li>Works as full-screen web app</li>
                      <li>No App Store submission required</li>
                    </ul>
                    
                    <p className="mt-4"><strong>Option 2: Native Wrapper (Recommended for Store)</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Use Capacitor to wrap PWA in native iOS app</li>
                      <li>Submit to App Store as standard native app</li>
                      <li>Access to push notifications, background sync</li>
                    </ul>

                    <p className="mt-4"><strong>Key Requirements:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Privacy Policy URL (required)</li>
                      <li>COPPA compliance if under 13 age rating</li>
                      <li>App screenshots (min 2)</li>
                      <li>App category selection</li>
                    </ul>

                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-300 font-medium">Tools:</p>
                      <p className="text-xs mt-1">• Capacitor (iOS/Android)</p>
                      <p className="text-xs">• Tauri (alternative)</p>
                      <p className="text-xs">• Native Swift + WebView (advanced)</p>
                    </div>
                  </div>
                </div>

                {/* Play Store Distribution */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    Play Store (Android)
                  </h3>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p><strong>Best Approach: Bubblewrap / Capacitor</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Wrap PWA in trusted web activity</li>
                      <li>Get native-like distribution</li>
                      <li>Full PWA features preserved</li>
                    </ul>

                    <p className="mt-4"><strong>Bubblewrap Setup:</strong></p>
                    <pre className="bg-slate-950 p-3 rounded text-xs overflow-x-auto mt-2">
{`npm install -g @bubblewrap/cli
bubblewrap init --manifest-url=https://yoursite.com/manifest.json
bubblewrap build`}
                    </pre>

                    <p className="mt-4"><strong>Requirements:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>HTTPS enabled (required)</li>
                      <li>manifest.json with icons</li>
                      <li>Privacy Policy & Terms of Service URLs</li>
                      <li>App signing keystore</li>
                      <li>Age rating (IARC)</li>
                    </ul>

                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-300 font-medium">Advantages:</p>
                      <p className="text-xs mt-1">✓ Single codebase (web)</p>
                      <p className="text-xs">✓ Easier maintenance</p>
                      <p className="text-xs">✓ Faster updates (no store delay)</p>
                      <p className="text-xs">✓ Lower development cost</p>
                    </div>
                  </div>
                </div>

                {/* Legal & Compliance */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">⚖️</span>
                    Legal & Compliance
                  </h3>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p><strong>Documents Required:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><span className="font-medium">Privacy Policy</span> - GDPR, CCPA compliant</li>
                      <li><span className="font-medium">Terms of Service</span> - User rights & restrictions</li>
                      <li><span className="font-medium">Cookie Policy</span> - If tracking used</li>
                      <li><span className="font-medium">Disclaimer</span> - Financial/crypto risks</li>
                    </ul>

                    <p className="mt-4"><strong>For Crypto Apps Specifically:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>KYC/AML compliance if handling real funds</li>
                      <li>Risk warnings for trading features</li>
                      <li>Age 18+ verification (if required by region)</li>
                      <li>Geographical restrictions (some countries ban crypto apps)</li>
                    </ul>

                    <p className="mt-4"><strong>Store Policies:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Apple doesn't allow direct crypto trading in many regions</li>
                      <li>Google Play allows crypto but with restrictions</li>
                      <li>Provide proof of compliance documentation</li>
                    </ul>
                  </div>
                </div>

                {/* Testing & Validation */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">🧪</span>
                    Testing & Validation
                  </h3>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p><strong>Before Store Submission:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Run Google Lighthouse audit (target: 90+)</li>
                      <li>Test on actual devices (iOS + Android)</li>
                      <li>Verify offline functionality</li>
                      <li>Test installation and uninstallation</li>
                      <li>Check all links point to HTTPS</li>
                    </ul>

                    <p className="mt-4"><strong>Tools:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><span className="font-medium">Lighthouse</span> - Built into Chrome DevTools</li>
                      <li><span className="font-medium">PWA Builder</span> - microsoft.com/en-us/windows/pwa</li>
                      <li><span className="font-medium">Mobile-Friendly Test</span> - Google's tool</li>
                      <li><span className="font-medium">Browserstack</span> - Real device testing</li>
                    </ul>

                    <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-orange-300 font-medium">Critical: Test on Real Devices</p>
                      <p className="text-xs mt-1">Desktop testing may not catch mobile-specific issues (keyboard, safe areas, touch input)</p>
                    </div>
                  </div>
                </div>

                {/* Deployment Checklist */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    Pre-Launch Checklist
                  </h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>HTTPS enabled with valid certificate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>Service Worker registered and tested</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>Offline functionality verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>Lighthouse audit passing (90+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>Icons and screenshots prepared</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>Privacy Policy URL set</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>Terms of Service ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>App metadata and description finalized</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>Developer accounts created (Apple, Google)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-12 py-8 border-t border-slate-700/50 text-center text-sm text-slate-400">
          <p>Last updated: March 1, 2026</p>
          <p className="mt-2">For questions about App Store policies, refer to official guidelines:<br/>
            <span className="text-slate-500">Apple App Store Review Guidelines | Google Play Policies</span>
          </p>
        </div>
      </div>

      <PWAInstallPrompt />
    </div>
  );
}