import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import StrategyTemplates from './StrategyTemplates';
import RiskManagementPanel from './RiskManagementPanel';

const ASSET_CLASSES = [
  { value: 'crypto', label: 'Cryptocurrency', pairs: ['ETH/USDT', 'BTC/USDT', 'SOL/USDT', 'MATIC/USDT'] },
  { value: 'forex', label: 'Forex', pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'] },
  { value: 'indices', label: 'Indices', pairs: ['SPX500', 'DAX', 'FTSE', 'NIKKEI'] },
  { value: 'commodities', label: 'Commodities', pairs: ['GOLD', 'OIL', 'SILVER', 'COPPER'] }
];

const CHAINS = ['Ethereum', 'BNB Chain', 'Polygon', 'Solana'];
const INTERVALS = [
  { value: 5, label: '5 menit' },
  { value: 15, label: '15 menit' },
  { value: 30, label: '30 menit' },
  { value: 60, label: '1 jam' }
];

export default function StrategySetupForm({ onStrategyCreated, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [assetClass, setAssetClass] = useState('crypto');
  const [pair, setPair] = useState('ETH/USDT');
  const [chain, setChain] = useState('Ethereum');
  const [selectedTemplate, setSelectedTemplate] = useState('rsi');
  const [interval, setInterval] = useState('15');
  const [riskManagement, setRiskManagement] = useState({
    useATR: true,
    atrMultiplier: 2,
    tpMultiplier: 3,
    maxRiskPercent: 2,
    tradeSize: 100
  });

  const currentAssetClass = ASSET_CLASSES.find(ac => ac.value === assetClass);
  const availablePairs = currentAssetClass?.pairs || [];

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Nama strategi tidak boleh kosong');
      return;
    }

    setLoading(true);

    const strategyData = {
      name,
      assetClass,
      pair,
      chain: assetClass === 'crypto' ? chain : undefined,
      strategyType: selectedTemplate === 'custom' ? 'custom' : 'template',
      templateName: selectedTemplate,
      analysisInterval: parseInt(interval),
      isActive: false,
      entryCondition: JSON.stringify({
        template: selectedTemplate,
        description: 'Entry condition based on selected template'
      }),
      riskManagement: riskManagement,
      stats: {
        totalTrades: 0,
        winningTrades: 0,
        totalPL: 0,
        winRate: 0
      }
    };

    const createdStrategy = await base44.entities.AutoTradingStrategy.create(strategyData);

    setLoading(false);
    onStrategyCreated(createdStrategy);

    // Reset form
    setName('');
    setAssetClass('crypto');
    setPair('ETH/USDT');
    setChain('Ethereum');
    setSelectedTemplate('rsi');
    setInterval('15');
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 space-y-6">
      <h2 className="text-lg font-bold text-white">Setup Strategi Auto-Trading</h2>

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-300 block mb-2">Nama Strategi</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: ETH Bullish Strategy"
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-2">Kelas Aset</label>
          <Select value={assetClass} onValueChange={setAssetClass}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CLASSES.map((ac) => (
                <SelectItem key={ac.value} value={ac.value}>
                  {ac.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 block mb-2">Trading Pair</label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePairs.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {assetClass === 'crypto' && (
            <div>
              <label className="text-sm text-slate-300 block mb-2">Blockchain</label>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-2">Interval Analisis</label>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVALS.map((int) => (
                <SelectItem key={int.value} value={int.value.toString()}>
                  {int.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Strategy Template Selection */}
      <StrategyTemplates
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
      />

      {/* Risk Management */}
      <RiskManagementPanel
        riskManagement={riskManagement}
        onRiskChange={setRiskManagement}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-700/40">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Membuat...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Buat Strategi
            </>
          )}
        </Button>
      </div>
    </div>
  );
}