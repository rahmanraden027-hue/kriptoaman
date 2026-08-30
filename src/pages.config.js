import { lazy } from 'react';
const __Layout = lazy(() => import('./Layout.jsx'));

const pageModules = import.meta.glob('./pages/*.jsx');

const PAGE_NAMES = [
  'AMLDashboard', 'AboutUs', 'AdminKAMAnalytics', 'AdminKAMBulkRewards', 'AdminKAMRewards', 'AdminKAMSnapshotApproval', 'AdminKAMSnapshotReadiness', 'AdminKYCManagement', 'AdminPlatformAssets',
  'AdminProfitAnalytics', 'AdminUserBalances', 'Alerts', 'AppBuildAnalytics',
  'AssetManager', 'AutoTrading', 'Contact', 'DEXSavings', 'Disclaimer', 'Edukasi',
  'Founder', 'Home', 'IntelligenceHub', 'KAM', 'KAMCampaignNews', 'KAMDeveloper', 'KAMGlobalRoadmap', 'KAMIncidentResponse', 'KAMLaunchReadiness', 'KAMNetwork', 'KAMNetworkDocs', 'KAMTokenomics', 'KYC', 'KYCVerificationPage', 'LandingPage', 'Market', 'MarketResearch',
  'P2PLending', 'PWAValidation', 'PaperTrading', 'PlatformDocs', 'PortfolioOverview', 'Premium',
  'PriceTracker', 'PrivacyPolicy', 'RPCPrivacyPolicy', 'Profile', 'Referral', 'RegulatoryDocs',
  'SEOLanding', 'SecureVault', 'SecurityCenter', 'ServerControl', 'Settings', 'SystemStatus',
  'StoreDeploymentGuide', 'Support', 'TermsOfService', 'TradingAnalytics',
  'TxHistory', 'Wallet', 'Web3Wallet', 'ReadinessCheck', 'AccountDeletion',
];

const PAGE_OVERRIDES = {
  AMLDashboard: 'AMLDashboardModern',
  AdminKYCManagement: 'AdminKYCManagementModern',
  AdminPlatformAssets: 'AdminPlatformAssetsModern',
  AdminProfitAnalytics: 'AdminProfitAnalyticsModern',
  AdminUserBalances: 'AdminUserBalancesModern',
  Alerts: 'NotificationCenterV2',
  Home: 'HomeV3',
  Market: 'MarketWithKAM',
  PaperTrading: 'PaperTradingV3',
  SecurityCenter: 'SecurityCenterV2',
  ServerControl: 'ServerControlModern',
};

function loadPage(name) {
  const moduleName = PAGE_OVERRIDES[name] || name;
  const loader = pageModules[`./pages/${moduleName}.jsx`];
  if (!loader) throw new Error(`Page module not found: ${moduleName}`);
  return lazy(loader);
}

export const PAGES = Object.fromEntries(PAGE_NAMES.map((name) => [name, loadPage(name)]));

export const pagesConfig = {
  mainPage: 'Home',
  Pages: PAGES,
  Layout: __Layout,
};
