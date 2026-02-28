import React, { useState } from 'react';
import { Lock, Copy, Eye, EyeOff, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function IntegrationsSection({ user }) {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: 'Binance API',
      type: 'binance',
      key: 'binance_key_xxxx',
      secret: 'binance_secret_xxxx',
      status: 'active',
      createdAt: '2026-02-15'
    },
    {
      id: 2,
      name: 'Twelve Data API',
      type: 'twelvedata',
      key: 'twelvedata_key_xxxx',
      secret: null,
      status: 'active',
      createdAt: '2026-02-20'
    }
  ]);

  const [showSecret, setShowSecret] = useState({});
  const [newKey, setNewKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  const integrationTypes = [
    { id: 'binance', name: 'Binance', icon: '📊' },
    { id: 'coinbase', name: 'Coinbase', icon: '💰' },
    { id: 'twelvedata', name: 'Twelve Data', icon: '📈' },
    { id: 'kraken', name: 'Kraken', icon: '🐙' }
  ];

  return (
    <>
      {/* Connected Services */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Connected Services</h3>

        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Lock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No API keys connected yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map(apiKey => (
              <div
                key={apiKey.id}
                className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{apiKey.name}</h4>
                      <p className="text-xs text-slate-500">Created on {apiKey.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {apiKey.status}
                    </span>
                    <Button
                      onClick={() => handleDelete(apiKey.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* API Key Display */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-800/60 rounded p-3">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">API Key</p>
                      <code className="text-sm font-mono text-slate-300">
                        {showSecret[`key-${apiKey.id}`] ? apiKey.key : '••••••••••••••••'}
                      </code>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button
                        onClick={() => setShowSecret(prev => ({ ...prev, [`key-${apiKey.id}`]: !prev[`key-${apiKey.id}`] }))}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {showSecret[`key-${apiKey.id}`] ? (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleCopy(apiKey.key, `key-${apiKey.id}`)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {copiedId === `key-${apiKey.id}` ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {apiKey.secret && (
                    <div className="flex items-center justify-between bg-slate-800/60 rounded p-3">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">API Secret</p>
                        <code className="text-sm font-mono text-slate-300">
                          {showSecret[`secret-${apiKey.id}`] ? apiKey.secret : '••••••••••••••••'}
                        </code>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Button
                          onClick={() => setShowSecret(prev => ({ ...prev, [`secret-${apiKey.id}`]: !prev[`secret-${apiKey.id}`] }))}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {showSecret[`secret-${apiKey.id}`] ? (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleCopy(apiKey.secret, `secret-${apiKey.id}`)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {copiedId === `secret-${apiKey.id}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add New Integration */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Integration</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {integrationTypes.map(type => {
            const exists = apiKeys.some(k => k.type === type.id);
            return (
              <button
                key={type.id}
                disabled={exists}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  exists
                    ? 'border-slate-700/40 bg-slate-900/40 opacity-50 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-900/40 hover:border-blue-500 hover:bg-blue-500/10'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-sm font-medium text-slate-300">{type.name}</span>
                {exists && <Check className="w-4 h-4 text-green-400 mt-1" />}
              </button>
            );
          })}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-300 mb-1">Security Note</p>
            <p className="text-blue-300/80 text-xs">
              API keys are encrypted and stored securely. Never share your API keys with anyone.
            </p>
          </div>
        </div>
      </Card>

      {/* Connected Exchanges */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Exchange Connections</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-slate-700/40">
            <div>
              <p className="font-medium text-white">Binance Spot Trading</p>
              <p className="text-xs text-slate-500 mt-1">Read/Write permissions for trading</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                ✓ Connected
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-slate-700/40">
            <div>
              <p className="font-medium text-white">Twelve Data Markets</p>
              <p className="text-xs text-slate-500 mt-1">Real-time market data streaming</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                ✓ Connected
              </span>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}