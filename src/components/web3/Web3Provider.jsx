import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const Web3Context = createContext(null);

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim()
  || '90e4a891a15a75dadc1cd3a8d1f3f814';
const READ_ONLY_RELEASE = import.meta.env.VITE_ZEVARYQ_TRANSACTIONS_ENABLED !== 'true';

export const SUPPORTED_CHAINS = {
  1:     { name: 'Ethereum', symbol: 'ETH',  rpc: 'https://eth.drpc.org',          explorer: 'https://etherscan.io',            color: '#627EEA' },
  56:    { name: 'BNB Chain', symbol: 'BNB',  rpc: 'https://bsc-dataseed.binance.org',   explorer: 'https://bscscan.com',             color: '#F3BA2F' },
  137:   { name: 'Polygon',   symbol: 'MATIC', rpc: 'https://polygon-rpc.com',            explorer: 'https://polygonscan.com',         color: '#8247E5' },
  42161: { name: 'Arbitrum',  symbol: 'ETH',  rpc: 'https://arb1.arbitrum.io/rpc',       explorer: 'https://arbiscan.io',             color: '#28A0F0' },
  8453:  { name: 'Base',      symbol: 'ETH',  rpc: 'https://mainnet.base.org',            explorer: 'https://basescan.org',            color: '#0052FF' },
  10:    { name: 'Optimism',  symbol: 'ETH',  rpc: 'https://mainnet.optimism.io',         explorer: 'https://optimistic.etherscan.io', color: '#FF0420' },
  22028: { name: 'ZEVARYQ Mainnet', symbol: 'ZVQ', rpc: 'https://rpc.kriptoaman.com', explorer: 'https://explorer.kriptoaman.com', color: '#D8AA45', icon: 'https://kriptoaman.com/brand/zevaryq-mark.svg' },
};

// Lazy-load viem only when needed (reduces initial bundle ~600KB)
async function loadViem() {
  const [viemCore, viemChains] = await Promise.all([
    import('viem'),
    import('viem/chains'),
  ]);
  return { ...viemCore, chains: viemChains };
}

function chainParams(chainId) {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain) return null;
  return {
    chainId: `0x${Number(chainId).toString(16)}`,
    chainName: chain.name,
    nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 },
    rpcUrls: [chain.rpc],
    blockExplorerUrls: [chain.explorer],
    ...(chain.icon ? { iconUrls: [chain.icon] } : {}),
  };
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [connectionError, setConnectionError] = useState('');
  const [walletConnectUri, setWalletConnectUri] = useState('');
  const providerRef = useRef(null);
  const viemRef = useRef(null);
  const walletConnectRef = useRef(null);

  const getViem = useCallback(async () => {
    if (!viemRef.current) viemRef.current = await loadViem();
    return viemRef.current;
  }, []);

  const resolveChain = useCallback(async (cId) => {
    const viem = await getViem();
    const builtIn = Object.values(viem.chains).find((item) => item.id === cId);
    const configured = SUPPORTED_CHAINS[cId];
    return builtIn || (configured ? viem.defineChain({
      id: cId,
      name: configured.name,
      nativeCurrency: { name: configured.symbol, symbol: configured.symbol, decimals: 18 },
      rpcUrls: { default: { http: [configured.rpc] } },
      blockExplorers: { default: { name: configured.name + ' Explorer', url: configured.explorer } },
    }) : viem.chains.mainnet);
  }, [getViem]);

  const getPublicClient = useCallback(async (cId) => {
    const viem = await getViem();
    const configured = SUPPORTED_CHAINS[cId];
    const chain = await resolveChain(cId);
    return viem.createPublicClient({ chain, transport: viem.http(configured?.rpc) });
  }, [getViem, resolveChain]);

  const refreshBalance = useCallback(async (addr, cId) => {
    if (!addr || !cId) return;
    try {
      const viem = await getViem();
      const publicClient = await getPublicClient(cId);
      const bal = await publicClient.getBalance({ address: addr });
      setBalance(viem.formatEther(bal));
    } catch {}
  }, [getViem, getPublicClient]);

  const connectWallet = useCallback(async (selectedWallet = null, options = {}) => {
    const selectedProvider = selectedWallet?.provider || window.ethereum;
    if (!selectedProvider) {
      alert('MetaMask atau wallet browser tidak ditemukan. Silakan install MetaMask.');
      return;
    }
    setConnecting(true);
    setConnectionError('');
    try {
      const viem = await getViem();
      const requestedAccounts = await selectedProvider.request({ method: options.silent ? 'eth_accounts' : 'eth_requestAccounts' });
      const accounts = Array.from(new Set((requestedAccounts || []).map((item) => String(item)).filter(Boolean)));
      if (!accounts.length) {
        if (options.silent) return;
        throw new Error('Wallet tidak memberikan akun publik.');
      }
      const chainIdHex = await selectedProvider.request({ method: 'eth_chainId' });
      const cId = parseInt(chainIdHex, 16);
      const chain = await resolveChain(cId);
      const wClient = viem.createWalletClient({ account: accounts[0], chain, transport: viem.custom(selectedProvider) });

      setAccounts(accounts);
      setAccount(accounts[0]);
      setChainId(cId);
      setWalletClient(wClient);
      providerRef.current = selectedProvider;
      setWalletType(selectedWallet?.info?.name || (selectedProvider.isMetaMask ? 'MetaMask' : 'Injected Wallet'));
      localStorage.setItem('web3_connected', '1');
      await refreshBalance(accounts[0], cId);
    } catch (e) {
      if (!options.silent) setConnectionError(e?.message || 'Koneksi wallet gagal atau dibatalkan.');
    } finally {
      setConnecting(false);
    }
  }, [getViem, refreshBalance, resolveChain]);

  const getWalletConnectProvider = useCallback(async () => {
    if (walletConnectRef.current) return walletConnectRef.current;
    if (!WALLETCONNECT_PROJECT_ID) {
      throw new Error('WalletConnect belum dikonfigurasi. Tambahkan VITE_WALLETCONNECT_PROJECT_ID.');
    }
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    walletConnectRef.current = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'ZEVARYQ Wallet',
        description: 'ZEVARYQ Mainnet wallet connection for the KriptoAman ecosystem',
        url: 'https://kriptoaman.com/wallet-app',
        icons: ['https://kriptoaman.com/brand/zevaryq-wallet-premium-icon.webp'],
      },
      chains: [1],
      optionalChains: [22028, ...Object.keys(SUPPORTED_CHAINS).map(Number).filter((id) => id !== 22028 && id !== 1)],
      showQrModal: true,
      rpcMap: Object.fromEntries(Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => [id, chain.rpc])),
    });
    return walletConnectRef.current;
  }, []);

  const connectWalletConnect = useCallback(async (options = {}) => {
    setConnecting(true);
    setConnectionError('');
    if (!options.silent) setWalletConnectUri('');
    try {
      const provider = await getWalletConnectProvider();
      if (options.silent && !provider.session) return;
      if (!provider.session) {
        const handleUri = (uri) => {
          const normalized = String(uri || '').trim();
          if (!normalized) return;
          setWalletConnectUri(normalized);
          if (options.mobileWallet === 'metamask') {
            const deepLink = `https://metamask.app.link/wc?uri=${encodeURIComponent(normalized)}`;
            window.location.assign(deepLink);
          }
        };
        provider.on?.('display_uri', handleUri);
        try {
          await provider.connect();
        } finally {
          provider.removeListener?.('display_uri', handleUri);
        }
      }
      const requestedAccounts = provider.accounts?.length
        ? provider.accounts
        : await provider.request({ method: 'eth_accounts' });
      const accounts = Array.from(new Set((requestedAccounts || []).map((item) => String(item)).filter(Boolean)));
      if (!accounts.length) throw new Error('WalletConnect tidak memberikan akun publik.');
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      const cId = typeof chainIdHex === 'string' ? parseInt(chainIdHex, 16) : Number(chainIdHex);
      const viem = await getViem();
      const chain = await resolveChain(cId);
      setAccounts(accounts);
      setAccount(accounts[0]);
      setChainId(cId);
      setWalletClient(viem.createWalletClient({ account: accounts[0], chain, transport: viem.custom(provider) }));
      setWalletType('WalletConnect');
      providerRef.current = provider;
      localStorage.setItem('web3_connected', 'walletconnect');
      setWalletConnectUri('');
      await refreshBalance(accounts[0], cId);
    } catch (error) {
      if (!options.silent) setConnectionError(error?.message || 'Koneksi WalletConnect gagal atau dibatalkan.');
    } finally {
      setConnecting(false);
    }
  }, [getViem, getWalletConnectProvider, refreshBalance, resolveChain]);

  const disconnectWallet = useCallback(async () => {
    const activeProvider = providerRef.current;
    setAccount(null);
    setAccounts([]);
    setChainId(null);
    setBalance('0');
    setWalletType(null);
    setWalletClient(null);
    setConnectionError('');
    setWalletConnectUri('');
    providerRef.current = null;
    localStorage.removeItem('web3_connected');
    try {
      if (activeProvider?.session && activeProvider?.disconnect) await activeProvider.disconnect();
    } catch {}
  }, []);

  const switchChain = useCallback(async (targetChainId) => {
    const selectedProvider = providerRef.current || window.ethereum;
    if (!selectedProvider) throw new Error('Wallet provider tidak tersedia.');
    setConnectionError('');
    const params = chainParams(targetChainId);
    if (!params) throw new Error('Jaringan yang diminta belum dikonfigurasi.');
    try {
      await selectedProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: params.chainId }],
      });
      return true;
    } catch (err) {
      const code = Number(err?.code);
      if (code === 4001) {
        setConnectionError('Permintaan pergantian jaringan dibatalkan di wallet.');
        return false;
      }
      if (code === 4902 || code === -32603 || /unknown chain|not added|unsupported chain/i.test(err?.message || '')) {
        try {
          await selectedProvider.request({
            method: 'wallet_addEthereumChain',
            params: [params],
          });
          await selectedProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: params.chainId }],
          });
          return true;
        } catch (addError) {
          setConnectionError(addError?.message || 'Wallet ini tidak mendukung penambahan ZEVARYQ Mainnet.');
          return false;
        }
      }
      setConnectionError(err?.message || 'Wallet tidak dapat berpindah ke jaringan yang diminta.');
      return false;
    }
  }, []);

  const selectAccount = useCallback(async (nextAddress) => {
    const match = accounts.find((item) => item.toLowerCase() === String(nextAddress || '').toLowerCase());
    if (!match) throw new Error('Address is not authorized by the connected wallet.');
    const activeProvider = providerRef.current || window.ethereum;
    if (!activeProvider) throw new Error('Wallet provider tidak tersedia.');
    const viem = await getViem();
    const cId = chainId || Number(await activeProvider.request({ method: 'eth_chainId' }));
    const chain = await resolveChain(cId);
    setAccount(match);
    setWalletClient(viem.createWalletClient({ account: match, chain, transport: viem.custom(activeProvider) }));
    await refreshBalance(match, cId);
    return match;
  }, [accounts, chainId, getViem, refreshBalance, resolveChain]);

  const sendTransaction = useCallback(async ({ to, value }) => {
    if (READ_ONLY_RELEASE) throw new Error('Transaksi dinonaktifkan pada rilis publik KriptoAman.');
    if (!walletClient || !account) throw new Error('Wallet tidak terhubung');
    const { parseEther } = await getViem();
    const hash = await walletClient.sendTransaction({
      account,
      to,
      value: parseEther(value.toString()),
    });
    return hash;
  }, [walletClient, account, getViem]);

  const signMessage = useCallback(async (message) => {
    if (READ_ONLY_RELEASE) throw new Error('Penandatanganan dinonaktifkan pada rilis publik KriptoAman.');
    if (!walletClient || !account) throw new Error('Wallet tidak terhubung');
    return await walletClient.signMessage({ account, message });
  }, [walletClient, account]);

  // Discover all installed EVM wallets through EIP-6963.
  useEffect(() => {
    const announced = new Map();
    const handleProvider = (event) => {
      const detail = event.detail;
      if (!detail?.provider || !detail?.info?.uuid) return;
      announced.set(detail.info.uuid, detail);
      setAvailableWallets(Array.from(announced.values()));
    };
    window.addEventListener('eip6963:announceProvider', handleProvider);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    if (window.ethereum) {
      setAvailableWallets((current) => current.length ? current : [{
        info: { uuid: 'legacy-injected', name: window.ethereum.isMetaMask ? 'MetaMask' : 'Browser Wallet', icon: '' },
        provider: window.ethereum,
      }]);
    }
    return () => window.removeEventListener('eip6963:announceProvider', handleProvider);
  }, []);

  // Auto-reconnect
  useEffect(() => {
    const previous = localStorage.getItem('web3_connected');
    if (previous === 'walletconnect') {
      connectWalletConnect({ silent: true });
    } else if (previous && window.ethereum) {
      connectWallet(null, { silent: true });
    }
  }, [connectWallet, connectWalletConnect]);

  // Listen to account/chain changes
  useEffect(() => {
    const activeProvider = providerRef.current || window.ethereum;
    if (!activeProvider) return;
    const handleAccounts = async (nextAccounts) => {
      const normalized = Array.from(new Set((nextAccounts || []).map((item) => String(item)).filter(Boolean)));
      if (normalized.length === 0) {
        disconnectWallet();
        return;
      }
      setAccounts(normalized);
      const preserved = account && normalized.some((item) => item.toLowerCase() === account.toLowerCase());
      const nextAccount = preserved ? account : normalized[0];
      setAccount(nextAccount);
      try {
        const viem = await getViem();
        const cId = chainId || Number(await activeProvider.request({ method: 'eth_chainId' }));
        const chain = await resolveChain(cId);
        setWalletClient(viem.createWalletClient({ account: nextAccount, chain, transport: viem.custom(activeProvider) }));
        refreshBalance(nextAccount, cId);
      } catch {
        refreshBalance(nextAccount, chainId);
      }
    };
    const handleChain = async (chainIdHex) => {
      const cId = typeof chainIdHex === 'string' ? parseInt(chainIdHex, 16) : Number(chainIdHex);
      setChainId(cId);
      try {
        const viem = await getViem();
        const chain = await resolveChain(cId);
        if (account) setWalletClient(viem.createWalletClient({ account, chain, transport: viem.custom(activeProvider) }));
      } catch {}
      refreshBalance(account, cId);
    };
    activeProvider.on('accountsChanged', handleAccounts);
    activeProvider.on('chainChanged', handleChain);
    return () => {
      activeProvider.removeListener('accountsChanged', handleAccounts);
      activeProvider.removeListener('chainChanged', handleChain);
    };
  }, [disconnectWallet, refreshBalance, account, chainId, getViem, resolveChain]);

  return (
    <Web3Context.Provider value={{
      account, accounts, chainId, balance, connecting, connectionError, walletType, walletClient, availableWallets, walletConnectUri,
      provider: walletClient, // backward compat alias
      signer: walletClient,   // backward compat alias
      connectWallet, connectWalletConnect, disconnectWallet, selectAccount, switchChain, addZevaryqNetwork: () => switchChain(22028), sendTransaction, signMessage,
      openMetaMaskPairing: () => walletConnectUri && window.location.assign(`https://metamask.app.link/wc?uri=${encodeURIComponent(walletConnectUri)}`),
      refreshBalance: () => refreshBalance(account, chainId),
      isConnected: !!account,
      walletConnectConfigured: !!WALLETCONNECT_PROJECT_ID,
      readOnlyRelease: READ_ONLY_RELEASE,
      currentChain: SUPPORTED_CHAINS[chainId] || null,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}
