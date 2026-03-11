import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle2, Clock, Eye, Filter, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AMLDashboard() {
  const [user, setUser] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('flagged');
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    fetchUser().then(() => fetchScreenings());
  }, []);

  const fetchUser = async () => {
    const u = await base44.auth.me();
    setUser(u);
    if (u?.role !== 'admin') {
      // Not admin
      return;
    }
  };

  const fetchScreenings = async () => {
    try {
      const data = await base44.asServiceRole.entities.AMLScreening.filter({
        status: { $in: ['flagged', 'pending_review', 'under_investigation'] }
      }, '-created_date', 100);
      setScreenings(data);
      filterScreenings(data, selectedStatus, searchEmail);
    } catch (err) {
      console.error('Error fetching screenings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterScreenings = (data, status, email) => {
    let result = data;
    if (status !== 'all') {
      result = result.filter(s => s.status === status);
    }
    if (email) {
      result = result.filter(s => s.userEmail.toLowerCase().includes(email.toLowerCase()));
    }
    setFiltered(result);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    filterScreenings(screenings, status, searchEmail);
  };

  const handleSearch = (email) => {
    setSearchEmail(email);
    filterScreenings(screenings, selectedStatus, email);
  };

  const handleApprove = async (screeningId) => {
    await base44.asServiceRole.entities.AMLScreening.update(screeningId, {
      status: 'clean',
      adminAction: 'approved',
      reviewedAt: new Date().toISOString()
    });
    fetchScreenings();
  };

  const handleReject = async (screeningId) => {
    await base44.asServiceRole.entities.AMLScreening.update(screeningId, {
      status: 'blocked',
      adminAction: 'rejected',
      reviewedAt: new Date().toISOString()
    });
    fetchScreenings();
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-green-400 bg-green-500/10';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <p className="font-bold">Admin Access Required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20 space-y-6">
      <div>
        <h1 className="text-white font-bold text-2xl mb-1">AML Screening Dashboard</h1>
        <p className="text-slate-400">Monitor & review flagged accounts for fraud & compliance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-xs font-bold uppercase">Critical</p>
          <p className="text-white text-2xl font-bold">{screenings.filter(s => s.riskLevel === 'critical').length}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <p className="text-orange-400 text-xs font-bold uppercase">High</p>
          <p className="text-white text-2xl font-bold">{screenings.filter(s => s.riskLevel === 'high').length}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-yellow-400 text-xs font-bold uppercase">Pending Review</p>
          <p className="text-white text-2xl font-bold">{screenings.filter(s => s.status === 'pending_review').length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase">Total Flagged</p>
          <p className="text-white text-2xl font-bold">{screenings.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {['flagged', 'pending_review', 'under_investigation', 'all'].map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Search className="w-4 h-4 text-slate-500 absolute ml-3 mt-3" />
          <Input
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>

      {/* Screening Records */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-slate-300">No flagged accounts in this category</p>
          </div>
        ) : (
          filtered.map(screening => (
            <div key={screening.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-1">{screening.userEmail}</p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskColor(screening.riskLevel)}`}>
                      Risk {screening.riskScore}/100 ({screening.riskLevel.toUpperCase()})
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      screening.status === 'flagged' ? 'bg-red-500/20 text-red-400' :
                      screening.status === 'pending_review' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {screening.status.toUpperCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <Eye className="w-5 h-5 text-slate-400" />
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-slate-900/50 rounded-lg p-3">
                <div>
                  <p className="text-slate-400">Amount</p>
                  <p className="text-white font-bold">${screening.transactionAmount?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Transaction</p>
                  <p className="text-white font-mono text-[11px]">{screening.flaggedTransaction?.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-slate-400">Screened</p>
                  <p className="text-white">{new Date(screening.lastScreenedAt).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-slate-400">24h Txs</p>
                  <p className="text-white">{screening.transactionHistory24h?.length || 0} txs</p>
                </div>
              </div>

              {/* Risk Indicators */}
              {screening.indicators?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-slate-300 text-xs font-bold">Risk Indicators:</p>
                  <div className="space-y-1">
                    {screening.indicators.map((ind, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs bg-slate-900/30 p-2 rounded">
                        <div>
                          <p className="text-slate-300 font-semibold">{ind.type.toUpperCase().replace(/_/g, ' ')}</p>
                          <p className="text-slate-400">{ind.description}</p>
                        </div>
                        <span className="text-orange-400 font-bold">+{ind.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {screening.status === 'flagged' && (
                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <Button
                    onClick={() => handleApprove(screening.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                  >
                    ✓ Approve & Release
                  </Button>
                  <Button
                    onClick={() => handleReject(screening.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-xs h-8"
                  >
                    ✕ Block & Reject
                  </Button>
                </div>
              )}

              {screening.adminAction !== 'none' && (
                <div className="bg-slate-900/50 p-2 rounded text-xs text-slate-300">
                  <p className="font-semibold capitalize">{screening.adminAction} by admin</p>
                  {screening.adminNote && <p>{screening.adminNote}</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}