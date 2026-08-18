import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  User,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import GitHubSecurityReview from '../components/admin/GitHubSecurityReview';

export default function AdminUserBalances() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [kycUpdating, setKycUpdating] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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

  const userBalances = useMemo(() => users.map((account) => {
    const userTrades = liveTrades.filter((trade) => trade.created_by === account.email);
    const userStrategies = strategies.filter((strategy) => strategy.created_by === account.email);

    const portfolioValue = userTrades.reduce((sum, trade) => {
      if (trade.status !== 'open') return sum;
      return sum + ((trade.currentPrice || 0) * (trade.quantity || 0));
    }, 0);

    const realizedPL = userTrades.reduce((sum, trade) => (
      trade.status === 'closed' ? sum + (trade.realizedPL || 0) : sum
    ), 0);

    const unrealizedPL = userTrades.reduce((sum, trade) => (
      trade.status === 'open' ? sum + (trade.unrealizedPL || 0) : sum
    ), 0);

    return {
      ...account,
      portfolioValue,
      realizedPL,
      unrealizedPL,
      totalBalance: portfolioValue + realizedPL + unrealizedPL,
      openTrades: userTrades.filter((trade) => trade.status === 'open').length,
      strategies: userStrategies.length,
      activeStrategies: userStrategies.filter((strategy) => strategy.isActive).length,
    };
  }), [users, liveTrades, strategies]);

  const sortedUsers = useMemo(
    () => [...userBalances].sort((a, b) => b.totalBalance - a.totalBalance),
    [userBalances],
  );

  const pendingKYC = users.filter((account) => account.kycStatus === 'pending');
  const totalPortfolioValue = sortedUsers.reduce((sum, account) => sum + account.portfolioValue, 0);
  const totalRealizedPL = sortedUsers.reduce((sum, account) => sum + account.realizedPL, 0);

  const handleKYCUpdate = async (targetUser, newStatus) => {
    setKycUpdating(targetUser.id);
    try {
      await base44.asServiceRole.entities.User.update(targetUser.id, { kycStatus: newStatus });
      const kycPayload = {
        event: { type: 'update', entity_name: 'User', entity_id: targetUser.id },
        data: {
          email: targetUser.email,
          full_name: targetUser.full_name,
          kycStatus: newStatus,
          role: targetUser.role,
        },
        old_data: { kycStatus: targetUser.kycStatus || 'pending' },
      };
      await Promise.all([
        base44.functions.invoke('sendKYCStatusEmail', kycPayload),
        base44.functions.invoke('syncKYCToNotion', kycPayload),
      ]);
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    } finally {
      setKycUpdating(null);
    }
  };

  const handleExportToSheets = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const res = await base44.functions.invoke('exportKYCToSheets', {});
      setExportResult(res.data);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-lg font-bold text-red-400">Akses Ditolak</h2>
          </div>
          <p className="text-slate-300">Hanya sesi admin terverifikasi yang dapat mengakses data pengguna.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-8 h-8 text-sky-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin · User Balances</h1>
            </div>
            <p className="text-slate-400 text-sm">Data nyata dari akun, aktivitas trading, strategi, dan status KYC yang tersedia pada sistem.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportToSheets}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {exporting ? 'Mengekspor...' : 'Export ke Google Sheets'}
            </button>
            {exportResult?.spreadsheetUrl && (
              <a
                href={exportResult.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Spreadsheet ({exportResult.totalExported || 0})
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Pengguna terdaftar" value={users.length.toLocaleString('id-ID')} icon={Users} />
          <StatCard label="KYC menunggu review" value={pendingKYC.length.toLocaleString('id-ID')} icon={Clock} tone="warning" />
          <StatCard label="Portfolio terpantau" value={`$${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} icon={Wallet} tone="positive" />
          <StatCard label="Realized P&L" value={`$${totalRealizedPL.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} icon={User} tone="info" />
        </div>

        <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40 bg-slate-900/80">
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">User</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Portfolio</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Realized P&L</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Unrealized P&L</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Total</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Trades</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Strategies</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">KYC</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((account) => (
                  <tr key={account.id} className="border-b border-slate-700/20 hover:bg-sky-500/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold">{account.full_name || 'Pengguna'}</p>
                      <p className="text-xs text-slate-500">{account.email}</p>
                    </td>
                    <MoneyCell value={account.portfolioValue} />
                    <MoneyCell value={account.realizedPL} signed />
                    <MoneyCell value={account.unrealizedPL} signed />
                    <td className="px-4 py-3 text-right text-white font-bold">${account.totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center"><Badge>{account.openTrades}</Badge></td>
                    <td className="px-4 py-3 text-center"><Badge>{account.activeStrategies}/{account.strategies}</Badge></td>
                    <td className="px-4 py-3 text-center">
                      <KycControl account={account} updating={kycUpdating === account.id} onUpdate={handleKYCUpdate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sortedUsers.length === 0 && (
          <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/30">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Belum ada data pengguna yang tersedia.</p>
          </div>
        )}

        <GitHubSecurityReview />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'text-white border-sky-500/15',
    warning: 'text-amber-300 border-amber-500/20',
    positive: 'text-emerald-300 border-emerald-500/20',
    info: 'text-sky-300 border-sky-500/20',
  };
  return (
    <div className={`bg-slate-800/60 border rounded-2xl p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{label}</p>
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <p className={`text-2xl font-bold ${tone === 'default' ? 'text-white' : tones[tone].split(' ')[0]}`}>{value}</p>
    </div>
  );
}

function Badge({ children }) {
  return <span className="inline-flex min-w-8 justify-center px-2 py-1 rounded-lg bg-sky-500/10 text-sky-300 text-xs font-semibold">{children}</span>;
}

function MoneyCell({ value, signed = false }) {
  const color = !signed ? 'text-white' : value >= 0 ? 'text-emerald-400' : 'text-red-400';
  return (
    <td className={`px-4 py-3 text-right font-semibold ${color}`}>
      ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
    </td>
  );
}

function KycControl({ account, updating, onUpdate }) {
  if (updating) return <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />;

  if (account.kycStatus === 'approved') {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </span>
        <button onClick={() => onUpdate(account, 'rejected')} title="Tolak KYC" className="p-1 rounded hover:bg-red-500/20 text-red-400">
          <XCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (account.kycStatus === 'pending') {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pending
        </span>
        <button onClick={() => onUpdate(account, 'approved')} title="Approve KYC" className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onUpdate(account, 'rejected')} title="Tolak KYC" className="p-1 rounded hover:bg-red-500/20 text-red-400">
          <XCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (account.kycStatus === 'rejected') {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
        <button onClick={() => onUpdate(account, 'approved')} title="Approve KYC" className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return <span className="text-slate-600 text-xs">—</span>;
}
