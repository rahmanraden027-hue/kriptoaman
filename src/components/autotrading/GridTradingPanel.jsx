import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Grid3X3, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GridBotCard from './GridBotCard';
import GridBotSetupForm from './GridBotSetupForm';

export default function GridTradingPanel() {
  const [showForm, setShowForm] = useState(false);

  const { data: bots = [], isLoading, refetch } = useQuery({
    queryKey: ['gridBots'],
    queryFn: () => base44.entities.GridTradingBot.list('-created_date'),
  });

  const activeBots = bots.filter(b => b.isActive).length;
  const totalProfit = bots.reduce((sum, b) => sum + (b.stats?.totalProfit || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <Grid3X3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Grid Trading Bot</h2>
            <p className="text-slate-400 text-xs">Beli rendah, jual tinggi otomatis via CEX</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-sm">
          <Plus className="w-4 h-4" /> Buat Bot
        </Button>
      </div>

      {/* Summary */}
      {bots.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 text-center">
            <p className="text-slate-400 text-[10px] font-semibold">TOTAL BOT</p>
            <p className="text-white font-bold text-xl mt-0.5">{bots.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 text-center">
            <p className="text-slate-400 text-[10px] font-semibold">BERJALAN</p>
            <p className="text-emerald-400 font-bold text-xl mt-0.5">{activeBots}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 text-center">
            <p className="text-slate-400 text-[10px] font-semibold">TOTAL PROFIT</p>
            <p className={`font-bold text-xl mt-0.5 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-blue-300 text-xs">
          <strong>Grid Trading</strong> menempatkan order beli & jual di berbagai level harga secara otomatis. 
          Bot akan membeli saat harga turun dan menjual saat naik, menghasilkan profit dari volatilitas pasar.
        </p>
      </div>

      {/* Bot List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-40 bg-slate-700/30 rounded-2xl animate-pulse" />)}
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 border border-slate-700/20 rounded-2xl">
          <Grid3X3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">Belum ada Grid Bot</p>
          <p className="text-slate-600 text-sm mt-1">Buat bot pertama Anda dan mulai trading otomatis</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="w-4 h-4" /> Buat Grid Bot
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map(bot => (
            <GridBotCard key={bot.id} bot={bot} onUpdate={refetch} onDelete={refetch} />
          ))}
        </div>
      )}

      {showForm && <GridBotSetupForm onCreated={() => { refetch(); setShowForm(false); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}