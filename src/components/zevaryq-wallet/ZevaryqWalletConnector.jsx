import { ExternalLink, PlugZap, WalletCards } from 'lucide-react';
import { compactAddress, StatusBadge } from './WalletUI';
import { ZEVARYQ } from '@/theme/zevaryqWallet';

export default function ZevaryqWalletConnector({ web3 }) {
  const installed = Array.isArray(web3?.availableWallets) ? web3.availableWallets : [];
  const accounts = Array.isArray(web3?.accounts) ? web3.accounts : web3?.account ? [web3.account] : [];
  const onZevaryq = web3?.isConnected && web3?.chainId === ZEVARYQ.chainId;

  return (
    <section className="zv-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#2D8CFF]/40 bg-[#071522]">
          <PlugZap className="h-6 w-6 text-[#F2C86B]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="zv-label">Universal Wallet Connection</p>
          <h2 className="text-xl font-black">Connect to ZEVARYQ Mainnet</h2>
        </div>
        <StatusBadge state={onZevaryq ? 'success' : web3?.isConnected ? 'offline' : 'loading'}>
          {onZevaryq ? 'Chain 22028' : web3?.isConnected ? 'Wrong network' : 'Ready'}
        </StatusBadge>
      </div>

      {!web3?.isConnected ? (
        <>
          <p className="mt-4 text-sm leading-6 text-[#9FB3C8]">
            Installed EVM wallets are discovered locally through EIP-6963. WalletConnect is available for compatible mobile and external wallets.
          </p>

          {installed.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="zv-label">Detected wallets</p>
              {installed.map((wallet) => (
                <button
                  type="button"
                  key={wallet.info?.uuid || wallet.info?.name}
                  onClick={() => web3.connectWallet(wallet)}
                  disabled={web3?.connecting}
                  className="zv-button-secondary w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <WalletCards className="h-4 w-4" />
                    {wallet.info?.name || 'Installed EVM wallet'}
                  </span>
                  <span className="text-xs text-[#9FB3C8]">Connect</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => web3?.connectWalletConnect?.()}
            disabled={web3?.connecting || !web3?.walletConnectConfigured}
            className="zv-button-primary mt-4 w-full"
          >
            <PlugZap className="h-4 w-4" />
            {web3?.connecting ? 'Connecting…' : 'All compatible wallets via WalletConnect'}
          </button>

          <p className="mt-4 text-xs leading-5 text-[#6F859B]">
            A wallet must support EVM custom networks and approve ZEVARYQ Mainnet before it can sign Chain 22028 transactions.
          </p>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          <dl className="space-y-3 rounded-2xl border border-[#1A3A59] bg-[#071522]/60 p-4 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-[#9FB3C8]">Wallet</dt><dd className="font-bold">{web3.walletType || 'External wallet'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#9FB3C8]">Address</dt><dd className="font-mono">{compactAddress(web3.account)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#9FB3C8]">Current chain</dt><dd className="font-bold">{web3.chainId ?? 'Unknown'}</dd></div>
          </dl>

          {accounts.length > 0 && (
            <div className="rounded-2xl border border-[#1A3A59] bg-[#071522]/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="zv-label">Authorized Addresses</p>
                <span className="text-xs font-bold text-[#9FB3C8]">{accounts.length} available</span>
              </div>
              <div className="mt-3 space-y-2">
                {accounts.map((address) => {
                  const active = address.toLowerCase() === String(web3.account || '').toLowerCase();
                  return (
                    <button
                      type="button"
                      key={address}
                      onClick={() => web3?.selectAccount?.(address)}
                      className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-emerald-400/45 bg-emerald-400/8' : 'border-[#1A3A59] bg-[#071522]/70'}`}
                      aria-pressed={active}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 break-all font-mono text-xs text-[#D8E6F3]">{address}</span>
                        <span className={`shrink-0 text-[10px] font-black uppercase ${active ? 'text-emerald-300' : 'text-[#6F859B]'}`}>
                          {active ? 'Active' : 'Use'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!onZevaryq && (
            <button type="button" onClick={() => web3.addZevaryqNetwork()} className="zv-button-primary w-full">
              Add / Switch to ZEVARYQ Mainnet
            </button>
          )}

          {onZevaryq && (
            <a href={ZEVARYQ.explorer} target="_blank" rel="noreferrer" className="zv-button-secondary w-full">
              <ExternalLink className="h-4 w-4" />
              Open ZEVARYQ Explorer
            </a>
          )}

          <button type="button" onClick={web3.disconnectWallet} className="min-h-12 w-full rounded-2xl border border-red-500/40 bg-red-500/10 font-bold text-red-300">
            Disconnect Wallet
          </button>
        </div>
      )}

      {web3?.connectionError && <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{web3.connectionError}</p>}
    </section>
  );
}
