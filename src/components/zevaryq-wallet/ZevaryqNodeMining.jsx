import { useEffect, useState } from 'react';
import { Activity, Database, Server, ShieldCheck } from 'lucide-react';
import { ZEVARYQ } from '@/theme/zevaryqWallet';

const UNKNOWN = 'Unavailable';
export default function ZevaryqNodeMining({ network }) {
  const [state, setState] = useState({ phase: 'loading', height: null, indexed: null, checkedAt: null });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function refresh() {
      try {
        const rpcHeight = network?.data?.blockNumber ?? null;
        const response = await fetch(`${ZEVARYQ.explorer}/api/v2/blocks?type=block&items_count=1`, {
          signal: controller.signal, headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Indexer unavailable');
        const data = await response.json();
        const indexed = Number(data?.items?.[0]?.height);
        if (!Number.isSafeInteger(indexed) || indexed < 0) throw new Error('No verified indexed block');
        if (active) setState({ phase: 'success', height: rpcHeight, indexed, checkedAt: new Date().toISOString() });
      } catch (error) {
        if (active && !controller.signal.aborted) setState({ phase: 'error', height: null, indexed: null, checkedAt: null });
      }
    }
    refresh();
    return () => { active = false; controller.abort(); };
  }, [network?.data?.checkedAt]);
  const chainVerified = network?.data?.rpc === 'connected' && Number.isSafeInteger(network?.data?.blockNumber);
  return <section className="zv-card p-5" data-feature="zvq-node-mining" data-mode="read-only">
    <div className="flex items-center gap-3"><Server className="h-9 w-9 text-[#F2C86B]"/><div><p className="zv-label">ZEVARYQ MAINNET · CHAIN 22028</p><h2 className="text-2xl font-black">Hybrid Node Mining</h2></div></div>
    <p className="mt-3 text-sm leading-6 text-[#9FB3C8]">Read-only network dashboard. A mobile wallet does not mine blocks or run a validator. Rewards, staking and node enrollment remain disabled pending consensus and security audits.</p>
    <div className="mt-5 grid grid-cols-2 gap-3">
      {[{name:'RPC',value:chainVerified?'Connected':UNKNOWN,Icon:Activity},
        {name:'Indexed block',value:state.phase==='success'?String(state.indexed):UNKNOWN,Icon:Database},
        {name:'RPC block',value:chainVerified && state.height != null?String(state.height):UNKNOWN,Icon:Server},
        {name:'Node rewards',value:'Not enabled',Icon:ShieldCheck}].map(({name,value,Icon})=>
        <div key={name} className="rounded-2xl border border-[#1A3A59] bg-[#071522] p-4"><Icon className="h-5 w-5 text-[#F2C86B]"/><p className="mt-2 text-xs text-[#9FB3C8]">{name}</p><p className="mt-1 break-all font-bold">{value}</p></div>)}
    </div>
    <p className="mt-4 text-xs text-[#9FB3C8]">Indexer: {state.phase==='success'?'Verified response':'Unavailable'} · Last check: {state.checkedAt || UNKNOWN}</p>
    <p className="mt-2 text-xs text-amber-200">Validator keys are never stored in this wallet. Liquidity remains locked and requires separate manual authorization.</p>
  </section>;
}
