import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';

export default function AdvancedBacktestingOptions({ onOptionsChange }) {
  const [slippage, setSlippage] = useState('0.1');
  const [commission, setCommission] = useState('0.05');
  const [walkForwardEnabled, setWalkForwardEnabled] = useState(false);
  const [walkForwardPeriod, setWalkForwardPeriod] = useState('7');
  const [monteCarloEnabled, setMonteCarloEnabled] = useState(false);
  const [monteCarloSimulations, setMonteCarloSimulations] = useState('1000');
  const [marketRegime, setMarketRegime] = useState('mixed');
  const [expandedSection, setExpandedSection] = useState(null);

  const handleOptionsUpdate = () => {
    onOptionsChange({
      slippage: parseFloat(slippage),
      commission: parseFloat(commission),
      walkForward: {
        enabled: walkForwardEnabled,
        periodDays: parseInt(walkForwardPeriod)
      },
      monteCarlo: {
        enabled: monteCarloEnabled,
        simulations: parseInt(monteCarloSimulations)
      },
      marketRegime
    });
  };

  React.useEffect(() => {
    handleOptionsUpdate();
  }, [slippage, commission, walkForwardEnabled, walkForwardPeriod, monteCarloEnabled, monteCarloSimulations, marketRegime]);

  const ExpandableSection = ({ title, icon, children, id }) => (
    <div className="border border-slate-700/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/60 transition"
      >
        <span className="text-sm font-semibold text-slate-300">{icon} {title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${expandedSection === id ? 'rotate-180' : ''}`}
        />
      </button>
      {expandedSection === id && (
        <div className="p-4 bg-slate-800/30 border-t border-slate-700/40 space-y-4">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Transaction Costs */}
      <ExpandableSection
        id="costs"
        title="Transaction Costs"
        icon="💰"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-2">Slippage (%)</label>
            <Input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.1"
              className="bg-slate-900/60 border-slate-700 text-white text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Expected price slippage per trade</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-2">Commission (%)</label>
            <Input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.05"
              className="bg-slate-900/60 border-slate-700 text-white text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Exchange trading fee per trade</p>
          </div>
        </div>
      </ExpandableSection>

      {/* Walk-Forward Optimization */}
      <ExpandableSection
        id="walkforward"
        title="Walk-Forward Optimization"
        icon="🔄"
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={walkForwardEnabled}
              onChange={(e) => setWalkForwardEnabled(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 cursor-pointer"
            />
            <span className="text-sm text-slate-300">Enable Walk-Forward Analysis</span>
          </label>
          
          {walkForwardEnabled && (
            <div>
              <label className="text-xs text-slate-400 block mb-2">Optimization Window (Days)</label>
              <Input
                type="number"
                value={walkForwardPeriod}
                onChange={(e) => setWalkForwardPeriod(e.target.value)}
                min="5"
                step="1"
                className="bg-slate-900/60 border-slate-700 text-white text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                Divides backtesting into rolling windows to optimize parameters and test on out-of-sample data
              </p>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Monte Carlo Simulation */}
      <ExpandableSection
        id="montecarlo"
        title="Monte Carlo Risk Analysis"
        icon="🎲"
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={monteCarloEnabled}
              onChange={(e) => setMonteCarloEnabled(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 cursor-pointer"
            />
            <span className="text-sm text-slate-300">Enable Monte Carlo Simulation</span>
          </label>
          
          {monteCarloEnabled && (
            <div>
              <label className="text-xs text-slate-400 block mb-2">Number of Simulations</label>
              <Input
                type="number"
                value={monteCarloSimulations}
                onChange={(e) => setMonteCarloSimulations(e.target.value)}
                min="100"
                step="100"
                max="10000"
                className="bg-slate-900/60 border-slate-700 text-white text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                Runs multiple path simulations with randomized trade sequences to assess robustness
              </p>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Market Regime */}
      <ExpandableSection
        id="regime"
        title="Market Regime Analysis"
        icon="📊"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Test strategy across different market conditions:</p>
          <div className="space-y-2">
            {[
              { value: 'bullish', label: '📈 Bullish Market (Trending Up)', desc: 'Strong uptrend conditions' },
              { value: 'bearish', label: '📉 Bearish Market (Trending Down)', desc: 'Strong downtrend conditions' },
              { value: 'sideways', label: '↔️ Sideways Market (Range-Bound)', desc: 'Low volatility consolidation' },
              { value: 'volatile', label: '⚡ Highly Volatile (Whipsaw)', desc: 'High volatility with reversals' },
              { value: 'mixed', label: '🔄 Mixed Conditions (Default)', desc: 'Varied market environments' }
            ].map(regime => (
              <label key={regime.value} className="flex items-start gap-3 p-2 rounded hover:bg-slate-900/40 cursor-pointer">
                <input
                  type="radio"
                  name="marketRegime"
                  value={regime.value}
                  checked={marketRegime === regime.value}
                  onChange={(e) => setMarketRegime(e.target.value)}
                  className="w-4 h-4 mt-0.5 bg-slate-700 border-slate-600 cursor-pointer"
                />
                <div>
                  <p className="text-sm text-slate-300">{regime.label}</p>
                  <p className="text-xs text-slate-500">{regime.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </ExpandableSection>

      {/* Summary */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          💡 <span className="font-semibold">Advanced Features:</span> These options help validate strategy robustness across different conditions and account for real-world trading costs.
        </p>
      </div>
    </div>
  );
}