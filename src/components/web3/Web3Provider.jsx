import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext(null);

export const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', symbol: 'ETH', rpc: 'https://eth.llamarpc.com', explorer: 'https://etherscan.io', color: '#627EEA' },
  56: { name: 'BNB Chain', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com', color: '#F3BA2F' },
  137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com', color: '#8247E5' },
  42161: { name: 'Arbitrum', symbol: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io', color: '#28A0F0' },
  8453: { name: 'Base', symbol: 'ETH', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org', color: '#0052FF' },
  10: { name: 'Optimism', symbol: 'ETH', rpc: 'https://mainnet.optimism.io', explorer: 'https://optimistic.etherscan.io', color: '#FF0420' },
};

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'metamask' | 'injected'

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask atau wallet browser tidak ditemukan. Silakan install MetaMask.');
      return;
    }
    setConnecting(true);
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      const accounts = await p.send('eth_requestAccounts', []);
      const s = await p.getSigner();
      const network = await p.getNetwork();
      const bal = await p.getBalance(accounts[0]);

      setProvider(p);
      setSigner(s);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setBalance(ethers.formatEther(bal));
      setWalletType(window.ethereum.isMetaMask ? 'metamask' : 'injected');

      localStorage.setItem('web3_connected', '1');
    } catch (e) {
      console.error('Connect wallet error:', e);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance('0');
    setWalletType(null);
    localStorage.removeItem('web3_connected');
  }, []);

  const switchChain = useCallback(async (targetChainId) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err) {
      if (err.code === 4902 && SUPPORTED_CHAINS[targetChainId]) {
        const chain = SUPPORTED_CHAINS[targetChainId];
        await window.ethereum.request({
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

  const sendTransaction = useCallback(async ({ to, value, data = '0x' }) => {
    if (!signer) throw new Error('Wallet tidak terhubung');
    const tx = await signer.sendTransaction({ to, value: ethers.parseEther(value.toString()), data });
    return tx;
  }, [signer]);

  const signMessage = useCallback(async (message) => {
    if (!signer) throw new Error('Wallet tidak terhubung');
    return await signer.signMessage(message);
  }, [signer]);

  const refreshBalance = useCallback(async () => {
    if (!provider || !account) return;
    const bal = await provider.getBalance(account);
    setBalance(ethers.formatEther(bal));
  }, [provider, account]);

  // Auto-reconnect
  useEffect(() => {
    if (localStorage.getItem('web3_connected') && window.ethereum) {
      connectWallet();
    }
  }, []);

  // Listen to account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts) => {
      if (accounts.length === 0) disconnectWallet();
      else { setAccount(accounts[0]); refreshBalance(); }
    };
    const handleChain = (chainIdHex) => setChainId(parseInt(chainIdHex, 16));

    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts);
      window.ethereum.removeListener('chainChanged', handleChain);
    };
  }, [disconnectWallet, refreshBalance]);

  return (
    <Web3Context.Provider value={{
      account, chainId, provider, signer, balance, connecting, walletType,
      connectWallet, disconnectWallet, switchChain, sendTransaction, signMessage, refreshBalance,
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