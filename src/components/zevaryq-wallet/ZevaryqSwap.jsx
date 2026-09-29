import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  executeZevaryqSwap,
  getZevaryqSwapConfiguration,
  getZevaryqSwapExplorerUrl,
  quoteZevaryqSwap,
  verifyZevaryqSwapContracts,
  ZEVARYQ_SWAP_TOKENS,
} from '@/services/zevaryqSwap';
import { ZEVARYQ } from '@/theme/zevaryqWallet';
import { StatePanel } from './WalletUI';

const FIRST_PARTY_ASSET_CATALOG = Object.freeze([
  {
    symbol: 'ZVQ',
    name: 'ZEVARYQ',
    state: 'active',
    badge: 'NATIVE ACTIVE',
    detail: 'Native asset of ZEVARYQ Mainnet · Chain 22028',
  },
  {
    symbol: 'ZUSD',
    name: 'ZEVARYQ USD',
    state: 'planned',
    badge: 'PLANNED',
    detail: 'Reserve-backed ecosystem asset candidate · not USDT or USDC · not deployed',
    icon: '/assets/zevaryq/tokens/zusd.svg?v=2',
  },
  {
    symbol: 'zBTC',
    name: 'ZEVARYQ Bitcoin',
    state: 'planned',
    badge: 'PLANNED',
    detail: 'BTC-backed representation candidate · bridge/backing authorization pending',
    icon: '/assets/zevaryq/tokens/zbtc.svg?v=2',
  },
  {
    symbol: 'zETH',
    name: 'ZEVARYQ Ethereum',
    state: 'planned',
    badge: 'PLANNED',
    detail: 'ETH-backed representation candidate · bridge/backing authorization pending',
    icon: '/assets/zevaryq/tokens/zeth.svg?v=2',
  },
]);

function AssetCatalog({ registryTokens = [], registryVerified = false }) {
  const registryRows = registryTokens.map((token) => ({
    symbol: token.symbol,
    name: token.name || token.symbol,
    state: registryVerified ? 'verified' : 'configured',
    badge: registryVerified ? 'VERIFIED ON-CHAIN' : 'REGISTRY CONFIGURED',
    detail: `${token.address.slice(0, 8)}…${token.address.slice(-6)} · ${token.decimals} decimals`,
  }));
  const rows = [...FIRST_PARTY_ASSET_CATALOG, ...registryRows];

  return (
    <section className="zv-card p-5" data-asset-catalog="zevaryq-multi-asset">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="zv-label">ZEVARYQ Asset Universe</p>
          <h2 className="mt-1 text-2xl font-black">Wallet & Swap Assets</h2>
        </div>
        <span className="rounded-full border border-[#2D8CFF]/30 bg-[#2D8CFF]/10 px-3 py-1 text-[10px] font-black text-[#7CC7FF]">CHAIN 22028</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#9FB3C8]">
        ZVQ is the native asset. ZUSD, zBTC and zETH are first-party ZEVARYQ asset-layer candidates and remain locked until their backing, deployment and trading gates are independently satisfied. Additional ERC-20 assets appear automatically only from the verified swap registry.
      </p>
      <div className="mt-5 grid gap-3">
        {rows.map((asset) => (
          <div key={asset.symbol + asset.detail} className="rounded-2xl border border-[#1A3A59] bg-[#071522]/65 p-4">
            <div className="flex items-start gap-3">
              {asset.icon ? (
                <img
                  src={asset.icon}
                  alt={`${asset.symbol} token icon`}
                  className="h-14 w-14 shrink-0 rounded-full object-contain drop-shadow-[0_0_12px_rgba(45,140,255,.35)]"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#2D8CFF]/35 bg-[#102235] text-sm font-black text-[#F2C86B]">{asset.symbol.slice(0, 4)}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-white">{asset.symbol}</h3>
                  <span className={asset.state === 'active' || asset.state === 'verified'
                    ? 'rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-300'
                    : asset.state === 'configured'
                      ? 'rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-[9px] font-black text-sky-300'
                      : 'rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[9px] font-black text-amber-200'}>
                    {asset.badge}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#C6D5E3]">{asset.name}</p>
                <p className="mt-1 break-words text-xs leading-5 text-[#6F859B]">{asset.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#6F859B]">
        USDT/USDC issuer assets are not created or imitated by ZEVARYQ. A future USDT.zvq or USDC.zvq entry may appear only after provenance-verified issuer/bridge integration.
      </p>
    </section>
  );
}

export default function ZevaryqSwap({ web3, onConnect }) {
  const config = useMemo(() => getZevaryqSwapConfiguration(), []);
  const [verification, setVerification] = useState({ phase: 'loading', verified: false, error: '' });
  const [fromSymbol, setFromSymbol] = useState(ZEVARYQ.symbol);
  const [toSymbol, setToSymbol] = useState(ZEVARYQ_SWAP_TOKENS[0]?.symbol || '');
  const [amount, setAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txKind, setTxKind] = useState('swap');

  const onZevaryq = web3?.isConnected && web3.chainId === ZEVARYQ.chainId;
  const tokens = [ZEVARYQ.symbol, ...ZEVARYQ_SWAP_TOKENS.map((token) => token.symbol)];

  useEffect(() => {
    let active = true;
    if (!config.configured) {
      setVerification({ phase: 'unconfigured', verified: false, error: config.reasons.join('; ') });
      return () => { active = false; };
    }
    verifyZevaryqSwapContracts()
      .then((next) => {
        if (active) setVerification({ phase: next.verified ? 'success' : 'error', verified: Boolean(next.verified), error: next.reasons?.join('; ') || '' });
      })
      .catch((nextError) => {
        if (active) setVerification({ phase: 'error', verified: false, error: nextError?.message || 'Swap contracts could not be verified.' });
      });
    return () => { active = false; };
  }, [config]);

  const swapDirection = () => {
    if (!toSymbol) return;
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setQuote(null);
    setTxHash('');
    setError('');
    setNotice('');
  };

  const refreshQuote = async () => {
    setPhase('quoting');
    setError('');
    setNotice('');
    setTxHash('');
    try {
      const next = await quoteZevaryqSwap({ fromSymbol, toSymbol, amount, slippageBps });
      setQuote(next);
      setPhase('quoted');
    } catch (nextError) {
      setQuote(null);
      setError(nextError?.message || 'On-chain quote failed.');
      setPhase('error');
    }
  };

  const execute = async () => {
    if (web3?.readOnlyRelease) {
      setError('Transaction signing remains disabled by the production safety gate.');
      return;
    }
    setPhase('signing');
    setError('');
    setNotice('');
    try {
      const result = await executeZevaryqSwap({ walletClient: web3?.walletClient, account: web3?.account, quote });
      if (result.requiresFreshQuote && result.approvalHash) {
        setTxHash(result.approvalHash);
        setTxKind('approval');
        setPhase('approvalComplete');
        setQuote(null);
        setNotice('Token approval confirmed. Refresh the on-chain quote before signing the swap transaction.');
        return;
      }
      setTxHash(result.hash);
      setTxKind('swap');
      setPhase('submitted');
      setQuote(null);
      setNotice('Swap transaction submitted to ZEVARYQ Mainnet.');
      await web3?.refreshBalance?.();
    } catch (nextError) {
      setError(nextError?.message || 'Swap was not submitted.');
      setPhase('error');
    }
  };

  if (!web3?.isConnected) {
    return (
      <section className="zv-card p-5">
        <p className="zv-label">ZEVARYQ Swap</p>
        <h2 className="mt-2 text-2xl font-black">Connect a wallet to continue</h2>
        <p className="mt-3 text-sm leading-6 text-[#9FB3C8]">The swap surface never holds a private key. Signing happens only inside the connected wallet.</p>
        <button type="button" onClick={onConnect} className="zv-button-primary mt-5 w-full">Connect Wallet</button>
      </section>
    );
  }

  if (!onZevaryq) {
    return (
      <section className="zv-card p-5">
        <p className="zv-label">ZEVARYQ Swap</p>
        <h2 className="mt-2 text-2xl font-black">Switch to Chain 22028</h2>
        <p className="mt-3 text-sm leading-6 text-[#9FB3C8]">Your wallet must approve ZEVARYQ Mainnet before an on-chain quote or swap can be used.</p>
        <button type="button" onClick={() => web3.addZevaryqNetwork()} className="zv-button-primary mt-5 w-full">Add / Switch ZEVARYQ Mainnet</button>
      </section>
    );
  }

  if (!config.configured || verification.phase === 'unconfigured') {
    return (
      <>
        <AssetCatalog registryTokens={ZEVARYQ_SWAP_TOKENS} registryVerified={false} />
        <section className="zv-card p-5">
        <p className="zv-label">Real-only Swap Gate</p>
        <h2 className="mt-2 text-2xl font-black">Swap router is not activated</h2>
        <p className="mt-3 text-sm leading-6 text-[#9FB3C8]">
          ZEVARYQ Wallet will not fabricate prices, token contracts, liquidity, or simulated routes. Production activation requires the official WZVQ contract, a verified V2-compatible router, and a verified ZEVARYQ token registry.
        </p>
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-5 text-amber-200">
          {config.reasons.join(' · ')}
        </div>
      </section>
      </>
    );
  }

  if (verification.phase === 'loading') {
    return <><AssetCatalog registryTokens={ZEVARYQ_SWAP_TOKENS} registryVerified={false} /><section className="zv-card p-5"><StatePanel phase="loading" title="Verifying swap contracts" body="Checking router, WZVQ and token bytecode on ZEVARYQ Mainnet." /></section></>;
  }

  if (!verification.verified) {
    return (
      <>
        <AssetCatalog registryTokens={ZEVARYQ_SWAP_TOKENS} registryVerified={false} />
        <section className="zv-card p-5">
        <p className="zv-label">Verification Failed</p>
        <h2 className="mt-2 text-2xl font-black">Swap remains locked</h2>
        <p className="mt-3 text-sm leading-6 text-red-300">{verification.error || 'Configured contracts could not be independently verified on Chain 22028.'}</p>
      </section>
      </>
    );
  }

  return (
    <>
      <AssetCatalog registryTokens={ZEVARYQ_SWAP_TOKENS} registryVerified={true} />
      <section className="zv-card space-y-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="zv-label">ZEVARYQ Native DEX</p>
          <h2 className="mt-1 text-2xl font-black">Real On-chain Swap</h2>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">CONTRACTS VERIFIED</span>
      </div>

      <div className="rounded-2xl border border-[#1A3A59] bg-[#071522]/65 p-4">
        <div className="flex items-center gap-3">
          <select value={fromSymbol} onChange={(event) => { setFromSymbol(event.target.value); setQuote(null); }} className="rounded-xl border border-[#1A3A59] bg-[#102235] px-3 py-2 font-black">
            {tokens.filter((symbol) => symbol !== toSymbol).map((symbol) => <option key={symbol}>{symbol}</option>)}
          </select>
          <input value={amount} onChange={(event) => { setAmount(event.target.value); setQuote(null); }} inputMode="decimal" placeholder="0.0" className="min-w-0 flex-1 bg-transparent text-right text-2xl font-black outline-none" />
        </div>
      </div>

      <div className="flex justify-center">
        <button type="button" onClick={swapDirection} className="zv-icon-button" aria-label="Reverse swap direction"><ArrowDownUp /></button>
      </div>

      <div className="rounded-2xl border border-[#1A3A59] bg-[#071522]/65 p-4">
        <div className="flex items-center gap-3">
          <select value={toSymbol} onChange={(event) => { setToSymbol(event.target.value); setQuote(null); }} className="rounded-xl border border-[#1A3A59] bg-[#102235] px-3 py-2 font-black">
            {tokens.filter((symbol) => symbol !== fromSymbol).map((symbol) => <option key={symbol}>{symbol}</option>)}
          </select>
          <p className="min-w-0 flex-1 break-all text-right text-2xl font-black leading-tight">{quote ? quote.amountOutFormatted : '—'}</p>
        </div>
      </div>

      <label className="zv-field">
        <span>Maximum slippage</span>
        <select value={slippageBps} onChange={(event) => { setSlippageBps(Number(event.target.value)); setQuote(null); }}>
          <option value={25}>0.25%</option>
          <option value={50}>0.50%</option>
          <option value={100}>1.00%</option>
        </select>
      </label>

      {quote && (
        <dl className="space-y-3 rounded-2xl border border-[#1A3A59] bg-[#071522]/50 p-4 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-[#9FB3C8]">Expected output</dt><dd className="font-black">{quote.amountOutFormatted} {quote.toSymbol}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#9FB3C8]">Minimum received</dt><dd>{quote.minAmountOutFormatted} {quote.toSymbol}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#9FB3C8]">Route</dt><dd className="text-right">{quote.path.map((address) => address.slice(0, 8) + '…').join(' → ')}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#9FB3C8]">Router</dt><dd className="font-mono">{quote.router.slice(0, 8)}…{quote.router.slice(-6)}</dd></div>
        </dl>
      )}

      {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}

      {txHash && (
        <a href={getZevaryqSwapExplorerUrl(txHash)} target="_blank" rel="noreferrer" className="zv-button-secondary w-full">
          <ExternalLink className="h-4 w-4" /> View {txKind === 'approval' ? 'approval' : 'swap'} on Explorer
        </a>
      )}

      {!quote ? (
        <button type="button" onClick={refreshQuote} disabled={!amount || phase === 'quoting'} className="zv-button-primary w-full disabled:opacity-45">
          {phase === 'quoting' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Get On-chain Quote
        </button>
      ) : (
        <button type="button" onClick={execute} disabled={phase === 'signing' || web3?.readOnlyRelease} className="zv-button-primary w-full disabled:opacity-45">
          <ShieldCheck className="h-4 w-4" />
          {web3?.readOnlyRelease ? 'Signing Locked by Safety Gate' : phase === 'signing' ? 'Confirm in Wallet…' : 'Confirm Swap in Wallet'}
        </button>
      )}

      <p className="text-xs leading-5 text-[#6F859B]">
        Quotes are read directly from the configured Chain 22028 router. No fallback or simulated price is shown. Every approval and swap requires explicit confirmation in the connected wallet.
      </p>
      </section>
    </>
  );
}
