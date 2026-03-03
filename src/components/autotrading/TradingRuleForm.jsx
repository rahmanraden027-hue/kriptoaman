import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, X, AlertTriangle } from 'lucide-react';
import RuleBuilder from './RuleBuilder';

const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT'];

export default function TradingRuleForm({ onSaved, onCancel, existingRule = null }) {
  const [form, setForm] = useState({
    name: existingRule?.name || '',
    pair: existingRule?.pair || 'BTCUSDT',
    mode: existingRule?.mode || 'paper',
    tradeAmount: existingRule?.tradeAmount || 100,
    stopLossPercent: existingRule?.stopLossPercent || 5,
    takeProfitPercent: existingRule?.takeProfitPercent || 10,
    entryRules: existingRule?.entryRules || [],
    exitRules: existingRule?.exitRules || [],
    isActive: existingRule?.isActive || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || form.entryRules.length === 0) return;
    setSaving(true);
    const user = await base44.auth.me();
    const payload = { ...form, userEmail: user.email };
    if (existingRule) {
      await base44.entities.TradingRule.update(existingRule.id, payload);
    } else {
      await base44.entities.TradingRule.create(payload);
    }
    setSaving(false);
    onSaved?.();
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">{existingRule ? 'Edit' : 'Buat'} Strategi Trading</h3>
        {onCancel && (
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-slate-400 text-xs font-semibold">NAMA STRATEGI</label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: RSI Scalper BTC" className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-400 text-xs font-semibold">TRADING PAIR</label>
          <Select value={form.pair} onValueChange={v => setForm({ ...form, pair: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-slate-400 text-xs font-semibold">MODE</label>
          <Select value={form.mode} onValueChange={v => setForm({ ...form, mode: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paper">📄 Paper Trading (Simulasi)</SelectItem>
              <SelectItem value="live">💰 Live (Saldo Internal)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-400 text-xs font-semibold">JUMLAH PER TRADE (USDT)</label>
          <Input type="number" value={form.tradeAmount} onChange={e => setForm({ ...form, tradeAmount: parseFloat(e.target.value) })}
            className="bg-slate-800 border-slate-700 text-white" min={10} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">STOP LOSS %</label>
            <Input type="number" value={form.stopLossPercent} onChange={e => setForm({ ...form, stopLossPercent: parseFloat(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white" min={0.1} max={50} />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">TAKE PROFIT %</label>
            <Input type="number" value={form.takeProfitPercent} onChange={e => setForm({ ...form, takeProfitPercent: parseFloat(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white" min={0.1} max={200} />
          </div>
        </div>
      </div>

      {form.mode === 'live' && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300 text-xs">
            Mode <strong>Live</strong> akan menggunakan saldo USDT internal akun Anda untuk eksekusi trading nyata. Pastikan Anda memiliki cukup saldo.
          </p>
        </div>
      )}

      {/* Entry Rules */}
      <div className="space-y-2">
        <RuleBuilder
          label="🟢 ATURAN ENTRY (BELI)"
          color="green"
          rules={form.entryRules}
          onChange={rules => setForm({ ...form, entryRules: rules })}
          presetType="entry"
        />
      </div>

      {/* Exit Rules */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Exit rules bersifat opsional — Stop Loss & Take Profit tetap aktif sebagai fallback.</p>
        <RuleBuilder
          label="🔴 ATURAN EXIT (JUAL)"
          color="red"
          rules={form.exitRules}
          onChange={rules => setForm({ ...form, exitRules: rules })}
          presetType="exit"
        />
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-3 py-2 border-t border-slate-700/50">
        <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
        <div>
          <p className="text-white text-sm font-medium">Aktifkan Strategi</p>
          <p className="text-slate-500 text-xs">Bot akan memeriksa kondisi setiap 15 menit jika diaktifkan</p>
        </div>
      </div>

      <Button onClick={handleSave}
        disabled={!form.name.trim() || form.entryRules.length === 0 || saving}
        className="w-full h-11 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-40">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Simpan Strategi</>}
      </Button>
    </div>
  );
}