import React, { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Provider';
import { Image, RefreshCw, ExternalLink, Grid3X3 } from 'lucide-react';

export default function Web3NFTGallery() {
  const { account, chainId, isConnected } = useWeb3();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNFTs = async () => {
    if (!account) return;
    setLoading(true);
    try {
      // Use Alchemy or OpenSea API for NFT data
      const res = await fetch(
        `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTsForOwner?owner=${account}&withMetadata=true&pageSize=12`
      );
      if (res.ok) {
        const data = await res.json();
        setNfts(data.ownedNfts || []);
      }
    } catch {
      setNfts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (account) fetchNFTs();
  }, [account, chainId]);

  if (!isConnected) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-purple-400" />
          <span className="text-white font-semibold text-sm">NFT Collection</span>
          <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">{nfts.length}</span>
        </div>
        <button onClick={fetchNFTs} className={`text-slate-400 hover:text-white ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && nfts.length === 0 && (
        <div className="text-center py-8">
          <Image className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <div className="text-slate-500 text-sm">Tidak ada NFT ditemukan</div>
          <div className="text-slate-600 text-xs mt-1">NFT di chain {chainId === 1 ? 'Ethereum' : 'lainnya'} akan tampil di sini</div>
        </div>
      )}

      {!loading && nfts.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {nfts.slice(0, 12).map((nft, i) => (
            <a
              key={i}
              href={`https://opensea.io/assets/ethereum/${nft.contract?.address}/${nft.tokenId}`}
              target="_blank" rel="noreferrer"
              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-700 hover:ring-2 hover:ring-purple-500 transition-all"
            >
              {nft.image?.thumbnailUrl || nft.image?.cachedUrl ? (
                <img src={nft.image.thumbnailUrl || nft.image.cachedUrl}
                  alt={nft.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-6 h-6 text-slate-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-1">
                <div className="text-white text-[9px] truncate">{nft.name || `#${nft.tokenId}`}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}