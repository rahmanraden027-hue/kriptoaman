import React from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import AdminCommandShell from '../components/admin/AdminCommandShell';
import AdminProfitAnalytics from './AdminProfitAnalytics';

export default function AdminProfitAnalyticsModern() {
  return (
    <AdminCommandShell
      kicker="KRIPTOAMAN REVENUE INTELLIGENCE"
      title="Profit Analytics Command"
      description="Pusat analitik pendapatan admin, fee platform, performa operasional, dan ringkasan profit dalam satu workspace yang konsisten dengan Admin Intelligence Suite."
      icon={ChartNoAxesCombined}
    >
      <AdminProfitAnalytics />
    </AdminCommandShell>
  );
}
