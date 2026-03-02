import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Grid3X3, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const POPULAR_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];

export default function GridBotSetupForm({ onCreated, onClose }) {
  const [name, setName] = useState('Grid Bot 1');
  const [cexConnections, setCexConnections] = useState([]);
  const [selectedConn, setSelectedConn] = useState('');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [upperPrice, setUpperPrice] = useState('');
  const [lowerPrice, setLowerPrice] = useState('');
  const [gridCount, setGridCount] = useState(10);
  const [totalInvestment, setTotalInvestment] = useState('');
  const [mode, setMode] = useState('neutral');
  const [saving, setSaving] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    base44.entities.CexConnection.filter({ status: 'active' }).then(data => {
      setCexConnections(data);
      if (data.length > 0) setSelectedConn(data[0].id);
    });
  }, []);

  const fetchPrice = async () => {
    if (!symbol) return;
    setLoadingPrice(true);
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`);
      const data = await res.json();
      const price = parseFloat(data.price);
      setCurrentPrice(price);
      // Auto-set bounds ±10%
      if (!upperPrice) setUpperPrice((price * 1.1).toFixed(2));
      if (!lowerPrice) setLowerPrice((price * 0.9).toFixed(2));
    } catch (_) {}
    setLoadingPrice(false);
  };

  useEffect(() => { fetchPrice(); }, [symbol]);

  const perGridAmount = totalInvestment && gridCount
    ? (parseFloat(totalInvestment) / parseInt(gridCount)).toFixed(2)
    : '0';

  const gridStep = upperPrice && lowerPrice && gridCount
    ? ((parseFloat(upperPrice) - parseFloat(lowerPrice)) / parseInt(gridCount)).toFixed(4)
    : '0';

  const conn = cexConnections.find(c => c.id === selectedConn);

  const handleCreate = async () => {
    if (!selectedConn || !symbol || !upperPrice || !lowerPrice || !totalInvestment) return;
    setSaving(true);
    const newBot = await base44.entities.GridTradingBot.create({
      name,
      exchange: conn?.exchange || 'binance',
      cexConnectionId: selectedConn,
      symbol: symbol.toUpperCase(),
      upperPrice: parseFloat(upperPrice),
      lowerPrice: parseFloat(lowerPrice),
      gridCount: parseInt(gridCount),
      totalInvestment: parseFloat(totalInvestment),
      perGridAmount: parseFloat(perGridAmount),
      mode,
      isActive: false,
      stats: { totalProfit: 0, totalTrades: 0, profitPercent: 0, runningHours: 0 },
    });
    setSaving(false);
    onCreated(newBot);
  };

  const isValid = selectedConn && symbol && upperPrice && lowerPrice &&
    parseFloat(upperPrice) > parseFloat(lowerPrice) && totalInvestment && gridCount >= 2;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-white font-bold">Buat Grid Trading Bot</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">NAMA BOT</label>
            <Input value={name} onChange={e => setName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white" />
          </div>

          {/* CEX Connection */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">KONEKSI CEX</label>
            {cexConnections.length === 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-300 text-xs">Belum ada koneksi CEX aktif. Tambahkan koneksi di halaman Wallet terlebih dahulu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {cexConnections.map(c => (
                  <button key={c.id} onClick={() => setSelectedConn(c.id)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${
                      selectedConn === c.id
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400'
                    }`}>
                    <span className="block font-semibold text-sm">{c.label || c.exchange}</span>
                    <span className="text-slate-500 capitalize">{c.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Symbol */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">PAIR TRADING</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {POPULAR_PAIRS.map(p => (
                <button key={p} onClick={() => setSymbol(p)}
                  className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                    symbol === p ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}>{p}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder="Contoh: BTCUSDT" className="bg-slate-800 border-slate-700 text-white" />
              {currentPrice && (
                <div className="flex items-center px-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono whitespace-nowrap">
                  {loadingPrice ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : `$${currentPrice?.toLocaleString()}`}
                </div>
              )}
            </div>
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">MODE</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'neutral', label: '⚖️ Neutral', desc: 'Buy & Sell' },
                { id: 'long', label: '📈 Long', desc: 'Fokus beli' },
                { id: 'short', label: '📉 Short', desc: 'Fokus jual' },
              ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`p-2 rounded-xl border text-center text-xs transition-all ${
                    mode === m.id ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-700 bg-slate-800/60 text-slate-400'
                  }`}>
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-slate-500 text-[10px]">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">HARGA ATAS (USDT)</label>
              <Input type="number" value={upperPrice} onChange={e => setUpperPrice(e.target.value)}
                placeholder="0.00" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">HARGA BAWAH (USDT)</label>
              <Input type="number" value={lowerPrice} onChange={e => setLowerPrice(e.target.value)}
                placeholder="0.00" className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>

          {/* Grid count & investment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">JUMLAH GRID</label>
              <Input type="number" value={gridCount} onChange={e => setGridCount(e.target.value)}
                min={2} max={200} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">TOTAL MODAL (USDT)</label>
              <Input type="number" value={totalInvestment} onChange={e => setTotalInvestment(e.target.value)}
                placeholder="100" className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>

          {/* Summary */}
          {isValid && (
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-slate-500 text-[10px] font-semibold">PER GRID</p>
                <p className="text-white text-sm font-bold">${perGridAmount}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-semibold">JARAK GRID</p>
                <p className="text-white text-sm font-bold">{gridStep} USDT</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-semibold">GRID LEVELS</p>
                <p className="text-white text-sm font-bold">{gridCount}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">
              Bot akan menempatkan order limit di exchange Anda. API Key harus memiliki izin <strong>Trading</strong>. Trading kripto mengandung risiko.
            </p>
          </div>

          <Button onClick={handleCreate} disabled={!isValid || saving || cexConnections.length === 0}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-40">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Grid3X3 className="w-4 h-4 mr-2" /> Buat Grid Bot</>}
          </Button>
        </div>
      </div>
    </div>
  );
}