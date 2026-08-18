/**
 * Lazy-loaded page registry
 * Semua halaman berat diload on-demand saat user navigate ke sana.
 * Ini memotong initial bundle secara signifikan.
 */
import { lazy } from 'react';

// ── Core pages (loaded eagerly — most visited) ────────────────────────────
export const Home          = lazy(() => import('../../pages/Home'));
export const Market        = lazy(() => import('../../pages/Market'));
export const Wallet        = lazy(() => import('../../pages/Wallet'));
export const Alerts        = lazy(() => import('../../pages/Alerts'));
export const Profile       = lazy(() => import('../../pages/Profile'));

// ── Secondary pages (loaded on demand) ───────────────────────────────────
export const AutoTrading       = lazy(() => import('../../pages/AutoTrading'));
export const DEXSavings        = lazy(() => import('../../pages/DEXSavings'));
export const P2PLending        = lazy(() => import('../../pages/P2PLending'));
export const MarketResearch    = lazy(() => import('../../pages/MarketResearch'));
export const AssetManager      = lazy(() => import('../../pages/AssetManager'));
export const PortfolioOverview = lazy(() => import('../../pages/PortfolioOverview'));
export const TxHistory         = lazy(() => import('../../pages/TxHistory'));
export const Settings          = lazy(() => import('../../pages/Settings'));
export const Support           = lazy(() => import('../../pages/Support'));
export const Edukasi           = lazy(() => import('../../pages/Edukasi'));
export const Premium           = lazy(() => import('../../pages/Premium'));
export const PriceTracker      = lazy(() => import('../../pages/PriceTracker'));
export const TradingAnalytics  = lazy(() => import('../../pages/TradingAnalytics'));

// ── Info / Static pages (smallest, loaded on demand) ─────────────────────
export const AboutUs       = lazy(() => import('../../pages/AboutUs'));
export const Contact       = lazy(() => import('../../pages/Contact'));
export const Disclaimer    = lazy(() => import('../../pages/Disclaimer'));
export const SEOLanding    = lazy(() => import('../../pages/SEOLanding'));

// ── Admin pages (loaded only when admin navigates to them) ────────────────
export const AdminUserBalances    = lazy(() => import('../../pages/AdminUserBalances'));
export const AdminProfitAnalytics = lazy(() => import('../../pages/AdminProfitAnalytics'));
export const AdminPlatformAssets  = lazy(() => import('../../pages/AdminPlatformAssets'));
export const SecureVault          = lazy(() => import('../../pages/SecureVault'));
export const SecurityCenter       = lazy(() => import('../../pages/SecurityCenter'));
export const ServerControl        = lazy(() => import('../../pages/ServerControlModern'));
export const PlatformDocs         = lazy(() => import('../../pages/PlatformDocs'));
export const RegulatoryDocs       = lazy(() => import('../../pages/RegulatoryDocs'));
export const KYC                  = lazy(() => import('../../pages/KYC'));

// ── Heavy feature pages ───────────────────────────────────────────────────
export const Web3Wallet = lazy(() => import('../../pages/Web3Wallet'));