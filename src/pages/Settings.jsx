import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  User, Bell, Lock, Shield, Loader2, Activity,
  Camera, Mail, Phone, FileText, ChevronRight,
  LogOut, Star, Calendar, Hash, Wallet, BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileSection from '../components/settings/ProfileSection';
import PreferencesSection from '../components/settings/PreferencesSection';
import SecuritySection from '../components/settings/SecuritySection';
import ActivityHistory from '../components/settings/ActivityHistory';
import AdminBalanceEditor from '../components/wallet/AdminBalanceEditor';
import UserPreferencesEnhanced from '../components/settings/UserPreferencesEnhanced';
import PaymentAddressBook from '../components/settings/PaymentAddressBook';

const TABS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'preferences', label: 'Preferensi', icon: Bell },
  { id: 'activity', label: 'Aktivitas', icon: Activity },
  { id: 'security', label: 'Keamanan', icon: Shield },
  { id: 'addresses', label: 'Alamat', icon: BookMarked },
  { id: 'balance', label: 'Saldo', icon: Wallet },
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

  const handleSaveProfile = async (profileData) => {
    setSaving(true);
    try {
      await base44.auth.updateMe(profileData);
      setUser(u => ({ ...u, ...profileData }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  const memberSince = user?.created_date
    ? new Date(user.created_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    : '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Hero Profile Card */}
        <div className="relative rounded-3xl overflow-hidden mb-6">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30" />
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

          <div className="relative p-6">
            {/* Avatar & basic info */}
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 text-white text-2xl font-bold">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{user?.full_name || 'Pengguna'}</h1>
                <p className="text-slate-400 text-sm truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-semibold capitalize">
                    {user?.role || 'user'}
                  </span>
                  <span className="text-[11px] bg-green-500/15 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                    ● Aktif
                  </span>
                </div>
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Calendar, label: 'Member Sejak', value: memberSince },
                { icon: Hash, label: 'User ID', value: `#${user?.id?.slice(-5) || '—'}` },
                { icon: Star, label: 'Tier', value: 'Standard' },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5 text-center">
                  <stat.icon className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
                  <p className="text-white text-xs font-bold truncate">{stat.value}</p>
                  <p className="text-slate-600 text-[10px] truncate">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="grid grid-cols-3 gap-1 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-1 mb-2">
          {TABS.slice(0, 3).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-1 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-1 mb-5">
          {TABS.slice(3).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Saved banner */}
        {saved && (
          <div className="mb-4 flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-xl px-4 py-2.5 text-green-400 text-sm font-semibold">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Perubahan berhasil disimpan!
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'profile' && user && (
          <ProfileSection user={user} onSave={handleSaveProfile} saving={saving} />
        )}
        {activeTab === 'preferences' && user && (
          <UserPreferencesEnhanced user={user} onSave={handleSaveProfile} saving={saving} />
        )}
        {activeTab === 'activity' && (
          <ActivityHistory />
        )}
        {activeTab === 'security' && (
          <SecuritySection />
        )}
        {activeTab === 'balance' && user && (
          <AdminBalanceEditor />
        )}
        </div>
        </div>
        );
}