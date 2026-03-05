import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HardDrive, Package, Zap, TrendingUp, BarChart3, Download } from 'lucide-react';

const BUILD_DATA = {
  timestamp: '2026-03-04T10:15:00Z',
  
  // Development Build
  dev: {
    main: { size: 245, unit: 'KB', compressed: 68, unit_c: 'KB' },
    chunks: [
      { name: 'wallet.chunk', size: 412, compressed: 89 },
      { name: 'trading.chunk', size: 356, compressed: 74 },
      { name: 'market.chunk', size: 278, compressed: 62 },
      { name: 'p2p.chunk', size: 142, compressed: 38 }
    ],
    css: { size: 185, compressed: 24 },
    assets: { size: 2140, compressed: 1985 },
    total: { size: 3758, compressed: 2340 }
  },

  // Production Build (Optimized)
  prod: {
    main: { size: 156, unit: 'KB', compressed: 42, unit_c: 'KB' },
    chunks: [
      { name: 'wallet.chunk', size: 278, compressed: 62 },
      { name: 'trading.chunk', size: 234, compressed: 48 },
      { name: 'market.chunk', size: 189, compressed: 41 },
      { name: 'p2p.chunk', size: 94, compressed: 26 }
    ],
    css: { size: 142, compressed: 18 },
    assets: { size: 2140, compressed: 1985 },
    total: { size: 3233, compressed: 2182 }
  },

  // Store Packages
  appstore: {
    ios_ipa: { size: 45.2, unit: 'MB', gzip: 38.5 },
    ios_app_clip: { size: 12.4, unit: 'MB', gzip: 9.8 },
    app_bundle: { size: 52.6, unit: 'MB' }
  },

  playstore: {
    android_aab: { size: 38.8, unit: 'MB', gzip: 33.2 },
    universal_apk: { size: 42.1, unit: 'MB', gzip: 35.9 },
    download_sizes: {
      'Xiaomi 11': 28.5,
      'Samsung S22': 29.8,
      'iPhone 15': 26.3
    }
  }
};

function SizeBar({ label, size, maxSize = 500 }) {
  const percentage = (size / maxSize) * 100;
  const color = percentage > 75 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400 font-semibold">{size} KB</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

export default function AppBuildAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');

  const devTotal = BUILD_DATA.dev.total.size;
  const prodTotal = BUILD_DATA.prod.total.size;
  const savings = devTotal - prodTotal;
  const savingsPercent = ((savings / devTotal) * 100).toFixed(1);

  const devCompressed = BUILD_DATA.dev.total.compressed;
  const prodCompressed = BUILD_DATA.prod.total.compressed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-20">
      <div className="max-w-6xl mx-auto pt-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">App Build Analytics</h1>
              <p className="text-slate-400 text-sm">KriptoAman — Bundle & App Store Sizes</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/60 border-slate-700/40 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-2">Dev Bundle</p>
                <p className="text-2xl font-bold text-white">{devTotal} KB</p>
                <p className="text-xs text-slate-400 mt-1">Gzip: {devCompressed} KB</p>
              </div>
              <Package className="w-5 h-5 text-cyan-400" />
            </div>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700/40 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-2">Prod Bundle</p>
                <p className="text-2xl font-bold text-white">{prodTotal} KB</p>
                <p className="text-xs text-slate-400 mt-1">Gzip: {prodCompressed} KB</p>
              </div>
              <Zap className="w-5 h-5 text-green-400" />
            </div>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700/40 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-2">Savings</p>
                <p className="text-2xl font-bold text-emerald-400">{savingsPercent}%</p>
                <p className="text-xs text-slate-400 mt-1">{savings} KB reduction</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700/40 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-2">App Store Size</p>
                <p className="text-2xl font-bold text-white">38.8 MB</p>
                <p className="text-xs text-slate-400 mt-1">Play Store AAB</p>
              </div>
              <Download className="w-5 h-5 text-blue-400" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700 rounded-xl p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="build">Build Files</TabsTrigger>
            <TabsTrigger value="stores">App Stores</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bundle Size Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-cyan-400 font-semibold text-sm">Development</h4>
                  <SizeBar label="Main" size={BUILD_DATA.dev.main.size} maxSize={300} />
                  <SizeBar label="CSS" size={BUILD_DATA.dev.css.size} maxSize={300} />
                  <SizeBar label="Assets" size={BUILD_DATA.dev.assets.size} maxSize={2500} />
                  <div className="pt-2 border-t border-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-semibold">Total</span>
                      <span className="text-cyan-400 font-bold">{devTotal} KB</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-green-400 font-semibold text-sm">Production</h4>
                  <SizeBar label="Main" size={BUILD_DATA.prod.main.size} maxSize={300} />
                  <SizeBar label="CSS" size={BUILD_DATA.prod.css.size} maxSize={300} />
                  <SizeBar label="Assets" size={BUILD_DATA.prod.assets.size} maxSize={2500} />
                  <div className="pt-2 border-t border-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-semibold">Total</span>
                      <span className="text-green-400 font-bold">{prodTotal} KB</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-blue-500/10 border border-blue-500/20 p-4">
              <p className="text-blue-300 text-sm">
                <strong>Optimization Techniques:</strong> Tree-shaking, code splitting, asset compression, lazy loading, minification, CSS purging
              </p>
            </Card>
          </TabsContent>

          {/* Build Files Tab */}
          <TabsContent value="build" className="mt-6 space-y-4">
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Production Build Chunks</h3>
              <div className="space-y-4">
                {BUILD_DATA.prod.chunks.map((chunk, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{chunk.name}</p>
                        <p className="text-xs text-slate-400 mt-1">Raw: {chunk.size} KB | Gzip: {chunk.compressed} KB</p>
                      </div>
                      <span className="text-slate-400 text-sm font-semibold">
                        {((chunk.compressed / chunk.size) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div 
                        className="h-full bg-cyan-500 rounded-full" 
                        style={{ width: `${(chunk.compressed / chunk.size) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* App Stores Tab */}
          <TabsContent value="stores" className="mt-6 space-y-6">
            {/* iOS */}
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🍎</span> App Store (iOS)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">IPA Bundle</p>
                  <p className="text-xl font-bold text-white">{BUILD_DATA.appstore.ios_ipa.size} MB</p>
                  <p className="text-xs text-slate-400 mt-1">Gzip: {BUILD_DATA.appstore.ios_ipa.gzip} MB</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">App Clip</p>
                  <p className="text-xl font-bold text-white">{BUILD_DATA.appstore.ios_app_clip.size} MB</p>
                  <p className="text-xs text-slate-400 mt-1">Gzip: {BUILD_DATA.appstore.ios_app_clip.gzip} MB</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">App Bundle</p>
                  <p className="text-xl font-bold text-white">{BUILD_DATA.appstore.app_bundle.size} MB</p>
                  <p className="text-xs text-slate-400 mt-1">With assets</p>
                </div>
              </div>
            </Card>

            {/* Android */}
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🤖</span> Play Store (Android)
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1">AAB (App Bundle)</p>
                    <p className="text-xl font-bold text-white">{BUILD_DATA.playstore.android_aab.size} MB</p>
                    <p className="text-xs text-slate-400 mt-1">Gzip: {BUILD_DATA.playstore.android_aab.gzip} MB</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1">Universal APK</p>
                    <p className="text-xl font-bold text-white">{BUILD_DATA.playstore.universal_apk.size} MB</p>
                    <p className="text-xs text-slate-400 mt-1">Gzip: {BUILD_DATA.playstore.universal_apk.gzip} MB</p>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-300 text-sm font-semibold mb-3">Download Size by Device</p>
                  <div className="space-y-3">
                    {Object.entries(BUILD_DATA.playstore.download_sizes).map(([device, size]) => (
                      <div key={device}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{device}</span>
                          <span className="text-slate-300 font-semibold">{size} MB</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${(size / 35) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="mt-6">
            <Card className="bg-slate-800/60 border-slate-700/40 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Bundle Breakdown</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-slate-300 font-semibold text-sm mb-4">JavaScript Chunks (Production)</h4>
                  <div className="space-y-2">
                    {BUILD_DATA.prod.chunks.map((chunk, idx) => {
                      const percent = (chunk.size / prodTotal * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-300">{chunk.name}</span>
                              <span className="text-slate-400">{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div 
                                className="h-full bg-purple-500 rounded-full" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-slate-400 text-xs whitespace-nowrap">{chunk.size} KB</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <h4 className="text-slate-300 font-semibold text-sm mb-4">Resource Breakdown</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Assets (Images, Fonts)', size: BUILD_DATA.prod.assets.size, percent: (BUILD_DATA.prod.assets.size / prodTotal * 100).toFixed(1), color: 'bg-blue-500' },
                      { name: 'Main Bundle', size: BUILD_DATA.prod.main.size, percent: (BUILD_DATA.prod.main.size / prodTotal * 100).toFixed(1), color: 'bg-cyan-500' },
                      { name: 'Code Chunks', size: BUILD_DATA.prod.chunks.reduce((a, b) => a + b.size, 0), percent: (BUILD_DATA.prod.chunks.reduce((a, b) => a + b.size, 0) / prodTotal * 100).toFixed(1), color: 'bg-purple-500' },
                      { name: 'CSS', size: BUILD_DATA.prod.css.size, percent: (BUILD_DATA.prod.css.size / prodTotal * 100).toFixed(1), color: 'bg-pink-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">{item.name}</span>
                            <span className="text-slate-400">{item.percent}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className={`h-full ${item.color} rounded-full`}
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-slate-400 text-xs whitespace-nowrap">{item.size} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 py-8 border-t border-slate-700/50 text-center text-sm text-slate-400">
          <p>Last build: {new Date(BUILD_DATA.timestamp).toLocaleString('id-ID')}</p>
          <p className="mt-2">Next optimization: Remove unused dependencies, aggressive code splitting</p>
        </div>
      </div>
    </div>
  );
}