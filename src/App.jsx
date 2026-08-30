import { Toaster } from "@/components/ui/toaster"
import { lazy, Suspense } from 'react'
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
import KriptoAmanGlobalLanding from './pages/KriptoAmanGlobalLanding';
import EnglishLanding from './pages/EnglishLanding';
import LegalCorporateInformation from './pages/LegalCorporateInformation';
import Founder from './pages/Founder';
import CompanyFacts from './pages/CompanyFacts';
import Research from './pages/Research';
import KAMResearchPaper from './pages/KAMResearchPaper';
import AdminRoute from '@/components/security/AdminRoute';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PrimaryBottomNav from '@/components/mobile/PrimaryBottomNav';
import NativeConnectivityBanner from '@/components/mobile/NativeConnectivityBanner';
import { LanguageProvider } from '@/lib/LanguageContext';
const FeatureUpdateBroadcast=lazy(()=>import('./pages/FeatureUpdateBroadcast')); const AMLAssistant=lazy(()=>import('./pages/AMLAssistant')); const BigQueryKYCReports=lazy(()=>import('./pages/BigQueryKYCReports')); const Services=lazy(()=>import('./pages/Services')); const SystemStatus=lazy(()=>import('./pages/SystemStatus')); const MultiChainWallet=lazy(()=>import('./pages/MultiChainWallet')); const SecurityHub=lazy(()=>import('./pages/SecurityHub'));
const {Pages,Layout,mainPage}=pagesConfig; const mainPageKey=mainPage??Object.keys(Pages)[0]; const MainPage=mainPageKey?Pages[mainPageKey]:<></>; const DashboardPage=Pages.Home??MainPage;
const ADMIN_PAGE_KEYS=new Set(['AdminKAMAnalytics','AdminKAMBulkRewards','AdminKAMRewards','AdminKAMSnapshotApproval','AdminKAMSnapshotReadiness','AdminKYCManagement','AdminPlatformAssets','AdminProfitAnalytics','AdminUserBalances','ServerControl','BigQueryKYCReports','RegulatoryDocs','AppBuildAnalytics','AssetManager','SecureVault','AMLDashboard','SecurityCenter','KAMIncidentResponse','FeatureUpdateBroadcast']);
const STORE_RESTRICTED_PAGE_KEYS=new Set(['AutoTrading','DEXSavings','P2PLending','TradingAnalytics']);
const StoreAvailabilityNotice=()=> <div className="ka-bg min-h-screen flex items-center justify-center px-5 text-white"><div className="ka-surface max-w-md p-6 text-center"><h1 className="text-xl font-bold">Fitur sedang dipersiapkan</h1><p className="mt-2 text-sm text-slate-400">Fitur transaksi ini belum tersedia pada versi publik.</p><a href="/dashboard" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3">Kembali ke Dashboard</a></div></div>;
const PublicMarketWithNav=({Page})=><div className="min-h-screen"><Page/><PrimaryBottomNav currentPageName="Market"/></div>;
const PublicKAMWithDocument=({Page})=><div className="min-h-screen bg-slate-950"><Page/></div>;
const PUBLIC_PAGE_KEYS=new Set(['AboutUs','Edukasi','Contact','Disclaimer','PrivacyPolicy','RPCPrivacyPolicy','TermsOfService','AccountDeletion','Market','KAM','KAMCampaignNews','KAMDeveloper','KAMGlobalRoadmap','KAMLaunchReadiness','KAMNetwork','KAMNetworkDocs','KAMTokenomics']);
const LayoutWrapper=({children,currentPageName})=>Layout?<Layout currentPageName={currentPageName}>{children}</Layout>:<>{children}</>;
const AuthenticatedApp=()=>{const {isLoadingAuth,isLoadingPublicSettings,authError}=useAuth(); if(isLoadingPublicSettings||isLoadingAuth)return <div className="fixed inset-0 flex items-center justify-center">Loading…</div>; if(authError&&authError.type==='user_not_registered')return <UserNotRegisteredError/>; return <Suspense fallback={<div className="fixed inset-0 bg-slate-950"/>}><Routes>
<Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="/reset-password" element={<ResetPassword/>}/><Route path="/" element={<KriptoAmanGlobalLanding/>}/><Route path="/en" element={<EnglishLanding/>}/><Route path="/KriptoAmanGlobalLanding" element={<KriptoAmanGlobalLanding/>}/><Route path="/LegalCorporateInformation" element={<LegalCorporateInformation/>}/><Route path="/founder" element={<Founder/>}/><Route path="/company" element={<CompanyFacts/>}/><Route path="/research" element={<Research/>}/><Route path="/research/kam-mainnet-architecture" element={<KAMResearchPaper/>}/><Route path="/SystemStatus" element={<SystemStatus/>}/>
{Object.entries(Pages).map(([path,Page])=>{if(!PUBLIC_PAGE_KEYS.has(path))return null; const element=path==='Market'?<PublicMarketWithNav Page={Page}/>:path==='KAM'?<PublicKAMWithDocument Page={Page}/>:<Page/>; const routePath=path==='KAMCampaignNews'?'/news/kam-campaign-2026':`/${path}`; return <Route key={path} path={routePath} element={element}/>})}
<Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace/>}/>}><Route path="/dashboard" element={<LayoutWrapper currentPageName="Home"><DashboardPage/></LayoutWrapper>}/>{Object.entries(Pages).map(([path,Page])=>{if(PUBLIC_PAGE_KEYS.has(path))return null; const wrapped=<LayoutWrapper currentPageName={path}>{STORE_RESTRICTED_PAGE_KEYS.has(path)?<StoreAvailabilityNotice/>:<Page/>}</LayoutWrapper>; return <Route key={path} path={`/${path}`} element={ADMIN_PAGE_KEYS.has(path)?<AdminRoute>{wrapped}</AdminRoute>:wrapped}/>})}<Route path="/FeatureUpdateBroadcast" element={<AdminRoute><FeatureUpdateBroadcast/></AdminRoute>}/><Route path="/AMLAssistant" element={<AMLAssistant/>}/><Route path="/Services" element={<Services/>}/><Route path="/MultiChainWallet" element={<MultiChainWallet/>}/><Route path="/SecurityHub" element={<SecurityHub/>}/><Route path="/BigQueryKYCReports" element={<AdminRoute><BigQueryKYCReports/></AdminRoute>}/></Route><Route path="*" element={<PageNotFound/>}/></Routes></Suspense>};
function App(){return <LanguageProvider><AuthProvider><QueryClientProvider client={queryClientInstance}><Router><NavigationTracker/><NativeConnectivityBanner/><AppErrorBoundary><AuthenticatedApp/><PWAInstallPrompt/></AppErrorBoundary></Router><Toaster/></QueryClientProvider></AuthProvider></LanguageProvider>}
export default App
