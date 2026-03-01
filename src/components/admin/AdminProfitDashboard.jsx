import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp, Zap, Wallet } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminProfitDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await base44.functions.invoke('getAdminProfitAnalytics');
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  const dailyData = Object.entries(analytics.dailyProfit).map(([date, profit]) => ({
    date: new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    profit: parseFloat(profit.toFixed(2))
  }));

  const typeData = Object.entries(analytics.byType).map(([type, profit]) => ({
    name: type,
    profit: parseFloat(profit.toFixed(2))
  }));

  const currencyData = Object.entries(analytics.byCurrency).map(([currency, profit]) => ({
    name: currency,
    profit: parseFloat(profit.toFixed(2))
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase">Total Profit</p>
              <p className="text-white text-2xl font-bold">${analytics.totalProfit.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500/40" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-700/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-xs font-semibold uppercase">Transactions</p>
              <p className="text-white text-2xl font-bold">{analytics.totalTransactions}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500/40" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-xs font-semibold uppercase">Avg Fee</p>
              <p className="text-white text-2xl font-bold">${analytics.averagePerTransaction.toFixed(2)}</p>
            </div>
            <Zap className="w-8 h-8 text-purple-500/40" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600/20 to-orange-700/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-xs font-semibold uppercase">Currencies</p>
              <p className="text-white text-2xl font-bold">{Object.keys(analytics.byCurrency).length}</p>
            </div>
            <Wallet className="w-8 h-8 text-orange-500/40" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Profit Trend */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Daily Profit Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94A3B8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94A3B8" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Profit by Type */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Profit by Transaction Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94A3B8" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }} />
              <Bar dataKey="profit" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Currency Distribution */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Profit by Currency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={currencyData} dataKey="profit" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {currencyData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Users */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Top Contributing Users</h3>
          <div className="space-y-2">
            {analytics.topUsers.map((user, idx) => (
              <div key={user.email} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-slate-300 text-sm truncate">{user.email}</span>
                </div>
                <span className="text-green-400 font-semibold text-sm">${user.profit.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}