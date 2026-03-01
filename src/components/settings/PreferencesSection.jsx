import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, BellOff, Save, Loader2 } from 'lucide-react';
import { Analytics } from '../analytics/mixpanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PreferencesSection({ user, onSave, saving }) {
  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem('theme') || 'dark',
    emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
    priceAlerts: localStorage.getItem('priceAlerts') !== 'false',
    tradeNotifications: localStorage.getItem('tradeNotifications') !== 'false',
    newsUpdates: localStorage.getItem('newsUpdates') !== 'false',
    dashboardRefresh: localStorage.getItem('dashboardRefresh') || '30'
  });

  const handleToggle = (field) => {
    setPreferences(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSelectChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    Object.entries(preferences).forEach(([key, value]) => {
      localStorage.setItem(key, String(value));
    });
    // Also save to user profile
    onSave({ preferences });
  };

  const notificationOptions = [
    { id: 'emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email', icon: Bell },
    { id: 'priceAlerts', label: 'Price Alerts', description: 'Get notified when prices hit targets', icon: Bell },
    { id: 'tradeNotifications', label: 'Trade Notifications', description: 'Alerts for open/closed trades', icon: Bell },
    { id: 'newsUpdates', label: 'News Updates', description: 'Latest market news and analysis', icon: Bell }
  ];

  return (
    <>
      {/* Theme Settings */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'light', label: 'Light', icon: Sun }
          ].map(theme => {
            const Icon = theme.icon;
            const isActive = preferences.theme === theme.value;
            return (
              <button
                key={theme.value}
                onClick={() => handleSelectChange('theme', theme.value)}
                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  isActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className={isActive ? 'text-white font-semibold' : 'text-slate-400'}>{theme.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
        <div className="space-y-3">
          {notificationOptions.map(option => {
            const Icon = option.icon;
            const isEnabled = preferences[option.id];
            return (
              <div
                key={option.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  isEnabled
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-slate-900/40 border-slate-700/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${isEnabled ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div>
                    <p className={`font-medium ${isEnabled ? 'text-white' : 'text-slate-400'}`}>{option.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggle(option.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Dashboard Settings */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Dashboard</h3>
        <div>
          <label className="text-sm text-slate-400 block mb-3">Auto-Refresh Interval</label>
          <div className="grid grid-cols-4 gap-2">
            {['10', '30', '60', '120'].map(interval => (
              <button
                key={interval}
                onClick={() => handleSelectChange('dashboardRefresh', interval)}
                className={`py-2 px-3 rounded-lg font-medium transition-all ${
                  preferences.dashboardRefresh === interval
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {interval}s
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">How often dashboard data refreshes automatically</p>
        </div>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-6 text-base"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </>
        )}
      </Button>
    </>
  );
}