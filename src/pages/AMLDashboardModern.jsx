import React from 'react';
import { Radar } from 'lucide-react';
import AdminCommandShell from '../components/admin/AdminCommandShell';
import AMLDashboard from './AMLDashboard';

export default function AMLDashboardModern() {
  return (
    <AdminCommandShell
      kicker="KRIPTOAMAN RISK INTELLIGENCE"
      title="AML Risk Command"
      description="Pusat pemantauan akun berisiko, indikator screening, antrean review, investigasi, dan keputusan admin dengan fokus pada konteks risiko yang terverifikasi."
      icon={Radar}
    >
      <AMLDashboard />
    </AdminCommandShell>
  );
}
