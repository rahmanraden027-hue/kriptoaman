import React from 'react';
import { WalletCards } from 'lucide-react';
import AdminCommandShell from '../components/admin/AdminCommandShell';
import AdminUserBalances from './AdminUserBalances';

export default function AdminUserBalancesModern() {
  return (
    <AdminCommandShell
      kicker="KRIPTOAMAN ACCOUNT INTELLIGENCE"
      title="User Balance Command"
      description="Pusat pemantauan akun, saldo, aktivitas trading, status KYC, dan ekspor operasional dalam satu command workspace admin."
      icon={WalletCards}
    >
      <AdminUserBalances />
    </AdminCommandShell>
  );
}
