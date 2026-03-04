import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Send, AlertCircle, CheckCircle2, Clock, Star } from 'lucide-react';

export default function P2PLending() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allLoans = [] } = useQuery({
    queryKey: ['p2p_loans'],
    queryFn: () => base44.entities.P2PLoan.list(),
  });

  const { data: myLoans = [] } = useQuery({
    queryKey: ['my_loans', user?.email],
    queryFn: () => user?.email ? base44.entities.P2PLoan.filter({
      $or: [{ lenderEmail: user.email }, { borrowerEmail: user.email }]
    }) : [],
    enabled: !!user?.email,
  });

  const { data: userRating } = useQuery({
    queryKey: ['user_rating', user?.email],
    queryFn: () => user?.email ? base44.entities.UserLendingRating.filter({ userEmail: user.email }).then(r => r[0]) : null,
    enabled: !!user?.email,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['loan_notifications', user?.email],
    queryFn: () => user?.email ? base44.entities.LoanNotification.filter({ userEmail: user.email }) : [],
    enabled: !!user?.email,
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      active: 'bg-blue-500/20 text-blue-400',
      partially_repaid: 'bg-cyan-500/20 text-cyan-400',
      completed: 'bg-green-500/20 text-green-400',
      defaulted: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-slate-500/20 text-slate-400',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'active' || status === 'partially_repaid') return <TrendingUp className="w-4 h-4" />;
    if (status === 'defaulted') return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold">P2P Lending</h1>
          </div>
          <p className="text-slate-400 text-sm">Pinjamkan atau pinjam aset kripto dengan aman</p>
        </div>

        {/* User Rating Card */}
        {userRating && (
          <Card className="mb-6 bg-slate-800/60 border-slate-700/40 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-2">Kredit Anda</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(userRating.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-bold">{userRating.rating.toFixed(1)}/5</span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <p>Score: <span className="text-white font-semibold">{userRating.creditScore}/1000</span></p>
                  <p>Pinjaman Selesai: <span className="text-green-400">{userRating.completedLoans}/{userRating.totalLoans}</span></p>
                  <p>On-time Rate: <span className="text-blue-400">{userRating.avgRepaymentRate.toFixed(1)}%</span></p>
                </div>
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-sm h-8">
                Buat Pinjaman
              </Button>
            </div>
          </Card>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-slate-400 text-xs font-semibold uppercase">Notifikasi ({notifications.filter(n => !n.isRead).length})</p>
            {notifications.slice(0, 3).map(notif => (
              <Card key={notif.id} className="bg-slate-800/40 border-slate-700/40 p-3">
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    notif.type.includes('warning') || notif.type.includes('overdue') ? 'bg-red-500/20 text-red-400' :
                    notif.type.includes('completed') ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {notif.type.includes('payment') || notif.type.includes('received') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{notif.title}</p>
                    <p className="text-xs text-slate-400">{notif.message}</p>
                  </div>
                  {notif.actionRequired && <Badge className="bg-red-500 text-white text-[10px]">Aksi Diperlukan</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/60 border border-slate-700/40 h-10 p-1">
            <TabsTrigger value="browse" className="text-xs">Cari Pinjaman</TabsTrigger>
            <TabsTrigger value="borrowed" className="text-xs">Dipinjam</TabsTrigger>
            <TabsTrigger value="lent" className="text-xs">Dipinjamkan</TabsTrigger>
          </TabsList>

          {/* Browse Available Loans */}
          <TabsContent value="browse" className="mt-4 space-y-3">
            <p className="text-slate-400 text-xs font-semibold">Tersedia untuk Dipinjam</p>
            {allLoans.filter(l => l.status === 'pending' && l.lenderEmail !== user?.email).length === 0 ? (
              <Card className="bg-slate-800/30 border-slate-700/40 p-6 text-center">
                <p className="text-slate-400 text-sm">Tidak ada pinjaman tersedia</p>
              </Card>
            ) : (
              allLoans.filter(l => l.status === 'pending' && l.lenderEmail !== user?.email).map(loan => (
                <Card key={loan.id} className="bg-slate-800/60 border-slate-700/40 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{loan.principalAmount} {loan.assetSymbol}</p>
                      <p className="text-slate-400 text-xs">Bunga: {loan.interestRate}% / {loan.durationDays} hari</p>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(loan.status)}`}>
                      {loan.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 h-8 text-xs">
                    Ajukan Pinjaman
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Borrowed Loans */}
          <TabsContent value="borrowed" className="mt-4 space-y-3">
            <p className="text-slate-400 text-xs font-semibold">Pinjaman yang Saya Ambil</p>
            {myLoans.filter(l => l.borrowerEmail === user?.email).length === 0 ? (
              <Card className="bg-slate-800/30 border-slate-700/40 p-6 text-center">
                <p className="text-slate-400 text-sm">Tidak ada pinjaman aktif</p>
              </Card>
            ) : (
              myLoans.filter(l => l.borrowerEmail === user?.email).map(loan => (
                <Card key={loan.id} className="bg-slate-800/60 border-slate-700/40 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{loan.principalAmount} {loan.assetSymbol}</p>
                      <p className="text-slate-400 text-xs">Total Utang: {loan.totalOwed} {loan.assetSymbol}</p>
                      <p className="text-slate-400 text-xs">Sudah Bayar: {loan.amountRepaid} {loan.assetSymbol}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`text-xs ${getStatusColor(loan.status)}`}>
                        {loan.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-cyan-400 text-xs font-semibold">
                        {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                    Bayar Cicilan
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Lent Loans */}
          <TabsContent value="lent" className="mt-4 space-y-3">
            <p className="text-slate-400 text-xs font-semibold">Pinjaman yang Saya Berikan</p>
            {myLoans.filter(l => l.lenderEmail === user?.email).length === 0 ? (
              <Card className="bg-slate-800/30 border-slate-700/40 p-6 text-center">
                <p className="text-slate-400 text-sm">Belum ada pinjaman yang diberikan</p>
              </Card>
            ) : (
              myLoans.filter(l => l.lenderEmail === user?.email).map(loan => (
                <Card key={loan.id} className="bg-slate-800/60 border-slate-700/40 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{loan.principalAmount} {loan.assetSymbol}</p>
                      <p className="text-slate-400 text-xs">Peminjam: {loan.borrowerEmail.split('@')[0]}</p>
                      <p className="text-slate-400 text-xs">Bunga: {loan.interestRate}% / {loan.durationDays} hari</p>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(loan.status)}`}>
                      {loan.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {loan.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs">
                        Setujui
                      </Button>
                      <Button className="flex-1 bg-red-600 hover:bg-red-700 h-8 text-xs">
                        Tolak
                      </Button>
                    </div>
                  )}
                  {loan.status === 'active' && (
                    <p className="text-cyan-400 text-xs font-semibold">
                      Terima: {loan.amountRepaid} / {loan.totalOwed} {loan.assetSymbol}
                    </p>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}