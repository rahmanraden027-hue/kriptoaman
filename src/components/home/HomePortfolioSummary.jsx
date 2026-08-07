import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { COIN_META } from './coinMeta';
import { Eye, EyeOff, TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';

const DONUT_COLORS = ['#2ecc71', '#10b981', '#34d399', '#6ee7b7'];

export default function HomePortfolioSummary({ user, prices, idrRate }) {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    base44.entities.UserBalance.filter({ userEmail: user.email })
      .then(setBalances)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.email]);

  const holdings = balances
    .map(b => {
      const meta = COIN_META[b.coin] || {};
      const price = prices[b.coin]?.price || 0;
      const value = (b.amount || 0) * price;
      const chg = prices[b.coin]?.change24h || 0;
      return { coin: b.coin, amount: b.amount || 0, price, value, chg, color: meta.color || '#2ecc71' };
    })
    .filter(h => h.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = holdings.reduce((s, h) => s + h.value, 0);
  const changeUSD = holdings.reduce((s, h) => s + h.value * (h.chg / 100), 0);
  const changePct = total > 0 ? (changeUSD / total) * 100 : 0;
  const isUp = changeUSD >= 0;

  const fmtUSD = (v) => hidden ? '••••••' : `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const fmtIDR = (v) => hidden ? '••••••' : `Rp ${(v * (idrRate || 0)).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

  // donut segments
  const segs = holdings.slice(0, 4);
  let acc = 0;
  const stops = [];
  segs.forEach((h, i) => {
    const pct = total ? (h.value / total) * 100 : 0;
    stops.push(`${DONUT_COLORS[i]} ${acc}% ${acc + pct}%`);
    acc += pct;
  });
  if (acc < 100 && total > 0) stops.push(`#1f2a25 ${acc}% 100%`);
  const donutBg = total > 0 ? `conic-gradient(${stops.join(',')})` : 'conic-gradient(#1f2a25 0% 100%)';

  return (
    <div className="ka-surface ka-emerald-glow p-5 ka-fade-up">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="ka-muted text-[11px] font-semibold uppercase tracking-wider">Total Saldo Portfolio</p>
            <button onClick={() => setHidden(h => !h)} className="text-ka-muted hover:text-white transition tap-reset" aria-label="Toggle visibility">
              {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {loading ? (
            <div className="h-9 w-40 ka-shimmer rounded-lg mt-2" />
          ) : (
            <h2 className="text-3xl font-extrabold ka-num mt-1 tracking-tight">{fmtUSD(total)}</h2>
          )}
          <p className="ka-muted text-[11px] mt-0.5 ka-num">{fmtIDR(total)}</p>
        </div>

        {/* Donut */}
        <div className="relative w-20 h-20 shrink-0">
          <div className="w-20 h-20 rounded-full" style={{ background: donutBg }} />
          <div className="absolute inset-[14px] rounded-full bg-[#0b1410] flex items-center justify-center">
            <Wallet className="w-5 h-5 text-ka-emerald" />
          </div>
        </div>
      </div>

      {/* 24h change */}
      {!loading && total > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isUp ? 'bg-ka-emerald/15 text-ka-emerald' : 'bg-[#e74c3c]/15 text-[#e74c3c]'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{changePct.toFixed(2)}%
          </span>
          <span className={`text-[11px] font-semibold ka-num ${isUp ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
            {isUp ? '+' : '-'}${Math.abs(changeUSD).toLocaleString('en-US', { maximumFractionDigits: 2 })} <span className="ka-muted font-normal">24 jam</span>
          </span>
        </div>
      )}

      {/* Allocation legend */}
      {!loading && holdings.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {segs.map((h, i) => (
            <div key={h.coin} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i] }} />
              <span className="text-[11px] font-semibold text-white">{h.coin}</span>
              <span className="text-[11px] ka-muted ka-num">{total ? ((h.value / total) * 100).toFixed(0) : 0}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && holdings.length === 0 && (
        <Link to={createPageUrl('Wallet')}
          className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-ka-emerald/15 border border-ka-emerald/30 text-ka-emerald text-xs font-bold hover:bg-ka-emerald/20 transition ka-surface-hover">
          <Plus className="w-4 h-4" /> Deposit untuk memulai
        </Link>
      )}
    </div>
  );
}