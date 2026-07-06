import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Database, FileText, ShieldCheck } from 'lucide-react';

const today = new Date().toISOString().slice(0, 10);
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function BigQueryKYCReports() {
  const [form, setForm] = useState({ projectId: '', datasetId: '', tableId: 'KYCVerification', startDate: ninetyDaysAgo, endDate: today });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const approvalRate = useMemo(() => {
    if (!report?.summary?.totalRequests) return 0;
    return Math.round((report.summary.verified / report.summary.totalRequests) * 100);
  }, [report]);

  const runReport = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await base44.functions.invoke('queryBigQueryKYCTrends', form);
    setReport(response.data);
    setLoading(false);
  };

  const handleRun = async (event) => {
    try {
      await runReport(event);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Gagal menjalankan report');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">BigQuery KYC Compliance Reports</h1>
            <p className="text-slate-400 text-sm">Query tren verifikasi KYC untuk laporan kepatuhan.</p>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><FileText className="w-5 h-5" /> Konfigurasi Query</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRun} className="grid md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label>Project ID</Label>
                <Input value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} placeholder="my-gcp-project" required />
              </div>
              <div className="space-y-2">
                <Label>Dataset</Label>
                <Input value={form.datasetId} onChange={(e) => setForm({ ...form, datasetId: e.target.value })} placeholder="compliance" required />
              </div>
              <div className="space-y-2">
                <Label>Table</Label>
                <Input value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Mulai</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Sampai</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </div>
              <Button type="submit" disabled={loading} className="md:col-span-6 bg-blue-600 hover:bg-blue-700">
                {loading ? 'Menjalankan Query...' : 'Jalankan Report'}
              </Button>
            </form>
            {error && <p className="mt-4 text-sm text-rose-300 bg-rose-950/40 border border-rose-800 rounded-xl p-3">{error}</p>}
          </CardContent>
        </Card>

        {report && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="bg-slate-900 border-slate-800 text-white"><CardContent className="p-4"><p className="text-slate-400 text-xs">Total</p><p className="text-2xl font-bold">{report.summary.totalRequests}</p></CardContent></Card>
              <Card className="bg-slate-900 border-slate-800 text-white"><CardContent className="p-4"><p className="text-slate-400 text-xs">Verified</p><p className="text-2xl font-bold text-emerald-300">{report.summary.verified}</p></CardContent></Card>
              <Card className="bg-slate-900 border-slate-800 text-white"><CardContent className="p-4"><p className="text-slate-400 text-xs">Rejected</p><p className="text-2xl font-bold text-rose-300">{report.summary.rejected}</p></CardContent></Card>
              <Card className="bg-slate-900 border-slate-800 text-white"><CardContent className="p-4"><p className="text-slate-400 text-xs">Pending</p><p className="text-2xl font-bold text-amber-300">{report.summary.pending}</p></CardContent></Card>
              <Card className="bg-slate-900 border-slate-800 text-white"><CardContent className="p-4"><p className="text-slate-400 text-xs">Approval Rate</p><p className="text-2xl font-bold text-blue-300">{approvalRate}%</p></CardContent></Card>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="w-5 h-5" /> Tren Harian</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="text-left py-3">Tanggal</th><th className="text-left py-3">Status</th><th className="text-left py-3">Level</th><th className="text-left py-3">ID</th><th className="text-right py-3">Total</th><th className="text-right py-3">Risk Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, index) => (
                      <tr key={`${row.report_date}-${row.status}-${index}`} className="border-b border-slate-800/60">
                        <td className="py-3">{row.report_date}</td>
                        <td className="py-3"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-xs"><ShieldCheck className="w-3 h-3" />{row.status}</span></td>
                        <td className="py-3">{row.verification_level}</td>
                        <td className="py-3 uppercase">{row.id_type}</td>
                        <td className="py-3 text-right font-semibold">{row.total_requests}</td>
                        <td className="py-3 text-right">{row.average_risk_score ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}