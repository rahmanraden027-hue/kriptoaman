import React from 'react';
import { DatabaseZap } from 'lucide-react';
import AdminCommandShell from '../components/admin/AdminCommandShell';
import AdminPlatformAssets from './AdminPlatformAssets';

export default function AdminPlatformAssetsModern() {
  return (
    <AdminCommandShell
      kicker="KRIPTOAMAN ASSET OPERATIONS"
      title="Platform Asset Command"
      description="Pusat kontrol alamat aset, rekening, status deposit, validasi jaringan, dan konfigurasi operasional platform untuk admin."
      icon={DatabaseZap}
    >
      <AdminPlatformAssets />
    </AdminCommandShell>
  );
}
