import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownToLine, ArrowLeft, ArrowLeftRight, ArrowUpRight, Bell, Check, ChevronRight, Clipboard, ExternalLink, Fingerprint, Globe2, HelpCircle, Languages, LockKeyhole, Maximize, QrCode, ScanLine, Settings as SettingsIcon, Share2, ShieldCheck, Smartphone, UserRoundCog, WalletCards } from 'lucide-react';
import { useWeb3 } from '@/components/web3/Web3Provider';
import ZevaryqMark from '@/components/zevaryq-wallet/ZevaryqMark';
import NetworkInfrastructureCard from '@/components/zevaryq-wallet/NetworkInfrastructureCard';
import WalletBottomNavigation from '@/components/zevaryq-wallet/WalletBottomNavigation';
import ZevaryqWalletConnector from '@/components/zevaryq-wallet/ZevaryqWalletConnector';
import ZevaryqSwap from '@/components/zevaryq-wallet/ZevaryqSwap';
import { EmptyState, StatePanel, StatusBadge, compactAddress } from '@/components/zevaryq-wallet/WalletUI';
import useZevaryqNetworkStatus from '@/hooks/useZevaryqNetworkStatus';
import { fetchZvqBalance } from '@/services/zevaryqNetwork';
import { fetchZevaryqTokenAssets } from '@/services/zevaryqAssets';
import { ZEVARYQ } from '@/theme/zevaryqWallet';
import { base44 } from '@/api/base44Client';
import { kriptoAuth } from '@/lib/kriptoAuth';
import './ZevaryqWallet.css';

const EXPLORER = ZEVARYQ.explorer;
const VALID_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

function Header({ title, subtitle = '', back = false, onBack = null, onSettings = null }) {
  return <header className="zv-header"><div className="flex min-w-0 items-center gap-3">{back ? <button type="button" onClick={onBack} className="zv-icon-button" aria-label="Go back"><ArrowLeft /></button> : <ZevaryqMark className="h-12 w-12 shrink-0" />}<div className="min-w-0 flex-1"><h1 className="zv-header-title text-lg font-black leading-tight text-white sm:text-xl">{title}</h1>{subtitle && <p className="mt-0.5 break-words text-xs leading-4 text-[#9FB3C8]">{subtitle}</p>}</div></div>{!back && <div className="zv-header-actions flex gap-1"><button className="zv-icon-button" aria-label="Notifications"><Bell /></button><button className="zv-icon-button" aria-label="QR scanner" title="Camera scanner is not configured"><ScanLine /></button><button className="zv-icon-button" onClick={onSettings} aria-label="Settings"><SettingsIcon /></button></div>}</header>;
}

function SplashScreen() { return <main className="zv-splash" aria-label="Loading ZEVARYQ Wallet"><div className="zv-orbit" aria-hidden="true" /><ZevaryqMark className="relative z-10 h-32 w-32" /><div className="relative z-10 text-center"><p className="text-3xl font-black tracking-[.12em] text-[#F2C86B]">ZEVARYQ</p><p className="mt-1 text-xs font-bold tracking-[.35em] text-[#9FB3C8]">NETWORK</p><h1 className="mt-8 text-2xl font-black">ZEVARYQ Wallet</h1><p className="mt-2 text-xs font-semibold tracking-wide text-[#9FB3C8]">ZVQ Mainnet Wallet · Secure · Multi-Chain Ready</p><p className="mt-3 text-[11px] text-[#6F859B]">Part of the KriptoAman ecosystem</p><span className="mx-auto mt-6 block h-1 w-36 overflow-hidden rounded-full bg-[#102235]"><span className="zv-loading-bar block h-full rounded-full bg-gradient-to-r from-[#D9A441] to-[#2D8CFF]" /></span></div></main>; }

function Action({ icon: Icon, label, onClick }) { return <button type="button" onClick={onClick} className="zv-action-item group flex flex-col items-center gap-2 text-xs font-bold"><span className="grid h-14 w-14 place-items-center rounded-full border border-[#2D8CFF]/55 bg-gradient-to-br from-[#1A4F8B] to-[#071522] shadow-[0_0_24px_rgba(45,140,255,.22)] group-active:scale-95"><Icon className="h-6 w-6 text-[#F2C86B]" /></span>{label}</button>; }

function Home({ web3, network, balance, balancePhase, tokenAssets, assetPhase, setScreen }) {
  const onNetwork = web3?.isConnected && web3.chainId === ZEVARYQ.chainId;
  const networkOnline = network?.data?.rpc === 'connected';
  const state = onNetwork || networkOnline ? 'success' : web3?.connecting ? 'loading' : 'offline';
  const label = web3?.connecting
    ? 'Connecting'
    : onNetwork
      ? 'Wallet Connected'
      : web3?.isConnected
        ? 'Wrong Network'
        : networkOnline
          ? 'Network Online'
          : 'Network Offline';
  const showBalance = onNetwork && balancePhase === 'success';
  const balanceText = showBalance
    ? Number(balance || 0).toLocaleString('en-US', { maximumFractionDigits: 8 })
    : '—';
  const previewAssets = Array.isArray(tokenAssets) ? tokenAssets.slice(0, 4) : [];

  return <>
    <section className="zv-hero">
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className="zv-label">ZEVARYQ Wallet · ZVQ Mainnet</p>
          <StatusBadge state={state}>{label}</StatusBadge>
        </div>
        <p className="mt-5 text-5xl font-black tracking-[-.05em] text-white sm:text-[56px]">
          {balanceText} <span className="text-xl tracking-normal text-[#F2C86B]">ZVQ</span>
        </p>
        <p className="mt-1 text-[#9FB3C8]">
          {onNetwork
            ? 'Verified on-chain balance · Market price unavailable'
            : web3?.isConnected
              ? 'Switch to ZEVARYQ Mainnet to verify the active balance'
              : 'Connect a wallet to view the verified on-chain balance'}
        </p>
        <div className="mt-5 flex items-center gap-2 text-sm text-[#9FB3C8]">
          <span className="min-w-0 truncate">{web3?.account ? compactAddress(web3.account) : 'Wallet disconnected'}</span>
          {web3?.account && <>
            <button onClick={() => navigator.clipboard?.writeText(web3.account)} className="zv-mini-button" aria-label="Copy address"><Clipboard /></button>
            <button onClick={() => setScreen('receive')} className="zv-mini-button" aria-label="Show QR"><QrCode /></button>
          </>}
        </div>
        {!web3?.isConnected && <button onClick={() => setScreen('connect')} className="zv-button-primary mt-5 w-full">Connect Wallet</button>}
        {web3?.isConnected && !onNetwork && <button onClick={() => web3.switchChain(ZEVARYQ.chainId)} className="zv-button-primary mt-5 w-full">Switch to ZEVARYQ Mainnet</button>}
      </div>
    </section>

    <div className="zv-action-grid grid gap-3 px-1">
      <Action icon={ArrowUpRight} label="Send" onClick={() => setScreen('send')} />
      <Action icon={ArrowDownToLine} label="Receive" onClick={() => setScreen('receive')} />
      <Action icon={WalletCards} label="Assets" onClick={() => setScreen('assets')} />
      <Action icon={ArrowLeftRight} label="Swap" onClick={() => setScreen('swap')} />
    </div>

    <NetworkInfrastructureCard network={network} compact />

    <section className="zv-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="zv-label">My Assets</p>
        {web3?.account && <span className="text-[10px] font-bold uppercase text-[#6F859B]">{1 + (tokenAssets?.length || 0)} on-chain assets</span>}
      </div>
      <div className="zv-asset-row mt-4">
        <ZevaryqMark className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <h2 className="font-black">ZEVARYQ</h2>
          <p className="text-xs text-[#9FB3C8]">ZVQ · {ZEVARYQ.network}</p>
        </div>
        <div className="text-right">
          <p className="font-black">{showBalance ? `${Number(balance || 0).toLocaleString('en-US',{maximumFractionDigits:8})} ZVQ` : '—'}</p>
          <p className="text-xs text-[#6F859B]">{web3?.account ? 'Native balance' : 'Connect wallet'}</p>
        </div>
      </div>

      {web3?.account && assetPhase === 'loading' && <div className="mt-4"><StatePanel phase="loading" title="Loading token holdings" /></div>}
      {web3?.account && assetPhase === 'error' && <p className="mt-4 text-xs text-amber-200">Token holdings are temporarily unavailable. No balances are estimated.</p>}
      {previewAssets.map((asset) => (
        <div key={asset.contractAddress} className="zv-asset-row mt-4 border-t border-[#1A3A59] pt-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#1A3A59] bg-[#071522] font-black text-[#F2C86B]">
            {asset.iconUrl ? <img src={asset.iconUrl} alt="" className="h-9 w-9 rounded-xl object-contain" /> : asset.symbol.slice(0, 3)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-black">{asset.name}</h3>
            <p className="truncate text-xs text-[#9FB3C8]">{asset.symbol} · {asset.type} · {compactAddress(asset.contractAddress)}</p>
          </div>
          <div className="text-right">
            <p className="max-w-[140px] break-all font-black">{asset.balance}</p>
            <p className="text-xs text-[#6F859B]">{asset.symbol}</p>
          </div>
        </div>
      ))}
      {(tokenAssets?.length || 0) > previewAssets.length && (
        <button type="button" onClick={() => setScreen('assets')} className="zv-button-secondary mt-4 w-full">
          View all {tokenAssets.length} token holdings
        </button>
      )}
    </section>
  </>;
}

function SendScreen({ web3, balance, onBack }) {
  const [to,setTo]=useState(''); const [amount,setAmount]=useState(''); const [confirming,setConfirming]=useState(false); const [error,setError]=useState(''); const numeric=Number(amount);
  const validate=()=>!web3?.account?'Connect a wallet first.':web3.chainId!==ZEVARYQ.chainId?'Switch to ZEVARYQ Mainnet.':!VALID_ADDRESS.test(to)?'Enter a valid EVM destination address.':!(numeric>0)?'Enter a valid amount.':numeric>Number(balance||0)?'Insufficient ZVQ balance.':'';
  const prepare=()=>{const next=validate();setError(next);if(!next)setConfirming(true);}; const broadcast=async()=>{try{await web3.sendTransaction({to,value:amount});setConfirming(false);}catch(e){setError(e?.message||'RPC transaction failed.');setConfirming(false);}};
  return <><Header back onBack={onBack} title="Send ZVQ" /><section className="zv-card space-y-5 p-5"><div className="flex items-center gap-3 rounded-2xl border border-[#1A3A59] bg-[#071522]/55 p-3"><ZevaryqMark className="h-11 w-11" /><div><p className="font-bold">ZEVARYQ (ZVQ)</p><p className="text-xs text-[#9FB3C8]">{ZEVARYQ.network} · {ZEVARYQ.chainId}</p></div></div><label className="zv-field"><span>From account</span><input readOnly value={web3?.account||'Wallet not connected'} /></label><label className="zv-field"><span>Destination address</span><input value={to} onChange={e=>setTo(e.target.value.trim())} placeholder="0x…" /></label><label className="zv-field"><span>Amount ZVQ</span><div className="relative"><input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="0.0" /><button onClick={()=>setAmount(String(balance||0))} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-[#D9A441] px-2 py-1 text-xs font-black text-[#071522]">MAX</button></div></label><dl className="space-y-3 rounded-2xl border border-[#1A3A59] bg-[#071522]/50 p-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#9FB3C8]">Estimated network fee</dt><dd className="text-right">Unavailable until estimation</dd></div><div className="flex justify-between border-t border-[#1A3A59] pt-3"><dt className="font-bold">Transaction total</dt><dd className="font-black">{numeric>0?`${numeric} ZVQ + fee`:'—'}</dd></div></dl>{web3?.readOnlyRelease&&<p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">Preview mode is active. Address, amount and balance checks are available, but no transaction can be signed or broadcast.</p>}{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}<button onClick={prepare} className="zv-button-primary w-full">{web3?.readOnlyRelease?'Preview ZVQ Transfer':'Send ZVQ'}</button></section>{confirming&&<div className="zv-modal"><div className="zv-card w-full max-w-md p-6"><h2 className="text-xl font-black">{web3?.readOnlyRelease?'Transaction Preview':'Confirm transaction'}</h2><p className="mt-3 break-all text-sm text-[#9FB3C8]">From {compactAddress(web3?.account)} · Send {amount} ZVQ to {to}.</p><p className="mt-3 text-xs text-[#6F859B]">Chain 22028 · ZEVARYQ Mainnet · Network fee is not added until wallet estimation.</p><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={()=>setConfirming(false)} className="zv-button-secondary">{web3?.readOnlyRelease?'Close':'Cancel'}</button><button onClick={broadcast} disabled={web3?.readOnlyRelease} className="zv-button-primary disabled:cursor-not-allowed disabled:opacity-40">{web3?.readOnlyRelease?'Broadcast Locked':'Confirm'}</button></div></div></div>}</>;
}

function ReceiveScreen({account,onBack}) { const [copied,setCopied]=useState(false); const copy=async()=>{if(!account)return;await navigator.clipboard?.writeText(account);setCopied(true);setTimeout(()=>setCopied(false),1500);}; const share=async()=>{if(!account)return;if(navigator.share)await navigator.share({title:'ZEVARYQ address',text:account});else copy();}; return <><Header back onBack={onBack} title="Receive ZVQ" /><section className="zv-card p-5 text-center"><p className="zv-label">{ZEVARYQ.network}</p>{account?<><div className="mx-auto mt-5 w-fit rounded-[24px] bg-white p-4"><QRCodeSVG value={account} size={220} level="H" imageSettings={{src:'/brand/zevaryq-wallet-premium-icon.webp',height:44,width:44,excavate:true}} /></div><p className="mt-5 break-all rounded-2xl border border-[#1A3A59] bg-[#071522]/60 p-4 font-mono text-sm">{account}</p><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={copy} className="zv-button-secondary">{copied?<Check/>:<Clipboard/>}{copied?'Copied':'Copy'}</button><button onClick={share} className="zv-button-primary"><Share2/>Share Address</button></div></>:<div className="mt-5"><EmptyState title="Wallet not connected" body="Connect an external wallet to generate an address QR code." /></div>}<p className="mt-5 text-xs leading-5 text-amber-200">Only send assets compatible with ZEVARYQ Mainnet to this address.</p></section></>; }

function ExplorerScreen({account,transactions,txPhase,onSelect}) { return <><section className="zv-card p-5"><div className="flex items-center gap-3"><ZevaryqMark className="h-14 w-14"/><div><p className="zv-label">Official Network Tool</p><h2 className="text-2xl font-black">ZEVARYQ Explorer</h2></div></div><a href={EXPLORER} target="_blank" rel="noreferrer" className="zv-button-primary mt-5 w-full"><ExternalLink/>Open Official Explorer</a></section><section className="zv-card p-5"><p className="zv-label">Wallet Transactions</p>{!account?<div className="mt-4"><EmptyState title="Wallet not connected" body="Connect a wallet to load on-chain history."/></div>:txPhase==='loading'?<div className="mt-4"><StatePanel phase="loading"/></div>:transactions.length?<div className="mt-4 divide-y divide-[#1A3A59]">{transactions.map(tx=><button key={tx.hash} onClick={()=>onSelect(tx)} className="flex w-full items-center gap-3 py-4 text-left"><ArrowUpRight className="h-5 w-5 text-[#53D8FB]"/><span className="min-w-0 flex-1"><span className="block truncate font-bold">{compactAddress(tx.hash)}</span><span className="text-xs text-[#6F859B]">Block {tx.block_number??'pending'}</span></span><ChevronRight className="h-4 w-4"/></button>)}</div>:<div className="mt-4"><EmptyState title={txPhase==='error'?'Explorer unavailable':'No transactions found'} body={txPhase==='error'?'The Explorer request failed. Retry later.':'No transaction records were returned.'}/></div>}</section></>; }

function TransactionDetails({tx,onBack}) { const rows=[['Transaction Hash',tx.hash],['Status',tx.status],['Type',tx.method||'Transfer'],['Amount',tx.value?`${Number(tx.value)/1e18} ZVQ`:'0 ZVQ'],['From',tx.from?.hash],['To',tx.to?.hash],['Block',tx.block_number],['Timestamp',tx.timestamp],['Network',ZEVARYQ.network],['Fee',tx.fee?.value?`${Number(tx.fee.value)/1e18} ZVQ`:'Unavailable']]; return <><Header back onBack={onBack} title="Transaction Details"/><section className="zv-card p-5"><StatusBadge state={tx.status==='ok'?'success':'offline'}>{tx.status||'Unknown'}</StatusBadge><dl className="mt-4 divide-y divide-[#1A3A59]">{rows.map(([k,v])=><div key={k} className="grid grid-cols-[110px_1fr] gap-3 py-3 text-sm"><dt className="text-[#6F859B]">{k}</dt><dd className="break-all text-right font-semibold">{v??'Unavailable'}</dd></div>)}</dl><a href={`${EXPLORER}/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="zv-button-primary mt-5 w-full"><ExternalLink/>View on Explorer</a></section></>; }

function Assets({ account, balance, balancePhase, tokenAssets, assetPhase }) {
  if (!account) {
    return <section className="zv-card p-5">
      <p className="zv-label">Assets</p>
      <h2 className="mt-2 text-2xl font-black">My Wallet Assets</h2>
      <div className="mt-5"><EmptyState title="Wallet not connected" body="Connect a wallet to load real ZVQ and token balances for its authorized address." /></div>
    </section>;
  }

  return <>
    <section className="zv-card p-5">
      <p className="zv-label">Assets</p>
      <h2 className="mt-2 text-2xl font-black">My Wallet Assets</h2>
      <p className="mt-2 break-all font-mono text-xs text-[#9FB3C8]">{account}</p>
      <p className="mt-2 text-sm leading-6 text-[#9FB3C8]">Only balances returned by ZEVARYQ RPC and Explorer indexing are shown. No estimated holdings are created.</p>

      <div className="mt-5 rounded-2xl border border-[#1A3A59] bg-[#071522]/65 p-4">
        <div className="zv-asset-row">
          <ZevaryqMark className="h-12 w-12"/>
          <div className="min-w-0 flex-1">
            <p className="font-black">ZEVARYQ</p>
            <p className="text-xs text-[#9FB3C8]">ZVQ · Chain 22028 · Native</p>
          </div>
          <div className="text-right">
            <p className="font-black">{balancePhase === 'success' ? Number(balance || 0).toLocaleString('en-US',{maximumFractionDigits:8}) : '—'}</p>
            <p className="text-xs text-[#6F859B]">ZVQ</p>
          </div>
        </div>
      </div>

      {assetPhase === 'loading' && <div className="mt-4"><StatePanel phase="loading" title="Loading token holdings" /></div>}
      {assetPhase === 'error' && <div className="mt-4"><EmptyState title="Token holdings unavailable" body="Explorer did not return a verified token-balance response. No values are estimated." /></div>}
      {assetPhase === 'success' && tokenAssets.length === 0 && <div className="mt-4"><EmptyState title="No indexed token holdings" body="The connected address currently has no non-zero token balances indexed by ZEVARYQ Explorer." /></div>}

      {tokenAssets.map((asset) => (
        <div key={asset.contractAddress} className="mt-3 rounded-2xl border border-[#1A3A59] bg-[#071522]/65 p-4">
          <div className="zv-asset-row">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#1A3A59] bg-[#071522] font-black text-[#F2C86B]">
              {asset.iconUrl ? <img src={asset.iconUrl} alt="" className="h-9 w-9 rounded-xl object-contain" /> : asset.symbol.slice(0, 3)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black">{asset.name}</p>
              <p className="truncate text-xs text-[#9FB3C8]">{asset.symbol} · {asset.type}</p>
              <a href={`${EXPLORER}/token/${asset.contractAddress}`} target="_blank" rel="noreferrer" className="mt-1 block truncate font-mono text-[10px] text-[#53D8FB]">{asset.contractAddress}</a>
            </div>
            <div className="text-right">
              <p className="max-w-[160px] break-all font-black">{asset.balance}</p>
              <p className="text-xs text-[#6F859B]">{asset.symbol}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  </>;
}

function Security(){const items=[{label:'Wallet Backup',status:'Not configured',Icon:LockKeyhole},{label:'Biometric Login',status:'Coming later',Icon:Fingerprint},{label:'App Lock',status:'Coming later',Icon:ShieldCheck},{label:'Connected Devices',status:'Provider-managed',Icon:Smartphone},{label:'Security Status',status:'External wallet',Icon:ShieldCheck}];return <section className="zv-card p-5"><div className="text-center"><ShieldCheck className="mx-auto h-12 w-12 text-[#F2C86B]"/><h2 className="mt-3 text-2xl font-black">Security Center</h2><p className="text-sm text-[#9FB3C8]">Capabilities reflect the current release.</p></div><div className="mt-6 divide-y divide-[#1A3A59]">{items.map(({label,status,Icon})=><div key={label} className="flex items-center gap-3 py-4"><Icon className="h-5 w-5 text-[#D9A441]"/><span className="flex-1 font-semibold">{label}</span><span className="text-xs text-[#9FB3C8]">{status}</span></div>)}</div></section>;}
function SettingsScreen({web3,currentUser,adminBalances,adminError}){const items=[{label:'Wallet Management',status:web3?.isConnected?compactAddress(web3.account):'Not connected',Icon:WalletCards},{label:'Network Settings',status:ZEVARYQ.network,Icon:Globe2},{label:'Security & Privacy',status:'External wallet',Icon:ShieldCheck},{label:'Appearance',status:'Midnight Navy',Icon:Maximize},{label:'Language',status:'System default',Icon:Languages},{label:'Help & Support',status:'Open support',Icon:HelpCircle},{label:'About',status:'ZEVARYQ Wallet',Icon:UserRoundCog}];return <><section className="zv-card p-5"><div className="flex items-center gap-3"><ZevaryqMark className="h-14 w-14"/><div><h2 className="text-lg font-black">ZEVARYQ Wallet</h2><p className="text-xs text-[#9FB3C8]">ZVQ Mainnet · KriptoAman Ecosystem</p></div></div><div className="mt-6 divide-y divide-[#1A3A59]">{items.map(({label,status,Icon})=><div key={label} className="flex items-center gap-3 py-4"><Icon className="h-5 w-5 text-[#D9A441]"/><span className="flex-1 font-semibold">{label}</span><span className="max-w-[42%] truncate text-xs text-[#9FB3C8]">{status}</span><ChevronRight className="h-4 w-4"/></div>)}</div><p className="mt-5 text-xs text-[#6F859B]">No custody or transaction execution without explicit wallet confirmation.</p>{web3?.isConnected&&<button onClick={web3.disconnectWallet} className="mt-6 min-h-12 w-full rounded-2xl border border-red-500/40 bg-red-500/10 font-bold text-red-300">Disconnect Wallet</button>}</section>{currentUser?.role === 'admin'&&<section className="zv-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-black">Saldo administrasi internal KriptoAman</h2><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-300">KHUSUS ADMIN</span></div>{adminError?<p className="mt-4 text-sm text-red-300">{adminError}</p>:<div className="mt-4 grid grid-cols-2 gap-2">{['BTC','ETH','SOL','USDT'].map(coin=><div key={coin} className="rounded-xl bg-[#071522] p-3"><p className="text-xs text-[#6F859B]">{coin}</p><p className="font-black">{adminBalances?Number(adminBalances[coin]||0).toLocaleString():'—'}</p></div>)}</div>}</section>}</>;}

export default function Wallet(){const web3=useWeb3();const network=useZevaryqNetworkStatus();const connectedAddressCount=Array.isArray(web3?.accounts)?web3.accounts.length:Number(Boolean(web3?.account));const [booting,setBooting]=useState(true);const [screen,setScreen]=useState('wallet');const [balance,setBalance]=useState('0');const [balancePhase,setBalancePhase]=useState('empty');const [tokenAssets,setTokenAssets]=useState([]);const [assetPhase,setAssetPhase]=useState('empty');const [transactions,setTransactions]=useState([]);const [txPhase,setTxPhase]=useState('empty');const [selectedTx,setSelectedTx]=useState(null);const [currentUser,setCurrentUser]=useState(null);const [adminBalances,setAdminBalances]=useState(null);const [adminError,setAdminError]=useState('');
  useEffect(()=>{const timer=setTimeout(()=>setBooting(false),650);return()=>clearTimeout(timer);},[]);
  useEffect(()=>{base44.auth.me().then(setCurrentUser).catch(()=>setCurrentUser(null));},[]);
  useEffect(()=>{let active=true;if(currentUser?.role !== 'admin'){setAdminBalances(null);setAdminError('');return;}kriptoAuth.getAdminBalance().then(data=>{if(active)setAdminBalances(data?.balances||{});}).catch(()=>{if(active)setAdminError('Saldo administrasi internal KriptoAman belum dapat dimuat.');});return()=>{active=false;};},[currentUser?.role]);
  useEffect(()=>{let active=true;if(!web3?.account){setBalance('0');setBalancePhase('empty');return;}setBalance('0');setBalancePhase('loading');fetchZvqBalance(web3.account).then(v=>{if(active){setBalance(v||'0');setBalancePhase('success');}}).catch(()=>{if(active)setBalancePhase('error');});return()=>{active=false;};},[web3?.account,network.data?.checkedAt]);
  useEffect(()=>{let active=true;if(!web3?.account||web3?.chainId!==ZEVARYQ.chainId){setTokenAssets([]);setAssetPhase('empty');return;}setTokenAssets([]);setAssetPhase('loading');fetchZevaryqTokenAssets(web3.account).then(items=>{if(active){setTokenAssets(items);setAssetPhase('success');}}).catch(()=>{if(active){setTokenAssets([]);setAssetPhase('error');}});return()=>{active=false;};},[web3?.account,web3?.chainId,network.data?.checkedAt]);
  useEffect(()=>{let active=true;if(!web3?.account){setTransactions([]);setTxPhase('empty');return;}const controller=new AbortController();setTxPhase('loading');fetch(`${EXPLORER}/api/v2/addresses/${web3.account}/transactions`,{signal:controller.signal,headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>{if(active){setTransactions(Array.isArray(d?.items)?d.items:[]);setTxPhase('success');}}).catch(()=>{if(active)setTxPhase('error');});return()=>{active=false;controller.abort();};},[web3?.account]);
  if(booting)return <SplashScreen/>;
  if(selectedTx)return <main className="zv-wallet-shell"><div className="zv-wallet-content"><TransactionDetails tx={selectedTx} onBack={()=>setSelectedTx(null)}/></div></main>;
  if(screen==='send')return <main className="zv-wallet-shell"><div className="zv-wallet-content"><SendScreen web3={web3} balance={balance} onBack={()=>setScreen('wallet')}/></div></main>;
  if(screen==='receive')return <main className="zv-wallet-shell"><div className="zv-wallet-content"><ReceiveScreen account={web3?.account} onBack={()=>setScreen('wallet')}/></div></main>;
  if(screen==='connect')return <main className="zv-wallet-shell"><div className="zv-wallet-content"><Header back onBack={()=>setScreen('wallet')} title="Connect Wallet" subtitle="EIP-6963 · WalletConnect · Chain 22028"/><ZevaryqWalletConnector web3={web3}/></div></main>;
  if(screen==='swap')return <main className="zv-wallet-shell"><div className="zv-wallet-content"><Header back onBack={()=>setScreen('wallet')} title="Swap ZVQ" subtitle="Verified on-chain routes only"/><ZevaryqSwap web3={web3} onConnect={()=>setScreen('connect')}/></div></main>;
  return <main className="zv-wallet-shell" data-connected-addresses={connectedAddressCount}><span className="sr-only">Status pemantauan · Aktivitas pemantauan terbaru</span><div className="zv-wallet-content"><div className="zv-app-badge"><span>APP 2 OF 2</span><strong>ZEVARYQ Wallet</strong><small>KriptoAman Ecosystem</small></div><Header title="ZEVARYQ Wallet" subtitle={`${ZEVARYQ.network} · Chain ${ZEVARYQ.chainId}`} onSettings={()=>setScreen('settings')}/>{screen==='wallet'&&<Home web3={web3} network={network} balance={balance} balancePhase={balancePhase} tokenAssets={tokenAssets} assetPhase={assetPhase} setScreen={setScreen}/>} {screen==='explorer'&&<ExplorerScreen account={web3?.account} transactions={transactions} txPhase={txPhase} onSelect={setSelectedTx}/>} {screen==='assets'&&<Assets account={web3?.account} balance={balance} balancePhase={balancePhase} tokenAssets={tokenAssets} assetPhase={assetPhase}/>}{screen==='security'&&<Security/>}{screen==='settings'&&<SettingsScreen web3={web3} currentUser={currentUser} adminBalances={adminBalances} adminError={adminError}/>}</div><WalletBottomNavigation active={screen} onChange={setScreen}/></main>;
}
