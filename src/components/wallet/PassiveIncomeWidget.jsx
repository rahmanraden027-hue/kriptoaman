import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, PiggyBank, Lock, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const STAKING_KEY = 'wallet_staking_positions_v2';
const SAVINGS_KEY = 'usdt_savings_positions';

const SAVINGS_PROTOCOLS_APY = {
  aave: 5.82, compound: 4.91, curve: 7.24, yearn: 8.15,
  beefy: 9.38, marinade: 7.92, kamino: 11.4, save: 6.15,
};

function loadStaking() { try { return JSON.parse(localStorage.getItem(STAKING_KEY)) || []; } catch { return []; } }
function loadSavings() { try { return JSON.parse(localStorage.getItem(SAVINGS_KEY)) || []; } catch { return []; } }

function computeStakingReward(pos) {
  const daysActive = Math.max(1, (Date.now() - new Date(pos.stakedAt).getTime()) / 86400000);
  const netApy = pos.apy * (1 - (pos.fee || 0) / 100);
  return pos.amount * netApy / 100 / 365 * daysActive;
}

function computeSavingsReward(pos) {
  const proto = pos.protocol || {};
  const apy = SAVINGS_PROTOCOLS_APY[proto.id] || proto.apy || 0;
  const days = Math.max(1, (Date.now() - new Date(pos.date).getTime()) / 86400000);
  return pos.amount * apy / 100 / 365 * days;
}

export default function PassiveIncomeWidget() {
  const [stakingPos, setStakingPos] = useState([]);
  const [savingsPos, setSavingsPos] = useState([]);

  useEffect(() => {
    setStakingPos(loadStaking());
    setSavingsPos(loadSavings());
  }, []);

  const totalStaked = stakingPos.reduce((s, p) => s + p.amount + (p.restakedRewards || 0), 0);
  const stakingRewards = stakingPos.reduce((s, p) => s + computeStakingReward(p), 0);

  const totalSaved = savingsPos.reduce((s, p) => s + p.amount, 0);
  const savingsRewards = savingsPos.reduce((s, p) => s + computeSavingsReward(p), 0);

  const totalPassiveUSD = savingsRewards; // savings is in USD (USDT)
  const hasActivity = stakingPos.length > 0 || savingsPos.length > 0;

  if (!hasActivity) return null;

  return (
    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-500/20 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <span className="text-white font-semibold text-sm">Pendapatan Pasif</span>
        </div>
        <Link to={createPageUrl('DEXSavings')}
          className="flex items-center gap-1 text-green-400 text-xs hover:text-green-300 transition-colors">
          Kelola <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Total USDT earned */}
      {savingsPos.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-slate-400 text-xs">DeFi Savings (USDT)</p>
              <p className="text-slate-500 text-[10px]">{savingsPos.length} posisi aktif · ${totalSaved.toFixed(0)} disimpan</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-bold">+${savingsRewards.toFixed(4)}</p>
            <p className="text-slate-500 text-[10px]">reward terakrual</p>
          </div>
        </div>
      )}

      {/* Staking rewards per coin */}
      {stakingPos.length > 0 && (
        <div className="space-y-1.5">
          {['ETH', 'SOL', 'BNB'].map(coin => {
            const coinPos = stakingPos.filter(p => p.coin === coin);
            if (coinPos.length === 0) return null;
            const coinReward = coinPos.reduce((s, p) => s + computeStakingReward(p), 0);
            const coinStaked = coinPos.reduce((s, p) => s + p.amount + (p.restakedRewards || 0), 0);
            const COIN_COLORS = { ETH: '#627EEA', SOL: '#9945FF', BNB: '#F0B90B' };
            const COIN_ICONS = { ETH: 'Ξ', SOL: '◎', BNB: 'B' };
            return (
              <div key={coin} className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: COIN_COLORS[coin] + '44', color: COIN_COLORS[coin] }}>
                    {COIN_ICONS[coin]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-300 text-xs font-medium">{coin} Staking</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{coinPos.length} posisi · {coinStaked.toFixed(4)} {coin}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: COIN_COLORS[coin] }}>+{coinReward.toFixed(6)}</p>
                  <p className="text-slate-500 text-[10px]">{coin}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total summary bar */}
      <div className="flex items-center gap-2 pt-1 border-t border-green-500/10">
        <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
        <span className="text-slate-400 text-xs flex-1">
          {stakingPos.length + savingsPos.length} posisi aktif
        </span>
        <span className="text-yellow-400 text-xs font-semibold">
          Total: ${(totalPassiveUSD + stakingRewards * 0).toFixed(4)} USDT earned
        </span>
      </div>
    </div>
  );
}