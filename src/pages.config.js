/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AboutUs from './pages/AboutUs';
import AdminPlatformAssets from './pages/AdminPlatformAssets';
import AdminProfitAnalytics from './pages/AdminProfitAnalytics';
import AdminUserBalances from './pages/AdminUserBalances';
import Alerts from './pages/Alerts';
import AssetManager from './pages/AssetManager';
import AutoTrading from './pages/AutoTrading';
import Contact from './pages/Contact';
import DEXSavings from './pages/DEXSavings';
import Disclaimer from './pages/Disclaimer';
import Edukasi from './pages/Edukasi';
import Home from './pages/Home';
import Market from './pages/Market';
import PWAValidation from './pages/PWAValidation';
import PortfolioOverview from './pages/PortfolioOverview';
import PriceTracker from './pages/PriceTracker';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Support from './pages/Support';
import TermsOfService from './pages/TermsOfService';
import TradingAnalytics from './pages/TradingAnalytics';
import TxHistory from './pages/TxHistory';
import Wallet from './pages/Wallet';
import PlatformDocs from './pages/PlatformDocs';
import LandingPage from './pages/LandingPage';
import P2PLending from './pages/P2PLending';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutUs": AboutUs,
    "AdminPlatformAssets": AdminPlatformAssets,
    "AdminProfitAnalytics": AdminProfitAnalytics,
    "AdminUserBalances": AdminUserBalances,
    "Alerts": Alerts,
    "AssetManager": AssetManager,
    "AutoTrading": AutoTrading,
    "Contact": Contact,
    "DEXSavings": DEXSavings,
    "Disclaimer": Disclaimer,
    "Edukasi": Edukasi,
    "Home": Home,
    "Market": Market,
    "PWAValidation": PWAValidation,
    "PortfolioOverview": PortfolioOverview,
    "PriceTracker": PriceTracker,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "Settings": Settings,
    "Support": Support,
    "TermsOfService": TermsOfService,
    "TradingAnalytics": TradingAnalytics,
    "TxHistory": TxHistory,
    "Wallet": Wallet,
    "PlatformDocs": PlatformDocs,
    "LandingPage": LandingPage,
    "P2PLending": P2PLending,
}

export const pagesConfig = {
    mainPage: "Wallet",
    Pages: PAGES,
    Layout: __Layout,
};