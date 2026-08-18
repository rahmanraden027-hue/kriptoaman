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

const TABS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'preferences', label: 'Preferensi', icon: Bell },
  { id: 'activity', label: 'Aktivitas', icon: Activity },
  { id: 'security', label: 'Keamanan', icon: Shield },
  { id: 'addresses', label: 'Alamat', icon: BookMarked },
  { id: 'balance', label: 'Saldo', icon: Wallet, adminOnly: true },
  { id: 'network', label: 'Network', icon: Globe },
];

export default function Settings() {
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
    ? new Date(user.created_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    : '—';

  const visibleTabs = TABS.filter(tab => !tab.adminOnly || user?.role === 'admin');

  if (loading) {
    return <div className="ka-bg min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-sky-400" /></div>;
  }

  return (
    <div className="ka-bg ka-workspace-page min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-sky-500/25 bg-gradient-to-br from-sky-500/30 to-indigo-500/20 text-2xl font-black shadow-[0_18px_50px_rgba(14,165,233,.15)]">
                {initials}
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#07111d] bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="ka-command-kicker"><Settings2 className="h-3.5 w-3.5" /> KRIPTOAMAN ACCOUNT CONTROL</p>
                <h1 className="mt-2 truncate text-2xl font-black sm:text-3xl">{user?.full_name || 'Pengguna'}</h1>
                <p className="mt-1 truncate text-sm text-slate-400">{user?.email}</p>
                <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[9px] font-bold uppercase text-sky-300">{user?.role || 'user'}</span><span className="ka-command-status">ACCOUNT ACTIVE</span></div>
              </div>
            </div>
            <button onClick={() => base44.auth.logout()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-xs font-bold text-red-300 transition hover:bg-red-500/15"><LogOut className="h-4 w-4" /> Logout</button>
          </div>
          <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
            {[
              [Calendar, 'Member Sejak', memberSince],
              [Hash, 'User ID', `#${user?.id?.slice(-5) || '—'}`],
              [Star, 'Tier', 'Standard'],
            ].map(([Icon, label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/30 p-3 text-center"><Icon className="mx-auto h-4 w-4 text-sky-400" /><p className="mt-2 truncate text-xs font-black">{value}</p><p className="mt-1 truncate text-[9px] text-slate-500">{label}</p></div>)}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="ka-command-panel p-3 lg:sticky lg:top-24">
              <p className="ka-command-kicker px-2 py-2"><SlidersHorizontal className="h-3.5 w-3.5" /> CONTROL MODULES</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
                {visibleTabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-[11px] font-bold transition ${active ? 'border-sky-500/30 bg-sky-500/12 text-sky-300' : 'border-transparent text-slate-500 hover:border-slate-700 hover:bg-white/[0.03] hover:text-white'}`}><Icon className="h-4 w-4 shrink-0" /><span className="truncate">{tab.label}</span></button>;
                })}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-4">
            {saved && <div className="ka-command-panel border-emerald-500/25 px-4 py-3 text-sm font-bold text-emerald-300">Perubahan berhasil disimpan.</div>}
            <section className="ka-command-panel p-4 sm:p-5">
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
