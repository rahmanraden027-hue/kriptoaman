import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, User, Bell, Lock, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import ProfileSection from '../components/settings/ProfileSection';
import PreferencesSection from '../components/settings/PreferencesSection';
import IntegrationsSection from '../components/settings/IntegrationsSection';
import SecuritySection from '../components/settings/SecuritySection';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (profileData) => {
    setSaving(true);
    try {
      await base44.auth.updateMe(profileData);
      setUser({ ...user, ...profileData });
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Lock },
    { id: 'security', label: 'Keamanan', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Wallet')}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-slate-400 text-sm mt-1">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-1 mb-6 flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && user && (
            <ProfileSection user={user} onSave={handleSaveProfile} saving={saving} />
          )}
          {activeTab === 'preferences' && user && (
            <PreferencesSection user={user} onSave={handleSaveProfile} saving={saving} />
          )}
          {activeTab === 'integrations' && user && (
            <IntegrationsSection user={user} />
          )}
          {activeTab === 'security' && (
            <SecuritySection />
          )}
        </div>
      </div>
    </div>
  );
}