import React from 'react';
import { ScanFace } from 'lucide-react';
import AdminCommandShell from '../components/admin/AdminCommandShell';
import AdminKYCManagement from './AdminKYCManagement';

export default function AdminKYCManagementModern() {
  return (
    <AdminCommandShell
      kicker="KRIPTOAMAN IDENTITY OPERATIONS"
      title="KYC Operations Command"
      description="Pusat review identitas, status verifikasi, risk context, dan keputusan admin dalam satu workspace operasional yang konsisten."
      icon={ScanFace}
    >
      <AdminKYCManagement />
    </AdminCommandShell>
  );
}
