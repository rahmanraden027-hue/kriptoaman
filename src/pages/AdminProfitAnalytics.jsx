import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AdminProfitDashboard from '../components/admin/AdminProfitDashboard';
import { BarChart3, Lock } from 'lucide-react';

export default function AdminProfitAnalytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-slate-400">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">Profit Analytics</h1>
            <p className="text-slate-400 text-sm">Track admin earnings from transaction fees</p>
          </div>
        </div>

        {/* Dashboard */}
        <AdminProfitDashboard />
      </div>
    </div>
  );
}