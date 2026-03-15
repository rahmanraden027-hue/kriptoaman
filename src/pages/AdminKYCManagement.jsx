import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Image as ImageIcon, FileText, Loader2, Filter, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminKYCManagement() {
  const [user, setUser] = useState(null);
  const [kycRecords, setKycRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchUser().then(() => fetchKycRecords());
  }, []);

  const fetchUser = async () => {
    const u = await base44.auth.me();
    setUser(u);
  };

  const fetchKycRecords = async () => {
    try {
      const data = await base44.asServiceRole.entities.KYCVerification.list('-created_date', 200);
      setKycRecords(data);
      filterRecords(data, 'pending', '');
    } catch (err) {
      console.error('Error fetching KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = (data, status, email) => {
    let result = data;
    if (status !== 'all') {
      result = result.filter(k => k.status === status);
    }
    if (email) {
      result = result.filter(k => k.userEmail.toLowerCase().includes(email.toLowerCase()));
    }
    setFiltered(result);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    filterRecords(kycRecords, status, searchEmail);
  };

  const handleSearch = (email) => {
    setSearchEmail(email);
    filterRecords(kycRecords, selectedStatus, email);
  };

  const handleApprove = async (kycId) => {
    try {
      const kyc = kycRecords.find(k => k.id === kycId);
      const withdrawalLimit = kyc.verificationLevel === 'advanced' ? 100000 : 50000;
      const verifiedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Update KYC entity status
      await base44.asServiceRole.entities.KYCVerification.update(kycId, {
        status: 'verified',
        verifiedAt,
        expiresAt,
        withdrawalLimit
      });

      // 2. Update user kycStatus
      const users = await base44.asServiceRole.entities.User.filter({ email: kyc.userEmail }, null, 1);
      if (users && users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          kycStatus: 'approved',
          kycVerifiedAt: verifiedAt,
          kycLevel: kyc.verificationLevel,
          kycWithdrawalLimit: withdrawalLimit,
        });
      }

      // 3. Inisialisasi UserBalance IDR jika belum ada (virtual account IDR)
      const existingIDR = await base44.asServiceRole.entities.UserBalance.filter({
        userEmail: kyc.userEmail, coin: 'IDR'
      });
      if (existingIDR.length === 0) {
        await base44.asServiceRole.entities.UserBalance.create({
          userEmail: kyc.userEmail,
          coin: 'IDR',
          amount: 0,
        });
      }

      // 4. Pastikan saldo USDT juga ada
      const existingUSDT = await base44.asServiceRole.entities.UserBalance.filter({
        userEmail: kyc.userEmail, coin: 'USDT'
      });
      if (existingUSDT.length === 0) {
        await base44.asServiceRole.entities.UserBalance.create({
          userEmail: kyc.userEmail,
          coin: 'USDT',
          amount: 0,
        });
      }

      // 5. Send approval email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: kyc.userEmail,
        subject: '✅ KYC Verification Approved — KriptoAman',
        body: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:32px;border-radius:16px">
          <h2 style="color:#10b981">✅ KYC Anda Telah Diverifikasi!</h2>
          <p>Halo <strong>${kyc.fullName}</strong>,</p>
          <p>Selamat! Identitas Anda telah berhasil diverifikasi oleh tim KriptoAman.</p>
          <div style="background:#1e293b;border:1px solid #10b981;border-radius:12px;padding:16px;margin:16px 0">
            <p><strong>Level Verifikasi:</strong> ${kyc.verificationLevel?.toUpperCase()}</p>
            <p><strong>Limit Penarikan Harian:</strong> $${withdrawalLimit.toLocaleString()}</p>
            <p><strong>Berlaku Hingga:</strong> ${new Date(expiresAt).toLocaleDateString('id-ID')}</p>
          </div>
          <p>✅ Virtual account IDR Anda telah aktif</p>
          <p>✅ Withdrawal kripto kini tersedia</p>
          <p>✅ Akses fitur P2P Lending dan deposit bank</p>
          <p style="color:#94a3b8;margin-top:24px">Salam,<br/>Tim KriptoAman</p>
        </div>
        `
      });

      fetchKycRecords();
      setReviewingId(null);
    } catch (err) {
      alert('Error approving KYC: ' + err.message);
    }
  };

  const handleReject = async (kycId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide rejection reason');
      return;
    }

    try {
      const kyc = kycRecords.find(k => k.id === kycId);
      
      await base44.asServiceRole.entities.KYCVerification.update(kycId, {
        status: 'rejected',
        rejectionReason
      });

      // Update user kycStatus
      const users = await base44.asServiceRole.entities.User.filter({ email: kyc.userEmail }, null, 1);
      if (users && users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, { kycStatus: 'rejected' });
      }

      // Send rejection email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: kyc.userEmail,
        subject: '❌ KYC Verification Rejected — Please Resubmit',
        body: `
          <h2>KYC Verification Rejected</h2>
          <p>Hi ${kyc.fullName},</p>
          <p>Your KYC verification was rejected for the following reason:</p>
          <p><strong>"${rejectionReason}"</strong></p>
          <p>Please address the issue and resubmit your KYC documentation.</p>
          <p>Best regards,<br/>KriptoAman Team</p>
        `
      });

      fetchKycRecords();
      setReviewingId(null);
      setRejectionReason('');
    } catch (err) {
      alert('Error rejecting KYC: ' + err.message);
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

  const statusCounts = {
    pending: kycRecords.filter(k => k.status === 'pending').length,
    verified: kycRecords.filter(k => k.status === 'verified').length,
    rejected: kycRecords.filter(k => k.status === 'rejected').length,
    expired: kycRecords.filter(k => k.status === 'expired').length,
  };

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20 space-y-6">
      <div>
        <h1 className="text-white font-bold text-2xl mb-1">KYC Management</h1>
        <p className="text-slate-400">Review and approve user KYC verification requests</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-yellow-400 text-xs font-bold uppercase">Pending</p>
          <p className="text-white text-3xl font-bold">{statusCounts.pending}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 text-xs font-bold uppercase">Verified</p>
          <p className="text-white text-3xl font-bold">{statusCounts.verified}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-xs font-bold uppercase">Rejected</p>
          <p className="text-white text-3xl font-bold">{statusCounts.rejected}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase">Total</p>
          <p className="text-white text-3xl font-bold">{kycRecords.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {['pending', 'verified', 'rejected', 'expired', 'all'].map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {status.toUpperCase()} ({status === 'all' ? kycRecords.length : statusCounts[status]})
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Search className="w-4 h-4 text-slate-500 absolute ml-3 mt-3" />
          <Input
            placeholder="Search by email or name..."
            value={searchEmail}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>

      {/* KYC Records Table */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-300">No KYC records found</p>
          </div>
        ) : (
          filtered.map(kyc => (
            <div key={kyc.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{kyc.fullName}</p>
                    <p className="text-slate-400 text-xs">{kyc.userEmail}</p>
                    <div className="flex gap-2 items-center mt-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        kyc.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                        kyc.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        kyc.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {kyc.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        kyc.verificationLevel === 'advanced' ? 'bg-blue-500/20 text-blue-400' :
                        kyc.verificationLevel === 'intermediate' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {kyc.verificationLevel}
                      </span>
                      {kyc.riskScore && (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          kyc.riskScore > 50 ? 'bg-red-500/20 text-red-400' :
                          kyc.riskScore > 25 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          Risk: {kyc.riskScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedKyc(selectedKyc?.id === kyc.id ? null : kyc)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                  >
                    {selectedKyc?.id === kyc.id ? 'Hide' : 'View'}
                  </button>
                </div>

                {/* KYC Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-slate-900/50 rounded p-3">
                  <div>
                    <p className="text-slate-400">ID Type</p>
                    <p className="text-white font-bold uppercase">{kyc.idType}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Date of Birth</p>
                    <p className="text-white">{new Date(kyc.dateOfBirth).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Location</p>
                    <p className="text-white">{kyc.city}, {kyc.province}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Submitted</p>
                    <p className="text-white">{new Date(kyc.created_date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedKyc?.id === kyc.id && (
                <div className="border-t border-slate-700 p-4 space-y-4 bg-slate-900/30">
                  {/* Document Images */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kyc.idPhotoUrl && (
                      <div>
                        <p className="text-slate-300 text-xs font-bold mb-2 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> ID Photo
                        </p>
                        <img src={kyc.idPhotoUrl} alt="ID" className="w-full rounded-lg border border-slate-700 max-h-64 object-cover" />
                      </div>
                    )}
                    {kyc.selfieUrl && (
                      <div>
                        <p className="text-slate-300 text-xs font-bold mb-2 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Selfie
                        </p>
                        <img src={kyc.selfieUrl} alt="Selfie" className="w-full rounded-lg border border-slate-700 max-h-64 object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Full Details */}
                  <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Full Name:</span><span className="text-white">{kyc.fullName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">ID Number:</span><span className="text-white font-mono">{kyc.idNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Nationality:</span><span className="text-white">{kyc.nationality}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="text-white">{kyc.phoneNumber}</span></div>
                    <div><span className="text-slate-400">Address:</span><p className="text-white mt-1">{kyc.address}, {kyc.city}, {kyc.province}</p></div>
                    {kyc.amlchecked && <div className="flex justify-between text-green-400"><span>✓ AML Checked</span></div>}
                  </div>

                  {/* Admin Actions */}
                  {kyc.status === 'pending' && (
                    <div className="space-y-3 pt-2 border-t border-slate-700">
                      {reviewingId !== kyc.id ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setReviewingId(kyc.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            onClick={() => setReviewingId(kyc.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-xs h-8"
                          >
                            ✕ Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <label className="text-slate-300 text-xs font-bold block mb-1">Rejection Reason (if rejecting)</label>
                            <Input
                              placeholder="e.g., Blurry ID photo, Self-photo quality issue"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="bg-slate-800 border-slate-700 text-white text-xs h-8 mb-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(kyc.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReject(kyc.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-xs h-8"
                            >
                              Reject
                            </Button>
                            <Button
                              onClick={() => { setReviewingId(null); setRejectionReason(''); }}
                              variant="outline"
                              className="border-slate-700 text-slate-300 text-xs h-8"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification Details */}
                  {kyc.status === 'verified' && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 space-y-1 text-xs">
                      <p className="text-green-400 font-bold">✓ Verified</p>
                      <p className="text-slate-300">Verified: {new Date(kyc.verifiedAt).toLocaleDateString('id-ID')}</p>
                      {kyc.expiresAt && <p className="text-slate-300">Expires: {new Date(kyc.expiresAt).toLocaleDateString('id-ID')}</p>}
                    </div>
                  )}

                  {kyc.status === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1 text-xs">
                      <p className="text-red-400 font-bold">✕ Rejected</p>
                      <p className="text-slate-300">{kyc.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}