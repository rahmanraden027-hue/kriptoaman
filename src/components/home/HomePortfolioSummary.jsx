import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Eye, EyeOff, TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';

const DONUT_COLORS = ['#2ecc71', '#10b981', '#34d399', '#6ee7b7'];

export default function HomePortfolioSummary({ user, prices, idrRate }) {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    base44.entities.UserBalance.filter({ userEmail: user.email })
      .then(setBalances)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.email]);

  const holdings = balances
    .map(b => {
      const price = prices[b.coin]?.price || 0;
      const value = (b.amount || 0) * price;
      const chg = prices[b.coin]?.change24h || 0;
      return { coin: b.coin, amount: b.amount || 0, price, value, chg };
    })
    .filter(h => h.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = holdings.reduce((s, h) => s + h.value, 0);
  const changeUSD = holdings.reduce((s, h) => s + h.value * (h.chg / 100), 0);
  const changePct = total > 0 ? (changeUSD / total) * 100 : 0;
  const isUp = changeUSD >= 0;

  const top = holdings.slice(0, 4);
  const restValue = holdings.slice(4).reduce((s, h) => s + h.value, 0);
  const donutData = [
    ...top.map((h, i) => ({ name: h.coin, value: h.value, color: DONUT_COLORS[i] })),
    ...(restValue > 0 ? [{ name: 'Lain', value: restValue, color: '#1f2a25' }] : []),
  ];

  const fmtUSD = (v) => (hidden ? '••••••' : `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
  const fmtIDR = (v) => (hidden ? '••••••' : `Rp ${(v * (idrRate || 0)).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`);

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

        {/* Interactive donut */}
        <div className="relative w-24 h-24 shrink-0">
          {!loading && holdings.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={30}
                    outerRadius={44}
                    paddingAngle={2}
                    stroke="none"
                    onMouseEnter={(_, i) => setActive(donutData[i])}
                    onMouseLeave={() => setActive(null)}
                  >
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    content={({ payload }) => (payload && payload[0] ? (
                      <div className="rounded-lg bg-[#0a0c0a] border border-ka-card-border px-2 py-1 text-[10px]">
                        <p className="text-white font-bold">{payload[0].name}</p>
                        <p className="text-ka-emerald ka-num">${payload[0].value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                        <p className="ka-muted ka-num">{total ? ((payload[0].value / total) * 100).toFixed(1) : 0}%</p>
                      </div>
                    ) : null)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-white text-[11px] font-bold ka-num leading-none">
                    {active ? `${((active.value / total) * 100).toFixed(0)}%` : `${holdings.length}`}
                  </p>
                  <p className="ka-muted text-[8px] mt-0.5">{active ? active.name : 'aset'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#0b1410]/60 border border-ka-card-border flex items-center justify-center">
              <Wallet className="w-6 h-6 text-ka-emerald" />
            </div>
          )}
        </div>
      </div>

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

      {!loading && holdings.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {top.map((h, i) => (
            <div key={h.coin} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i] }} />
              <span className="text-[11px] font-semibold text-white">{h.coin}</span>
              <span className="text-[11px] ka-muted ka-num">{total ? ((h.value / total) * 100).toFixed(0) : 0}%</span>
            </div>
          ))}
        </div>
      )}

      {!loading && holdings.length === 0 && (
        <Link to={createPageUrl('Wallet')}
          className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-ka-emerald/15 border border-ka-emerald/30 text-ka-emerald text-xs font-bold hover:bg-ka-emerald/20 transition ka-surface-hover">
          <Plus className="w-4 h-4" /> Deposit untuk memulai
        </Link>
      )}
    </div>
  );
}