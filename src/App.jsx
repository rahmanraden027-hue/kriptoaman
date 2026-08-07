import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import FeatureUpdateBroadcast from './pages/FeatureUpdateBroadcast';
import AMLAssistant from './pages/AMLAssistant';
import BigQueryKYCReports from './pages/BigQueryKYCReports';
import KriptoAmanGlobalLanding from './pages/KriptoAmanGlobalLanding';
import Services from './pages/Services';
import SystemStatus from './pages/SystemStatus';
import MultiChainWallet from './pages/MultiChainWallet';
import SecurityHub from './pages/SecurityHub';
import AdminRoute from '@/components/security/AdminRoute';
import AppErrorBoundary from '@/components/AppErrorBoundary';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Halaman yang hanya boleh diakses admin (dilindungi di level route)
const ADMIN_PAGE_KEYS = new Set([
  'AdminKYCManagement', 'AdminPlatformAssets', 'AdminProfitAnalytics', 'AdminUserBalances',
  'ServerControl', 'BigQueryKYCReports', 'RegulatoryDocs', 'AppBuildAnalytics',
  'AssetManager', 'SecureVault', 'AMLDashboard', 'SecurityCenter',
  'FeatureUpdateBroadcast',
]);

// Halaman publik statis — dapat diakses tanpa autentikasi (paket gratis)
const PUBLIC_PAGE_KEYS = new Set([
  'Home', 'AboutUs', 'Edukasi', 'Contact', 'Disclaimer', 'PrivacyPolicy', 'TermsOfService',
  'PlatformDocs',
]);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only surface the "user not registered" error here; auth_required is now
  // handled by ProtectedRoute (redirects to /login).
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public pages — accessible without authentication (paket gratis) */}
      {Object.entries(Pages).map(([path, Page]) => {
        if (!PUBLIC_PAGE_KEYS.has(path)) return null;
        return (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        );
      })}

      {/* Protected app routes — gated by ProtectedRoute */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => {
          if (PUBLIC_PAGE_KEYS.has(path)) return null;
          const wrapped = (
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          );
          return (
            <Route
              key={path}
              path={`/${path}`}
              element={ADMIN_PAGE_KEYS.has(path) ? <AdminRoute>{wrapped}</AdminRoute> : wrapped}
            />
          );
        })}
        <Route path="/FeatureUpdateBroadcast" element={
          <AdminRoute>
            <LayoutWrapper currentPageName="FeatureUpdateBroadcast">
              <FeatureUpdateBroadcast />
            </LayoutWrapper>
          </AdminRoute>
        } />
        <Route path="/AMLAssistant" element={
          <LayoutWrapper currentPageName="AMLAssistant">
            <AMLAssistant />
          </LayoutWrapper>
        } />
        <Route path="/Services" element={
          <LayoutWrapper currentPageName="Services">
            <Services />
          </LayoutWrapper>
        } />
        <Route path="/SystemStatus" element={
          <LayoutWrapper currentPageName="SystemStatus">
            <SystemStatus />
          </LayoutWrapper>
        } />
        <Route path="/MultiChainWallet" element={
          <LayoutWrapper currentPageName="MultiChainWallet">
            <MultiChainWallet />
          </LayoutWrapper>
        } />
        <Route path="/SecurityHub" element={
          <LayoutWrapper currentPageName="SecurityHub">
            <SecurityHub />
          </LayoutWrapper>
        } />
        <Route path="/BigQueryKYCReports" element={
          <AdminRoute>
            <LayoutWrapper currentPageName="BigQueryKYCReports">
              <BigQueryKYCReports />
            </LayoutWrapper>
          </AdminRoute>
        } />
        {/* Preview-only public landing — full screen, no app chrome */}
        <Route path="/KriptoAmanGlobalLanding" element={<KriptoAmanGlobalLanding />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AppErrorBoundary>
            <AuthenticatedApp />
          </AppErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App