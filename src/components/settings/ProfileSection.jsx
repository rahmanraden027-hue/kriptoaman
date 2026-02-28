import React, { useState } from 'react';
import { Mail, User, Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfileSection({ user, onSave, saving }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    phone: user?.phone || ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(formData);
    setHasChanges(false);
  };

  return (
    <>
      {/* Profile Header */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Editable Information */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>

        <div>
          <label className="text-sm text-slate-400 block mb-2">Full Name</label>
          <Input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="Your full name"
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 block mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Tell us about yourself"
            rows="4"
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 block mb-2">Phone</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+62..."
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <div className="pt-4 border-t border-slate-700">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-400">Email</span>
            <span className="text-white font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-slate-700 pt-3">
            <span className="text-slate-400">Role</span>
            <span className="text-white font-medium capitalize">{user?.role || 'user'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-slate-700 pt-3">
            <span className="text-slate-400">Member Since</span>
            <span className="text-white font-medium">
              {user?.created_date ? new Date(user.created_date).toLocaleDateString('id-ID') : 'N/A'}
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}