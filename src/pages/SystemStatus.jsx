import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Server } from 'lucide-react';

const SERVICES = [
  { name: 'Binance Live Prices', url: 'https://api.binance.com/api/v3/ping' },
  { name: 'CoinGecko Market Data', url: 'https://api.coingecko.com/api/v3/ping' },
  { name: 'CryptoCompare News', url: 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN' },
  { name: 'Fear & Greed Index', url: 'https://api.alternative.me/fng/?limit=1' },
];

function check(url) {
  return new Promise((resolve) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    fetch(url, { signal: ctrl.signal })
      .then((r) => { clearTimeout(t); resolve(r.ok ? 'ok' : 'error'); })
      .catch(() => { clearTimeout(t); resolve('error'); });
  });
}

export default function SystemStatus() {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);

  const run = async () => {
    setLoading(true);
    const results = await Promise.all(SERVICES.map(async (s) => [s.name, await check(s.url)]));
    setStatuses(Object.fromEntries(results));
    setUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  const allOk = !loading && Object.values(statuses).every((v) => v === 'ok');

  return (
    <div className="ka-bg min-h-screen text-white pb-28">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-ka-emerald" />
            <h1 className="text-xl font-extrabold tracking-tight">Status Sistem</h1>
          </div>
          <button onClick={run}
            className="flex items-center gap-1.5 px-3 py-1.5 ka-chip text-xs font-bold ka-muted hover:text-white transition tap-reset">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {!loading && (
          <div className={`ka-surface p-3 flex items-center gap-2 ${allOk ? 'border-ka-emerald/30' : 'border-[#e74c3c]/30'}`}>
            {allOk
              ? <CheckCircle2 className="w-5 h-5 text-ka-emerald" />
              : <XCircle className="w-5 h-5 text-[#e74c3c]" />}
            <span className={`text-sm font-bold ${allOk ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
              {allOk ? 'Semua sistem operasional' : 'Ada gangguan pada layanan'}
            </span>
          </div>
        )}

        {updated && <p className="ka-muted text-[11px]">Diperbarui: {updated.toLocaleString('id-ID')}</p>}

        <div className="space-y-2">
          {SERVICES.map((s) => {
            const st = statuses[s.name];
            return (
              <div key={s.name} className="ka-surface p-3.5 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">{s.name}</span>
                {st == null ? (
                  <Loader2 className="w-4 h-4 text-ka-muted animate-spin" />
                ) : st === 'ok' ? (
                  <span className="flex items-center gap-1.5 text-ka-emerald text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Operasional
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#e74c3c] text-xs font-bold">
                    <XCircle className="w-4 h-4" /> Gangguan
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="ka-surface p-4 text-center">
          <p className="ka-muted text-[11px] leading-relaxed">
            Status diperiksa langsung dari perangkat Anda. Layanan backend KriptoAman
            (autentikasi, database, dompet) dipantau terpisah oleh tim operasional.
          </p>
        </div>
      </div>
    </div>
  );
}