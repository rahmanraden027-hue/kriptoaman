import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';

export default function AdvancedBacktestingOptions({ onOptionsChange }) {
  const [slippage, setSlippage] = useState('0.1');
  const [commission, setCommission] = useState('0.05');
  const [fixedCommission, setFixedCommission] = useState('0');
  const [spread, setSpread] = useState('0.02');
  const [fillRate, setFillRate] = useState('100');
  const [walkForwardEnabled, setWalkForwardEnabled] = useState(false);
  const [walkForwardPeriod, setWalkForwardPeriod] = useState('7');
  const [inSampleRatio, setInSampleRatio] = useState('70');
  const [monteCarloEnabled, setMonteCarloEnabled] = useState(false);
  const [monteCarloSimulations, setMonteCarloSimulations] = useState('500');
  const [marketRegime, setMarketRegime] = useState('mixed');
  const [economicCondition, setEconomicCondition] = useState('normal');
  const [expandedSection, setExpandedSection] = useState(null);

  const notify = (updates) => {
    const merged = {
      slippage: parseFloat(slippage), commission: parseFloat(commission),
      fixedCommission: parseFloat(fixedCommission), spread: parseFloat(spread),
      fillRate: parseFloat(fillRate),
      walkForward: { enabled: walkForwardEnabled, periodDays: parseInt(walkForwardPeriod), inSampleRatio: parseInt(inSampleRatio) / 100 },
      monteCarlo: { enabled: monteCarloEnabled, simulations: parseInt(monteCarloSimulations) },
      marketRegime, economicCondition,
      ...updates,
    };
    onOptionsChange(merged);
  };

  React.useEffect(() => { notify({}); }, [
    slippage, commission, fixedCommission, spread, fillRate,
    walkForwardEnabled, walkForwardPeriod, inSampleRatio,
    monteCarloEnabled, monteCarloSimulations, marketRegime, economicCondition
  ]);

  const ExpandableSection = ({ title, icon, children, id, badge }) => (
    <div className="border border-slate-700/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/60 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-300">{icon} {title}</span>
          {badge && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 ${expandedSection === id ? 'rotate-180' : ''}`} />
      </button>
      {expandedSection === id && (
        <div className="p-4 bg-slate-800/30 border-t border-slate-700/40 space-y-4">
          {children}
        </div>
      )}
    </div>
  );

  const FieldRow = ({ label, hint, children }) => (
    <div>
      <label className="text-xs text-slate-400 block mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-3">

      {/* Transaction Costs */}
      <ExpandableSection id="costs" title="Transaction Costs" icon="💰">
        <div className="grid grid-cols-2 gap-4">
          <FieldRow label="Slippage (%)" hint="Price impact on entry/exit">
            <Input type="number" value={slippage} onChange={e => setSlippage(e.target.value)} min="0" step="0.01" className="bg-slate-900/60 border-slate-700 text-white text-sm" />
          </FieldRow>
          <FieldRow label="Variable Commission (%)" hint="% of trade value">
            <Input type="number" value={commission} onChange={e => setCommission(e.target.value)} min="0" step="0.01" className="bg-slate-900/60 border-slate-700 text-white text-sm" />
          </FieldRow>
          <FieldRow label="Fixed Commission ($)" hint="Per-trade fixed fee">
            <Input type="number" value={fixedCommission} onChange={e => setFixedCommission(e.target.value)} min="0" step="0.01" className="bg-slate-900/60 border-slate-700 text-white text-sm" />
          </FieldRow>
          <FieldRow label="Bid-Ask Spread (%)" hint="Market spread cost">
            <Input type="number" value={spread} onChange={e => setSpread(e.target.value)} min="0" step="0.005" className="bg-slate-900/60 border-slate-700 text-white text-sm" />
          </FieldRow>
          <FieldRow label="Limit Fill Rate (%)" hint="% of limit orders that fill (100 = market orders)">
            <Input type="number" value={fillRate} onChange={e => setFillRate(e.target.value)} min="10" max="100" step="5" className="bg-slate-900/60 border-slate-700 text-white text-sm" />
          </FieldRow>
        </div>

        <div className="bg-slate-900/40 rounded-lg p-3 text-xs text-slate-400">
          <p>💡 Total cost per trade ≈ <span className="text-white font-mono">{(parseFloat(slippage||0) + parseFloat(commission||0) + parseFloat(spread||0)).toFixed(3)}%</span> variable + <span className="text-white font-mono">${parseFloat(fixedCommission||0).toFixed(2)}</span> fixed</p>
        </div>
      </ExpandableSection>

      {/* Walk-Forward Optimization */}
      <ExpandableSection id="walkforward" title="Walk-Forward Optimization" icon="🔄" badge={walkForwardEnabled ? 'ON' : ''}>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={walkForwardEnabled} onChange={e => setWalkForwardEnabled(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-slate-300">Enable Walk-Forward Analysis</span>
          </label>

          {walkForwardEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Window Size (Days)" hint="Size of each rolling window">
                <Input type="number" value={walkForwardPeriod} onChange={e => setWalkForwardPeriod(e.target.value)} min="5" step="1" className="bg-slate-900/60 border-slate-700 text-white text-sm" />
              </FieldRow>
              <FieldRow label="In-Sample Ratio (%)" hint="% of window used for optimization">
                <Input type="number" value={inSampleRatio} onChange={e => setInSampleRatio(e.target.value)} min="50" max="90" step="5" className="bg-slate-900/60 border-slate-700 text-white text-sm" />
              </FieldRow>
            </div>
          )}

          {walkForwardEnabled && (
            <p className="text-xs text-slate-400 bg-slate-900/40 rounded p-2">
              📊 {inSampleRatio}% in-sample training + {100 - parseInt(inSampleRatio)}% out-of-sample validation per {walkForwardPeriod}-day window
            </p>
          )}
        </div>
      </ExpandableSection>

      {/* Monte Carlo */}
      <ExpandableSection id="montecarlo" title="Monte Carlo Risk Analysis" icon="🎲" badge={monteCarloEnabled ? 'ON' : ''}>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={monteCarloEnabled} onChange={e => setMonteCarloEnabled(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-slate-300">Enable Monte Carlo Simulation</span>
          </label>

          {monteCarloEnabled && (
            <FieldRow label="Number of Simulations" hint="More = accurate, but slower (max 2000)">
              <Input type="number" value={monteCarloSimulations} onChange={e => setMonteCarloSimulations(e.target.value)} min="100" step="100" max="2000" className="bg-slate-900/60 border-slate-700 text-white text-sm" />
            </FieldRow>
          )}

          {monteCarloEnabled && (
            <p className="text-xs text-slate-400 bg-slate-900/40 rounded p-2">
              🎲 Runs {monteCarloSimulations} bootstrap resamplings of trade returns to compute probability of ruin, confidence intervals and return distribution.
            </p>
          )}
        </div>
      </ExpandableSection>

      {/* Market Regime */}
      <ExpandableSection id="regime" title="Market Regime" icon="📊">
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Simulate strategy in different market environments:</p>
          {[
            { value: 'mixed', label: '🔄 Mixed Conditions', desc: 'Varied market environments (default)' },
            { value: 'bullish', label: '📈 Bullish Market', desc: 'Strong uptrend — favours longs' },
            { value: 'bearish', label: '📉 Bearish Market', desc: 'Strong downtrend — challenges longs' },
            { value: 'sideways', label: '↔️ Range-Bound', desc: 'Low volatility consolidation' },
            { value: 'volatile', label: '⚡ High Volatility', desc: 'Whipsaw / fast reversals' },
          ].map(r => (
            <label key={r.value} className="flex items-start gap-3 p-2 rounded hover:bg-slate-900/40 cursor-pointer">
              <input type="radio" name="marketRegime" value={r.value} checked={marketRegime === r.value} onChange={e => setMarketRegime(e.target.value)} className="w-4 h-4 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300">{r.label}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </ExpandableSection>

      {/* Economic Conditions */}
      <ExpandableSection id="economic" title="Economic Condition" icon="🌍">
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Layer macro economic conditions on top of market regime:</p>
          {[
            { value: 'normal', label: '🟢 Normal', desc: 'Stable macro environment' },
            { value: 'expansion', label: '🚀 Expansion', desc: 'GDP growth, high liquidity' },
            { value: 'recession', label: '🔴 Recession', desc: 'Economic contraction, low volume' },
            { value: 'crisis', label: '💥 Crisis / Black Swan', desc: 'Flash crash, extreme drawdown events' },
            { value: 'recovery', label: '🌱 Recovery', desc: 'Post-crisis rebound, increasing volume' },
          ].map(c => (
            <label key={c.value} className="flex items-start gap-3 p-2 rounded hover:bg-slate-900/40 cursor-pointer">
              <input type="radio" name="economicCondition" value={c.value} checked={economicCondition === c.value} onChange={e => setEconomicCondition(e.target.value)} className="w-4 h-4 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300">{c.label}</p>
                <p className="text-xs text-slate-500">{c.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </ExpandableSection>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
        💡 <span className="font-semibold">Tip:</span> Enable Walk-Forward + Monte Carlo together for the most statistically robust strategy validation.
      </div>
    </div>
  );
}