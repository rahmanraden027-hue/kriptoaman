import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  User, Bell, Shield, Loader2, Activity,
  LogOut, Star, Calendar, Hash, Wallet, BookMarked, Globe, SlidersHorizontal, Settings2
} from 'lucide-react';
import ProfileSection from '../components/settings/ProfileSection';
import SecuritySection from '../components/settings/SecuritySection';
import ActivityHistory from '../components/settings/ActivityHistory';
import AdminBalanceEditor from '../components/wallet/AdminBalanceEditor';
import UserPreferencesEnhanced from '../components/settings/UserPreferencesEnhanced';
import PaymentAddressBook from '../components/settings/PaymentAddressBook';
import NetworkStatusPanel from '../components/network/NetworkStatusPanel';
import DeleteAccount from '../components/mobile/DeleteAccount';
import { useLanguage } from '../lib/LanguageContext';

const TAB_CONFIG = [
  { id: 'profile', icon: User },
  { id: 'preferences', icon: Bell },
  { id: 'activity', icon: Activity },
  { id: 'security', icon: Shield },
  { id: 'addresses', icon: BookMarked },
  { id: 'balance', icon: Wallet, adminOnly: true },
  { id: 'network', icon: Globe },
];

const COPY = {
  id: {
    fallbackUser: 'Pengguna',
    eyebrow: 'KRIPTOAMAN ACCOUNT CONTROL',
    sessionReady: 'SESI TERSEDIA',
    logout: 'Keluar',
    memberSince: 'Member sejak',
    userId: 'User ID',
    tier: 'Tier',
    standard: 'Standard',
    modules: 'MODUL KONTROL',
    saved: 'Perubahan berhasil disimpan.',
    tabs: {
      profile: 'Profil', preferences: 'Preferensi', activity: 'Aktivitas', security: 'Keamanan',
      addresses: 'Alamat', balance: 'Saldo', network: 'Jaringan',
    },
  },
  en: {
    fallbackUser: 'User',
    eyebrow: 'KRIPTOAMAN ACCOUNT CONTROL',
    sessionReady: 'SESSION AVAILABLE',
    logout: 'Sign out',
    memberSince: 'Member since',
    userId: 'User ID',
    tier: 'Tier',
    standard: 'Standard',
    modules: 'CONTROL MODULES',
    saved: 'Changes saved successfully.',
    tabs: {
      profile: 'Profile', preferences: 'Preferences', activity: 'Activity', security: 'Security',
      addresses: 'Addresses', balance: 'Balance', network: 'Network',
    },
  },
};

export default function Settings() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const locale = language === 'en' ? 'en-US' : 'id-ID';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && user?.role !== 'admin' && activeTab === 'balance') setActiveTab('profile');
  }, [activeTab, loading, user?.role]);

  const handleSaveProfile = async (profileData) => {
    setSaving(true);
    try {
      await base44.auth.updateMe(profileData);
      setUser(current => ({ ...current, ...profileData }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  const memberSince = user?.created_date
    ? new Date(user.created_date).toLocaleDateString(locale, { year: 'numeric', month: 'long' })
    : '—';

  const visibleTabs = TAB_CONFIG.filter(tab => !tab.adminOnly || user?.role === 'admin');

  if (loading) {
    return (
      <div className="ka-bg min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <span className="sr-only">{language === 'en' ? 'Loading account settings' : 'Memuat pengaturan akun'}</span>
      </div>
    );
  }

  return (
    <div className="ka-bg ka-workspace-page min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-7" aria-labelledby="account-control-title">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-sky-500/25 bg-gradient-to-br from-sky-500/30 to-indigo-500/20 text-2xl font-black shadow-[0_18px_50px_rgba(14,165,233,.15)]">
                {initials}
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#07111d] bg-emerald-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="ka-command-kicker"><Settings2 className="h-3.5 w-3.5" /> {text.eyebrow}</p>
                <h1 id="account-control-title" className="mt-2 truncate text-2xl font-black sm:text-3xl">{user?.full_name || text.fallbackUser}</h1>
                <p className="mt-1 truncate text-sm text-slate-400">{user?.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[9px] font-bold uppercase text-sky-300">{user?.role || 'user'}</span>
                  <span className="ka-command-status">{text.sessionReady}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => base44.auth.logout()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-xs font-bold text-red-300 transition hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
            >
              <LogOut className="h-4 w-4" /> {text.logout}
            </button>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
            {[
              [Calendar, text.memberSince, memberSince],
              [Hash, text.userId, `#${user?.id?.slice(-5) || '—'}`],
              [Star, text.tier, text.standard],
            ].map(([Icon, label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/30 p-3 text-center">
                <Icon className="mx-auto h-4 w-4 text-sky-400" />
                <p className="mt-2 truncate text-xs font-black">{value}</p>
                <p className="mt-1 truncate text-[9px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-12">
          <aside className="lg:col-span-3" aria-label={text.modules}>
            <div className="ka-command-panel p-3 lg:sticky lg:top-24">
              <p className="ka-command-kicker px-2 py-2"><SlidersHorizontal className="h-3.5 w-3.5" /> {text.modules}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1" role="tablist" aria-orientation="vertical">
                {visibleTabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls={`settings-panel-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 ${active ? 'border-sky-500/30 bg-sky-500/12 text-sky-300' : 'border-transparent text-slate-500 hover:border-slate-700 hover:bg-white/[0.03] hover:text-white'}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{text.tabs[tab.id]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-4">
            {saved && <div role="status" aria-live="polite" className="ka-command-panel border-emerald-500/25 px-4 py-3 text-sm font-bold text-emerald-300">{text.saved}</div>}
            <section id={`settings-panel-${activeTab}`} role="tabpanel" className="ka-command-panel p-4 sm:p-5">
              {activeTab === 'profile' && user && <ProfileSection user={user} onSave={handleSaveProfile} saving={saving} />}
              {activeTab === 'preferences' && user && <UserPreferencesEnhanced user={user} onSave={handleSaveProfile} saving={saving} />}
              {activeTab === 'activity' && <ActivityHistory />}
              {activeTab === 'security' && <SecuritySection />}
              {activeTab === 'addresses' && <PaymentAddressBook />}
              {activeTab === 'balance' && user?.role === 'admin' && <AdminBalanceEditor />}
              {activeTab === 'network' && <NetworkStatusPanel />}
            </section>
            {(activeTab === 'profile' || activeTab === 'security') && <DeleteAccount />}
          </main>
        </div>
      </div>
    </div>
  );
}
