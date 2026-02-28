import React, { useState } from 'react';
import { AlertCircle, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export default function RiskManagementPanel({ riskManagement, onRiskChange }) {
  const [useATR, setUseATR] = useState(riskManagement?.useATR ?? true);
  const [atrMultiplier, setAtrMultiplier] = useState(riskManagement?.atrMultiplier ?? 2);
  const [tpMultiplier, setTpMultiplier] = useState(riskManagement?.tpMultiplier ?? 3);
  const [maxRiskPercent, setMaxRiskPercent] = useState(riskManagement?.maxRiskPercent ?? 2);
  const [tradeSize, setTradeSize] = useState(riskManagement?.tradeSize ?? 100);

  const handleChange = () => {
    onRiskChange({
      useATR,
      atrMultiplier,
      tpMultiplier,
      maxRiskPercent,
      tradeSize
    });
  };

  React.useEffect(handleChange, [useATR, atrMultiplier, tpMultiplier, maxRiskPercent, tradeSize]);

  return (
    <div className="space-y-4 bg-slate-800/40 rounded-lg p-4 border border-slate-700/40">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-bold text-sm">Manajemen Risiko</h3>
      </div>

      {/* Use ATR Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Stop-Loss & TP Dinamis (ATR)</label>
          <button
            onClick={() => setUseATR(!useATR)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              useATR ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            {useATR ? 'ON' : 'OFF'}
          </button>
        </div>
        <p className="text-xs text-slate-500">Gunakan ATR (volatilitas) untuk SL/TP otomatis</p>
      </div>

      {useATR && (
        <>
          {/* ATR Multiplier for SL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">SL Multiplier (ATR × {atrMultiplier.toFixed(1)})</label>
              <span className="text-xs text-blue-400 font-semibold">{atrMultiplier.toFixed(1)}x</span>
            </div>
            <Slider
              value={[atrMultiplier]}
              onValueChange={(val) => setAtrMultiplier(val[0])}
              min={0.5}
              max={5}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-slate-500">Semakin tinggi = Stop-loss lebih jauh</p>
          </div>

          {/* TP Multiplier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">TP Multiplier (ATR × {tpMultiplier.toFixed(1)})</label>
              <span className="text-xs text-green-400 font-semibold">{tpMultiplier.toFixed(1)}x</span>
            </div>
            <Slider
              value={[tpMultiplier]}
              onValueChange={(val) => setTpMultiplier(val[0])}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-slate-500">Semakin tinggi = Target profit lebih jauh</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
            <p className="text-xs text-blue-300">
              Risk/Reward Ratio: 1:{(tpMultiplier / atrMultiplier).toFixed(1)}
            </p>
          </div>
        </>
      )}

      {/* Max Risk Per Trade */}
      <div className="space-y-2 pt-2 border-t border-slate-700/40">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Max Risk Per Trade</label>
          <span className="text-xs text-red-400 font-semibold">{maxRiskPercent.toFixed(1)}%</span>
        </div>
        <Slider
          value={[maxRiskPercent]}
          onValueChange={(val) => setMaxRiskPercent(val[0])}
          min={0.5}
          max={5}
          step={0.5}
          className="w-full"
        />
        <p className="text-xs text-slate-500">Maksimal kerugian per trade dari capital</p>
      </div>

      {/* Trade Size */}
      <div className="space-y-2 pt-2 border-t border-slate-700/40">
        <label className="text-sm text-slate-300">Ukuran Trade (USD)</label>
        <Input
          type="number"
          value={tradeSize}
          onChange={(e) => setTradeSize(parseFloat(e.target.value) || 0)}
          placeholder="Masukkan jumlah USD"
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
          min="10"
          step="10"
        />
        <p className="text-xs text-slate-500">Jumlah modal untuk setiap trade</p>
      </div>

      {/* Risk Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 mt-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            Auto-trading memiliki risiko tinggi. Mulai dengan ukuran trade kecil dan monitor secara berkala.
          </p>
        </div>
      </div>
    </div>
  );
}