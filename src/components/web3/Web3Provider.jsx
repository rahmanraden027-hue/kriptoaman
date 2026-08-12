import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const Web3Context = createContext(null);

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim()
  || '90e4a891a15a75dadc1cd3a8d1f3f814';
const READ_ONLY_RELEASE = true;

export const SUPPORTED_CHAINS = {
  1:     { name: 'Ethereum', symbol: 'ETH',  rpc: 'https://eth.llamarpc.com',          explorer: 'https://etherscan.io',            color: '#627EEA' },
  56:    { name: 'BNB Chain', symbol: 'BNB',  rpc: 'https://bsc-dataseed.binance.org',   explorer: 'https://bscscan.com',             color: '#F3BA2F' },
  137:   { name: 'Polygon',   symbol: 'MATIC', rpc: 'https://polygon-rpc.com',            explorer: 'https://polygonscan.com',         color: '#8247E5' },
  42161: { name: 'Arbitrum',  symbol: 'ETH',  rpc: 'https://arb1.arbitrum.io/rpc',       explorer: 'https://arbiscan.io',             color: '#28A0F0' },
  8453:  { name: 'Base',      symbol: 'ETH',  rpc: 'https://mainnet.base.org',            explorer: 'https://basescan.org',            color: '#0052FF' },
  10:    { name: 'Optimism',  symbol: 'ETH',  rpc: 'https://mainnet.optimism.io',         explorer: 'https://optimistic.etherscan.io', color: '#FF0420' },
};

// Lazy-load viem only when needed (reduces initial bundle ~600KB)
async function loadViem() {
  const [viemCore, viemChains] = await Promise.all([
    import('viem'),
    import('viem/chains'),
  ]);
  return { ...viemCore, chains: viemChains };
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [connectionError, setConnectionError] = useState('');
  const providerRef = useRef(null);
  const viemRef = useRef(null);
  const walletConnectRef = useRef(null);

  const getViem = useCallback(async () => {
    if (!viemRef.current) viemRef.current = await loadViem();
    return viemRef.current;
  }, []);

  const getPublicClient = useCallback(async (cId) => {
    const viem = await getViem();
    const chain = viem.chains[Object.keys(viem.chains).find(k => viem.chains[k].id === cId)] || viem.chains.mainnet;
    return viem.createPublicClient({ chain, transport: viem.http() });
  }, [getViem]);

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
      const accounts = await selectedProvider.request({ method: options.silent ? 'eth_accounts' : 'eth_requestAccounts' });
      if (!accounts?.length) {
        if (options.silent) return;
        throw new Error('Wallet tidak memberikan akun publik.');
      }
      const chainIdHex = await selectedProvider.request({ method: 'eth_chainId' });
      const cId = parseInt(chainIdHex, 16);
      const chain = Object.values(viem.chains).find(c => c.id === cId) || viem.chains.mainnet;

      const wClient = viem.createWalletClient({ account: accounts[0], chain, transport: viem.custom(selectedProvider) });

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
  }, [getViem, refreshBalance]);

  const getWalletConnectProvider = useCallback(async () => {
    if (walletConnectRef.current) return walletConnectRef.current;
    if (!WALLETCONNECT_PROJECT_ID) {
      throw new Error('WalletConnect belum dikonfigurasi. Tambahkan VITE_WALLETCONNECT_PROJECT_ID.');
    }
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    walletConnectRef.current = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'KriptoAman',
        description: 'Pemantauan alamat aset digital secara read-only',
        url: 'https://kriptoaman.com',
        icons: ['https://kriptoaman.com/icons/kriptoaman-512.png'],
      },
      chains: [1],
      optionalChains: Object.keys(SUPPORTED_CHAINS).map(Number),
      showQrModal: true,
      rpcMap: Object.fromEntries(Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => [id, chain.rpc])),
    });
    return walletConnectRef.current;
  }, []);

  const connectWalletConnect = useCallback(async (options = {}) => {
    setConnecting(true);
    setConnectionError('');
    try {
      const provider = await getWalletConnectProvider();
      if (options.silent && !provider.session) return;
      if (!provider.session) await provider.connect();
      const accounts = provider.accounts?.length
        ? provider.accounts
        : await provider.request({ method: 'eth_accounts' });
      if (!accounts?.length) throw new Error('WalletConnect tidak memberikan akun publik.');
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      const cId = typeof chainIdHex === 'string' ? parseInt(chainIdHex, 16) : Number(chainIdHex);
      const viem = await getViem();
      const chain = Object.values(viem.chains).find((item) => item.id === cId) || viem.chains.mainnet;
      setAccount(accounts[0]);
      setChainId(cId);
      setWalletClient(viem.createWalletClient({ account: accounts[0], chain, transport: viem.custom(provider) }));
      setWalletType('WalletConnect');
      providerRef.current = provider;
      localStorage.setItem('web3_connected', 'walletconnect');
      await refreshBalance(accounts[0], cId);
    } catch (error) {
      if (!options.silent) setConnectionError(error?.message || 'Koneksi WalletConnect gagal atau dibatalkan.');
    } finally {
      setConnecting(false);
    }
  }, [getViem, getWalletConnectProvider, refreshBalance]);

  const disconnectWallet = useCallback(async () => {
    const activeProvider = providerRef.current;
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setWalletType(null);
    setWalletClient(null);
    setConnectionError('');
    providerRef.current = null;
    localStorage.removeItem('web3_connected');
    try {
      if (activeProvider?.session && activeProvider?.disconnect) await activeProvider.disconnect();
    } catch {}
  }, []);

  const switchChain = useCallback(async (targetChainId) => {
    const selectedProvider = providerRef.current || window.ethereum;
    if (!selectedProvider) return;
    try {
      await selectedProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err) {
      if (err.code === 4902 && SUPPORTED_CHAINS[targetChainId]) {
        const chain = SUPPORTED_CHAINS[targetChainId];
        await selectedProvider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 },
            rpcUrls: [chain.rpc],
            blockExplorerUrls: [chain.explorer],
          }],
        });
      }
    }
  }, []);

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
    const handleAccounts = (accounts) => {
      if (accounts.length === 0) disconnectWallet();
      else { setAccount(accounts[0]); refreshBalance(accounts[0], chainId); }
    };
    const handleChain = (chainIdHex) => {
      const cId = parseInt(chainIdHex, 16);
      setChainId(cId);
      refreshBalance(account, cId);
    };
    activeProvider.on('accountsChanged', handleAccounts);
    activeProvider.on('chainChanged', handleChain);
    return () => {
      activeProvider.removeListener('accountsChanged', handleAccounts);
      activeProvider.removeListener('chainChanged', handleChain);
    };
  }, [disconnectWallet, refreshBalance, account, chainId]);

  return (
    <Web3Context.Provider value={{
      account, chainId, balance, connecting, connectionError, walletType, walletClient, availableWallets,
      provider: walletClient, // backward compat alias
      signer: walletClient,   // backward compat alias
      connectWallet, connectWalletConnect, disconnectWallet, switchChain, sendTransaction, signMessage,
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
