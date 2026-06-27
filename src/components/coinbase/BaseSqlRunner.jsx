import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, Play, Loader2, Clock, CheckCircle2 } from 'lucide-react';

const PRESETS = [
  {
    label: 'USDC Transfers (Base)',
    sql: `SELECT
  parameters['from'] AS sender,
  parameters['to'] AS to,
  parameters['value'] AS amount,
  address AS token_address
FROM base.events
WHERE
  event_signature = 'Transfer(address,address,uint256)'
  AND address = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
LIMIT 10;`
  },
  {
    label: 'Recent Base Transactions',
    sql: `SELECT
  block_number,
  transaction_hash,
  from_address,
  to_address,
  value,
  timestamp
FROM base.transactions
ORDER BY block_number DESC
LIMIT 10;`
  },
  {
    label: 'WETH Transfers (Base)',
    sql: `SELECT
  parameters['from'] AS sender,
  parameters['to'] AS recipient,
  parameters['value'] AS amount,
  block_timestamp
FROM base.events
WHERE
  event_signature = 'Transfer(address,address,uint256)'
  AND address = '0x4200000000000000000000000000000000000006'
LIMIT 10;`
  }
];

function formatCell(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  const str = String(value);
  // Truncate long hashes/addresses for display
  if (str.startsWith('0x') && str.length > 20) {
    return `${str.slice(0, 8)}…${str.slice(-6)}`;
  }
  return str;
}

export default function BaseSqlRunner() {
  const [sql, setSql] = useState(PRESETS[0].sql);
  const [results, setResults] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runQuery = useCallback(async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setMeta(null);
    try {
      const res = await base44.functions.invoke('coinbaseAdvancedTrade', { action: 'run_sql', sql });
      setResults(res.data?.result || []);
      setMeta(res.data?.metadata || null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Query failed');
    } finally {
      setLoading(false);
    }
  }, [sql]);

  const columns = results && results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-cyan-400" />
        <h2 className="font-semibold text-sm">Base Chain SQL Explorer</h2>
        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">Coinbase Data API</span>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => { setSql(preset.sql); setResults(null); setMeta(null); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              sql === preset.sql ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* SQL Editor */}
      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        rows={10}
        spellCheck={false}
        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 resize-y leading-relaxed"
        placeholder="Enter SQL query..."
      />

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={runQuery}
          disabled={loading || !sql.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run Query
        </button>
        {meta && (
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {meta.rowCount} rows
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {meta.executionTimeMs}ms
            </span>
            {meta.cached && <span className="text-amber-400">cached</span>}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 bg-rose-950/50 border border-rose-800/50 rounded-lg p-3 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="mt-3 overflow-x-auto">
          {results.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {columns.map((col) => (
                    <th key={col} className="text-left py-2 px-3 text-slate-400 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-3 text-slate-300 font-mono whitespace-nowrap" title={String(row[col] ?? '')}>
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">No rows returned.</p>
          )}
        </div>
      )}
    </div>
  );
}