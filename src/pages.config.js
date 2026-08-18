import { lazy } from 'react';
const __Layout = lazy(() => import('./Layout.jsx'));

// Vite creates a separate chunk for every page. This keeps admin, trading,
// wallet, analytics, and KYC code out of the public landing-page bundle.
const pageModules = import.meta.glob('./pages/*.jsx');

const PAGE_NAMES = [
  'AMLDashboard', 'AboutUs', 'AdminKYCManagement', 'AdminPlatformAssets',
  'AdminProfitAnalytics', 'AdminUserBalances', 'Alerts', 'AppBuildAnalytics',
  'AssetManager', 'AutoTrading', 'Contact', 'DEXSavings', 'Disclaimer', 'Edukasi',
  'Founder', 'Home', 'KYC', 'KYCVerificationPage', 'LandingPage', 'Market', 'MarketResearch',
  'P2PLending', 'PWAValidation', 'PlatformDocs', 'PortfolioOverview', 'Premium',
  'PriceTracker', 'PrivacyPolicy', 'Profile', 'Referral', 'RegulatoryDocs',
  'SEOLanding', 'SecureVault', 'SecurityCenter', 'ServerControl', 'Settings', 'SystemStatus',
  'StoreDeploymentGuide', 'Support', 'TermsOfService', 'TradingAnalytics',
  'TxHistory', 'Wallet', 'Web3Wallet', 'ReadinessCheck', 'AccountDeletion',
];

const PAGE_OVERRIDES = {
  AMLDashboard: 'AMLDashboardModern',
  AdminKYCManagement: 'AdminKYCManagementModern',
  AdminPlatformAssets: 'AdminPlatformAssetsModern',
  AdminUserBalances: 'AdminUserBalancesModern',
  ServerControl: 'ServerControlModern',
};

function loadPage(name) {
  const moduleName = PAGE_OVERRIDES[name] || name;
  const loader = pageModules[`./pages/${moduleName}.jsx`];
  if (!loader) throw new Error(`Page module not found: ${moduleName}`);
  return lazy(loader);
}

export const PAGES = Object.fromEntries(
  PAGE_NAMES.map((name) => [name, loadPage(name)])
);

export const pagesConfig = {
  mainPage: 'Wallet',
  Pages: PAGES,
  Layout: __Layout,
};
