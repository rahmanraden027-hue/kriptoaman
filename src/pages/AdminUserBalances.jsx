import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Wallet, TrendingUp, AlertCircle, Loader2, FileSpreadsheet, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AdminUserBalances() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [kycUpdating, setKycUpdating] = useState(null);
  const queryClient = useQueryClient();

  const handleKYCUpdate = async (targetUser, newStatus) => {
    setKycUpdating(targetUser.id);
    await base44.asServiceRole.entities.User.update(targetUser.id, { kycStatus: newStatus });
    // Trigger email via backend function
    const kycPayload = {
      event: { type: 'update', entity_name: 'User', entity_id: targetUser.id },
      data: { email: targetUser.email, full_name: targetUser.full_name, kycStatus: newStatus, role: targetUser.role },
      old_data: { kycStatus: targetUser.kycStatus || 'pending' }
    };
    await Promise.all([
      base44.functions.invoke('sendKYCStatusEmail', kycPayload),
      base44.functions.invoke('syncKYCToNotion', kycPayload),
    ]);
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    setKycUpdating(null);
  };

  const handleExportToSheets = async () => {
    setExporting(true);
    setExportResult(null);
    const res = await base44.functions.invoke('exportKYCToSheets', {});
    setExporting(false);
    setExportResult(res.data);
  };

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
      if (!u || u.role !== 'admin') {
        setLoading(false);
      }
    });
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: liveTrades = [] } = useQuery({
    queryKey: ['allLiveTrades'],
    queryFn: () => base44.asServiceRole.entities.LivePaperTrade.list(),
    enabled: user?.role === 'admin',
    refetchInterval: 10000,
  });

  const { data: strategies = [] } = useQuery({
    queryKey: ['allStrategies'],
    queryFn: () => base44.asServiceRole.entities.AutoTradingStrategy.list(),
    enabled: user?.role === 'admin',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-lg font-bold text-red-400">Akses Ditolak</h2>
          </div>
          <p className="text-slate-300">Hanya admin yang dapat mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  // Calculate user balances
  const userBalances = users.map(u => {
    const userTrades = liveTrades.filter(t => t.created_by === u.email);
    const userStrategies = strategies.filter(s => s.created_by === u.email);

    const totalPortfolioValue = userTrades.reduce((sum, trade) => {
      if (trade.status === 'open') {
        return sum + (trade.currentPrice * trade.quantity || 0);
      }
      return sum;
    }, 0);

    const totalRealizedPL = userTrades.reduce((sum, trade) => {
      if (trade.status === 'closed') {
        return sum + (trade.realizedPL || 0);
      }
      return sum;
    }, 0);

    const totalUnrealizedPL = userTrades.reduce((sum, trade) => {
      if (trade.status === 'open') {
        return sum + (trade.unrealizedPL || 0);
      }
      return sum;
    }, 0);

    return {
      ...u,
      portfolioValue: totalPortfolioValue,
      realizedPL: totalRealizedPL,
      unrealizedPL: totalUnrealizedPL,
      totalBalance: totalPortfolioValue + totalRealizedPL + totalUnrealizedPL,
      openTrades: userTrades.filter(t => t.status === 'open').length,
      strategies: userStrategies.length,
      activeStrategies: userStrategies.filter(s => s.isActive).length,
    };
  });

  const sortedUsers = [...userBalances].sort((a, b) => b.totalBalance - a.totalBalance);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Admin - User Balances</h1>
          </div>
          <p className="text-slate-400">Overview saldo dan aktivitas trading semua user</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportToSheets}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {exporting ? 'Mengekspor...' : 'Export ke Google Sheets'}
          </button>
          {exportResult?.spreadsheetUrl && (
            <a
              href={exportResult.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-green-400 rounded-lg text-sm font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Spreadsheet ({exportResult.totalExported} data)
            </a>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-green-400">
              ${sortedUsers.reduce((sum, u) => sum + u.portfolioValue, 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Total Realized P&L</p>
            <p className="text-3xl font-bold text-blue-400">
              ${sortedUsers.reduce((sum, u) => sum + u.realizedPL, 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40 bg-slate-900/80">
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">User</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Portfolio</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Realized P&L</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Unrealized P&L</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Total Balance</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Trades</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Strategies</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">KYC</th>
                  </tr>
              </thead>
              <tbody>
                {sortedUsers.map(u => (
                  <tr key={u.id} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-semibold">{u.full_name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      ${u.portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${u.realizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${u.realizedPL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${u.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${u.unrealizedPL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-bold">
                      ${u.totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-semibold">
                        {u.openTrades}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-semibold">
                        {u.activeStrategies}/{u.strategies}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {kycUpdating === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
                      ) : u.kycStatus === 'approved' ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                          <button onClick={() => handleKYCUpdate(u, 'rejected')} title="Tolak KYC"
                            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : u.kycStatus === 'pending' ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                          <button onClick={() => handleKYCUpdate(u, 'approved')} title="Approve KYC"
                            className="p-1 rounded hover:bg-green-500/20 text-green-400 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleKYCUpdate(u, 'rejected')} title="Tolak KYC"
                            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : u.kycStatus === 'rejected' ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                          <button onClick={() => handleKYCUpdate(u, 'approved')} title="Approve KYC"
                            className="p-1 rounded hover:bg-green-500/20 text-green-400 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sortedUsers.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Tidak ada data user</p>
          </div>
        )}
      </div>
    </div>
  );
}