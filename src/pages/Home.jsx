import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import useLivePrices from '../components/market/useLivePrices';
import { Shield, ChevronRight } from 'lucide-react';
import HomePortfolioSummary from '../components/home/HomePortfolioSummary';
import HomeQuickActions from '../components/home/HomeQuickActions';
import HomeLiveMarket from '../components/home/HomeLiveMarket';
import HomeTrendingCoins from '../components/home/HomeTrendingCoins';
import HomeMarketOverview from '../components/home/HomeMarketOverview';
import HomeNews from '../components/home/HomeNews';
import HomeLearningCenter from '../components/home/HomeLearningCenter';

export default function Home() {
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const { prices, idrRate, connected } = useLivePrices();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setKycStatus(u?.kycStatus);
    }).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  return (
    <div className="ka-bg min-h-screen text-white pb-28">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Greeting */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="ka-muted text-xs">{greeting()},</p>
            <h1 className="text-xl font-extrabold tracking-tight">{user?.full_name?.split(' ')[0] || 'Pengguna'}</h1>
          </div>
        </div>

        {/* KYC status banner (compact) */}
        {kycStatus !== 'approved' && (
          <Link to={createPageUrl('KYC')}
            className="flex items-center justify-between ka-surface ka-surface-hover p-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-yellow-300 text-xs font-semibold">
                {kycStatus === 'pending' ? 'KYC dalam proses review' : 'Lengkapi KYC untuk akses penuh'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-yellow-400 shrink-0" />
          </Link>
        )}

        {/* 1. Portfolio Summary */}
        <HomePortfolioSummary user={user} prices={prices} idrRate={idrRate} />

        {/* 2. Quick Actions */}
        <HomeQuickActions />

        {/* 3. Live Market */}
        <HomeLiveMarket prices={prices} idrRate={idrRate} connected={connected} />

        {/* 4. Trending Coins */}
        <HomeTrendingCoins prices={prices} />

        {/* 5. Market Overview */}
        <HomeMarketOverview />

        {/* 6. News */}
        <HomeNews />

        {/* 7. Learning Center */}
        <HomeLearningCenter />

        {/* Footer */}
        <div className="text-center pt-2 pb-1">
          <p className="ka-muted text-[10px] leading-relaxed">
            KriptoAman beroperasi sesuai regulasi Bappebti &amp; OJK Indonesia.<br />
            Transaksi dijamin dengan enkripsi SSL 256-bit. © 2025 KriptoAman
          </p>
        </div>
      </div>
    </div>
  );
}