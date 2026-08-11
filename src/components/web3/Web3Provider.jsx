import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const Web3Context = createContext(null);

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
  const providerRef = useRef(null);
  const viemRef = useRef(null);

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

  const connectWallet = useCallback(async (selectedWallet = null) => {
    const selectedProvider = selectedWallet?.provider || window.ethereum;
    if (!selectedProvider) {
      alert('MetaMask atau wallet browser tidak ditemukan. Silakan install MetaMask.');
      return;
    }
    setConnecting(true);
    try {
      const viem = await getViem();
      const accounts = await selectedProvider.request({ method: 'eth_requestAccounts' });
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
      // silent
    } finally {
      setConnecting(false);
    }
  }, [getViem, refreshBalance]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setWalletType(null);
    setWalletClient(null);
    localStorage.removeItem('web3_connected');
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
    if (localStorage.getItem('web3_connected') && window.ethereum) {
      connectWallet();
    }
  }, []);

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
      account, chainId, balance, connecting, walletType, walletClient, availableWallets,
      provider: walletClient, // backward compat alias
      signer: walletClient,   // backward compat alias
      connectWallet, disconnectWallet, switchChain, sendTransaction, signMessage,
      refreshBalance: () => refreshBalance(account, chainId),
      isConnected: !!account,
      currentChain: SUPPORTED_CHAINS[chainId] || null,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}