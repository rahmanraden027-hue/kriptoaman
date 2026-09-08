import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  Gauge,
  Loader2,
  Network,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  WalletCards,
  Wifi,
  XCircle,
} from 'lucide-react';

const NETWORK = {
  name: 'KriptoAman Mainnet Candidate',
  chainId: 22028,
  chainIdHex: '0x560c',
  symbol: 'KAM',
  decimals: 18,
  rpc: 'https://rpc.kriptoaman.com',
  explorer: 'https://explorer.kriptoaman.com',
};

const DEVELOPER_CENTER = `${NETWORK.explorer}/developer`;
const LIVE_STARTER = `${NETWORK.explorer}/developer/starter`;

const SAFE_METHODS = [
  { method: 'eth_chainId', label: 'Chain ID', params: '[]' },
  { method: 'eth_blockNumber', label: 'Latest block', params: '[]' },
  { method: 'eth_gasPrice', label: 'Gas price', params: '[]' },
  { method: 'net_version', label: 'Network version', params: '[]' },
  { method: 'eth_getBalance', label: 'Address balance', params: '["0x0000000000000000000000000000000000000000", "latest"]' },
  { method: 'eth_getBlockByNumber', label: 'Block details', params: '["latest", false]' },
  { method: 'eth_getTransactionByHash', label: 'Transaction lookup', params: '["0x..."]' },
];

const numberFormatter = new Intl.NumberFormat('en-US');
const average = values => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

async function rpc(method, params = []) {
  const started = performance.now();
  try {
    const response = await fetch(NETWORK.rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
      cache: 'no-store',
    });
    const latency = Math.round(performance.now() - started);
    const payload = await response.json();
    if (!response.ok || payload?.error || payload?.result == null) {
      const error = new Error(payload?.error?.message || `RPC HTTP ${response.status}`);
      error.latency = latency;
      throw error;
    }
    return { result: payload.result, latency };
  } catch (error) {
    if (error.latency == null) error.latency = Math.round(performance.now() - started);
    throw error;
  }
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'sky' }) {
  const toneClass = tone === 'emerald'
    ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20'
    : tone === 'amber'
      ? 'text-amber-300 bg-amber-400/10 border-amber-400/20'
      : 'text-sky-300 bg-sky-400/10 border-sky-400/20';

  return (
    <div className="ka-command-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">{label}</p>
        <div className={`rounded-xl border p-2 ${toneClass}`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 min-h-8 text-[11px] leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

function LatencyBars({ samples }) {
  const max = Math.max(...samples, 1);
  if (!samples.length) return <div className="flex h-28 items-center justify-center text-xs text-slate-600">Waiting for live probes…</div>;
  return (
    <div className="flex h-28 items-end gap-1.5" aria-label="Recent RPC latency samples">
      {samples.map((value, index) => (
        <div key={`${index}-${value}`} className="group relative flex-1 rounded-t-md bg-sky-400/50 transition hover:bg-sky-300/70" style={{ height: `${Math.max(12, Math.round((value / max) * 100))}%` }}>
          <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[9px] text-slate-300 group-hover:block">{value} ms</span>
        </div>
      ))}
    </div>
  );
}

export default function KAMDeveloper() {
  const [telemetry, setTelemetry] = useState({ state: 'checking', latency: null, block: null, checkedAt: null, error: '' });
  const [probeStats, setProbeStats] = useState({ total: 0, success: 0, latencies: [] });
  const [method, setMethod] = useState(SAFE_METHODS[0].method);
  const [paramsText, setParamsText] = useState(SAFE_METHODS[0].params);
  const [playgroundOutput, setPlaygroundOutput] = useState('Run a safe JSON-RPC method to inspect the response.');
  const [running, setRunning] = useState(false);
  const [requestStats, setRequestStats] = useState({ total: 0, success: 0, failed: 0, latencies: [] });
  const [walletMessage, setWalletMessage] = useState('');

  const copy = async value => navigator.clipboard?.writeText(String(value));

  const probeNetwork = useCallback(async () => {
    setTelemetry(previous => ({ ...previous, state: 'checking', error: '' }));
    try {
      const chain = await rpc('eth_chainId');
      if (String(chain.result).toLowerCase() !== NETWORK.chainIdHex) throw new Error(`Unexpected Chain ID: ${chain.result}`);
      const block = await rpc('eth_blockNumber');
      const height = Number.parseInt(block.result, 16);
      if (!Number.isFinite(height)) throw new Error('Invalid block height returned by RPC');
      const latency = Math.round((chain.latency + block.latency) / 2);
      setTelemetry({ state: 'operational', latency, block: height, checkedAt: new Date(), error: '' });
      setProbeStats(previous => ({
        total: previous.total + 1,
        success: previous.success + 1,
        latencies: [...previous.latencies.slice(-11), latency],
      }));
    } catch (error) {
      setTelemetry(previous => ({ ...previous, state: 'attention', checkedAt: new Date(), error: error?.message || 'RPC probe failed' }));
      setProbeStats(previous => ({ ...previous, total: previous.total + 1 }));
    }
  }, []);

  useEffect(() => {
    probeNetwork();
    const timer = setInterval(probeNetwork, 20000);
    return () => clearInterval(timer);
  }, [probeNetwork]);

  const sessionUptime = probeStats.total ? ((probeStats.success / probeStats.total) * 100).toFixed(1) : '—';
  const avgRequestLatency = average(requestStats.latencies);
  const successRate = requestStats.total ? ((requestStats.success / requestStats.total) * 100).toFixed(1) : '—';

  const curlSnippet = useMemo(() => {
    let params = [];
    try { params = JSON.parse(paramsText || '[]'); } catch { params = []; }
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    return `curl -s ${NETWORK.rpc} \\
  -H 'content-type: application/json' \\
  --data '${payload}'`;
  }, [method, paramsText]);

  const runPlayground = async () => {
    setRunning(true);
    const startedAt = new Date().toISOString();
    try {
      const parsed = JSON.parse(paramsText || '[]');
      if (!Array.isArray(parsed)) throw new Error('Params must be a JSON array.');
      const result = await rpc(method, parsed);
      setRequestStats(previous => ({
        total: previous.total + 1,
        success: previous.success + 1,
        failed: previous.failed,
        latencies: [...previous.latencies.slice(-19), result.latency],
      }));
      setPlaygroundOutput(JSON.stringify({ ok: true, method, latencyMs: result.latency, requestedAt: startedAt, result: result.result }, null, 2));
    } catch (error) {
      setRequestStats(previous => ({
        total: previous.total + 1,
        success: previous.success,
        failed: previous.failed + 1,
        latencies: error?.latency != null ? [...previous.latencies.slice(-19), error.latency] : previous.latencies,
      }));
      setPlaygroundOutput(JSON.stringify({ ok: false, method, requestedAt: startedAt, error: error?.message || 'RPC request failed' }, null, 2));
    } finally {
      setRunning(false);
    }
  };

  const changeMethod = nextMethod => {
    setMethod(nextMethod);
    const config = SAFE_METHODS.find(item => item.method === nextMethod);
    setParamsText(config?.params || '[]');
    setPlaygroundOutput('Run a safe JSON-RPC method to inspect the response.');
  };

  const addToWallet = async () => {
    setWalletMessage('');
    if (!window.ethereum?.request) {
      setWalletMessage('EVM wallet tidak terdeteksi. Buka melalui MetaMask, Rabby, atau wallet kompatibel EVM.');
      return;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: NETWORK.chainIdHex,
          chainName: NETWORK.name,
          nativeCurrency: { name: 'KriptoAman', symbol: NETWORK.symbol, decimals: NETWORK.decimals },
          rpcUrls: [NETWORK.rpc],
          blockExplorerUrls: [NETWORK.explorer],
        }],
      });
      setWalletMessage('KAM Network berhasil ditambahkan atau dikonfirmasi di wallet.');
    } catch (error) {
      setWalletMessage(error?.message || 'Permintaan wallet dibatalkan.');
    }
  };

  const operational = telemetry.state === 'operational';

  return (
    <main className="ka-bg min-h-screen px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="ka-command-hero overflow-hidden p-6 sm:p-8">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <img src="/icons/kriptoaman-192.png" alt="KriptoAman" className="h-12 w-12 rounded-2xl object-contain" />
                <div>
                  <p className="ka-command-kicker">KAM DEVELOPER CONSOLE</p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">RPC Command Center</h1>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">Live public-RPC telemetry, developer tools, wallet onboarding, safe request analytics, and JSON-RPC testing for the KriptoAman EVM-compatible network.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${operational ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/20 bg-amber-400/10 text-amber-200'}`}>
                  {telemetry.state === 'checking' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : operational ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {telemetry.state === 'checking' ? 'Checking RPC' : operational ? 'Public RPC Operational' : 'RPC Needs Attention'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-black text-amber-200"><ShieldCheck className="h-3.5 w-3.5" /> mainnet-candidate-not-public</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/50 p-4 backdrop-blur">
              <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Endpoint</p><p className="mt-1 truncate text-xs font-bold text-slate-200">rpc.kriptoaman.com</p></div>
              <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Protocol</p><p className="mt-1 text-xs font-bold text-slate-200">JSON-RPC · HTTPS POST</p></div>
              <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Chain ID</p><p className="mt-1 text-xs font-bold text-slate-200">22028 · 0x560c</p></div>
              <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Execution</p><p className="mt-1 text-xs font-bold text-slate-200">EVM compatible</p></div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard icon={Wifi} label="RPC status" value={telemetry.state === 'checking' ? 'Checking' : operational ? 'Operational' : 'Attention'} detail={telemetry.checkedAt ? `Last probe ${telemetry.checkedAt.toLocaleTimeString()}` : 'Connecting to public endpoint'} tone={operational ? 'emerald' : 'amber'} />
          <MetricCard icon={Gauge} label="Latency" value={telemetry.latency != null ? `${telemetry.latency} ms` : '—'} detail="Average of latest Chain ID + block probe" tone={telemetry.latency != null && telemetry.latency < 1000 ? 'emerald' : 'sky'} />
          <MetricCard icon={Activity} label="Block height" value={telemetry.block != null ? numberFormatter.format(telemetry.block) : '—'} detail="Latest block observed from public RPC" />
          <MetricCard icon={Clock3} label="Session uptime" value={sessionUptime === '—' ? '—' : `${sessionUptime}%`} detail={`${probeStats.success}/${probeStats.total} successful live probes · not 24h evidence`} tone={sessionUptime !== '—' && Number(sessionUptime) === 100 ? 'emerald' : 'sky'} />
          <MetricCard icon={ShieldCheck} label="Validator health" value="Protected" detail="4-validator target · live private validator telemetry is intentionally not public" tone="emerald" />
          <MetricCard icon={BarChart3} label="Console requests" value={numberFormatter.format(requestStats.total)} detail={`${successRate === '—' ? 'No calls yet' : `${successRate}% success`} · ${avgRequestLatency == null ? '—' : `${avgRequestLatency} ms avg`}`} />
        </section>

        {telemetry.error && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">{telemetry.error}</div>}

        <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <div className="ka-command-panel p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="ka-command-kicker">LIVE TELEMETRY</p><h2 className="mt-1 text-xl font-black">RPC latency timeline</h2><p className="mt-2 text-xs leading-5 text-slate-500">Rolling browser-session probes every 20 seconds. This visual is convenience telemetry and does not replace production SLO evidence.</p></div>
              <button onClick={probeNetwork} disabled={telemetry.state === 'checking'} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 text-xs font-black text-sky-200 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${telemetry.state === 'checking' ? 'animate-spin' : ''}`} /> Refresh</button>
            </div>
            <div className="mt-7 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4"><LatencyBars samples={probeStats.latencies} /></div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-600">Samples</p><p className="mt-1 font-black">{probeStats.total}</p></div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-600">Avg latency</p><p className="mt-1 font-black">{average(probeStats.latencies) ?? '—'}{probeStats.latencies.length ? ' ms' : ''}</p></div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-600">Success</p><p className="mt-1 font-black">{probeStats.success}/{probeStats.total}</p></div>
            </div>
          </div>

          <div className="ka-command-panel p-5 sm:p-6">
            <p className="ka-command-kicker">NETWORK ACCESS</p>
            <h2 className="mt-1 text-xl font-black">Connect to KAM</h2>
            <div className="mt-5 divide-y divide-slate-800/80 overflow-hidden rounded-2xl border border-slate-800/80">
              {[
                ['RPC endpoint', NETWORK.rpc],
                ['Chain ID', `${NETWORK.chainId} · ${NETWORK.chainIdHex}`],
                ['Native currency', `${NETWORK.symbol} · ${NETWORK.decimals} decimals`],
                ['Explorer', NETWORK.explorer],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-4 py-3.5"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 truncate text-xs font-bold text-slate-200">{value}</p></div><button onClick={() => copy(value)} className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:text-white" aria-label={`Copy ${label}`}><Copy className="h-3.5 w-3.5" /></button></div>
              ))}
            </div>
            <button onClick={addToWallet} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-black text-white transition hover:bg-sky-500"><WalletCards className="h-4 w-4" /> Add KAM Network</button>
            <a href={LIVE_STARTER} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-5 text-xs font-black text-violet-200"><Play className="h-4 w-4" /> Open Live dApp Starter</a>
            <a href={DEVELOPER_CENTER} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-5 text-xs font-black text-sky-200"><Code2 className="h-4 w-4" /> Open Developer Center</a>
            <a href={NETWORK.explorer} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 text-xs font-black text-emerald-200"><ExternalLink className="h-4 w-4" /> Open KAM Explorer</a>
            {walletMessage && <p className="mt-3 text-xs leading-5 text-slate-400">{walletMessage}</p>}
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-[10px] leading-5 text-slate-500"><strong className="text-slate-300">Browser note:</strong> opening the RPC URL directly uses HTTP GET and may return <code>405 Not Allowed</code>. That is expected for a POST-only JSON-RPC endpoint and does not mean the RPC is offline.</div>
          </div>
        </section>

        <section className="ka-command-panel overflow-hidden">
          <div className="border-b border-slate-800/80 p-5 sm:p-6">
            <div className="flex items-center gap-3"><div className="rounded-xl border border-violet-400/20 bg-violet-400/10 p-2 text-violet-300"><Code2 className="h-5 w-5" /></div><div><p className="ka-command-kicker">API PLAYGROUND</p><h2 className="mt-1 text-xl font-black">Run a JSON-RPC request</h2></div></div>
            <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-500">The public console exposes a curated set of read-only methods. Admin, debug, personal, and QBFT management namespaces remain unavailable from the public RPC by design.</p>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="border-b border-slate-800/80 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">Method</label>
              <select value={method} onChange={event => changeMethod(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-200 outline-none focus:border-sky-500/50">
                {SAFE_METHODS.map(item => <option key={item.method} value={item.method}>{item.label} · {item.method}</option>)}
              </select>

              <label className="mt-5 block text-[10px] font-black uppercase tracking-wider text-slate-600">Params · JSON array</label>
              <textarea value={paramsText} onChange={event => setParamsText(event.target.value)} rows={5} spellCheck={false} className="mt-2 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-xs leading-5 text-emerald-200 outline-none focus:border-sky-500/50" />

              <button onClick={runPlayground} disabled={running} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-500 disabled:opacity-50">{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run request</button>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-600">cURL</p><button onClick={() => copy(curlSnippet)} className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:text-white"><Copy className="h-3.5 w-3.5" /></button></div>
                <code className="mt-3 block overflow-x-auto whitespace-pre text-[10px] leading-5 text-sky-200">{curlSnippet}</code>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Response</p><button onClick={() => copy(playgroundOutput)} className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:text-white"><Copy className="h-3.5 w-3.5" /></button></div>
              <pre className="mt-3 min-h-[310px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-[11px] leading-5 text-emerald-200">{playgroundOutput}</pre>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl border border-slate-800 p-3"><p className="text-[9px] text-slate-600">Calls</p><p className="mt-1 text-sm font-black">{requestStats.total}</p></div>
                <div className="rounded-xl border border-slate-800 p-3"><p className="text-[9px] text-slate-600">Success</p><p className="mt-1 text-sm font-black text-emerald-300">{requestStats.success}</p></div>
                <div className="rounded-xl border border-slate-800 p-3"><p className="text-[9px] text-slate-600">Failed</p><p className="mt-1 text-sm font-black text-amber-300">{requestStats.failed}</p></div>
                <div className="rounded-xl border border-slate-800 p-3"><p className="text-[9px] text-slate-600">Avg</p><p className="mt-1 text-sm font-black">{avgRequestLatency == null ? '—' : `${avgRequestLatency} ms`}</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <a href="/KAMNetwork" className="ka-command-panel p-5 transition hover:border-sky-400/30"><Network className="h-5 w-5 text-sky-300" /><h3 className="mt-3 font-black">Network Status</h3><p className="mt-1 text-xs leading-5 text-slate-500">Dedicated public network health, wallet metadata, and block progression view.</p></a>
          <a href="/KAMNetworkDocs" className="ka-command-panel p-5 transition hover:border-violet-400/30"><Server className="h-5 w-5 text-violet-300" /><h3 className="mt-3 font-black">Developer Docs</h3><p className="mt-1 text-xs leading-5 text-slate-500">Network configuration, RPC integration guidance, and EVM-compatible development references.</p></a>
          <a href={LIVE_STARTER} target="_blank" rel="noreferrer" className="ka-command-panel p-5 transition hover:border-violet-400/30"><Play className="h-5 w-5 text-violet-300" /><h3 className="mt-3 font-black">Live dApp Starter</h3><p className="mt-1 text-xs leading-5 text-slate-500">Run verified read-only checks and user-approved wallet onboarding against the public KAM developer surface.</p></a>
          <a href={NETWORK.explorer} target="_blank" rel="noreferrer" className="ka-command-panel p-5 transition hover:border-emerald-400/30"><ExternalLink className="h-5 w-5 text-emerald-300" /><h3 className="mt-3 font-black">Block Explorer</h3><p className="mt-1 text-xs leading-5 text-slate-500">Inspect blocks, transactions, addresses, and public KAM network activity.</p></a>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-[10px] leading-relaxed text-slate-600">Security model: the Developer Console intentionally uses only public read-only JSON-RPC methods. Validator admin/debug/personal/QBFT management methods, private topology, signing material, and protected-origin details are not exposed. Session uptime and request analytics shown here are browser-session telemetry, not formal 24-hour production-readiness evidence.</section>
      </div>
    </main>
  );
}