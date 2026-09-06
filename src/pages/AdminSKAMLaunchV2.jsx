import AdminSKAMLaunch from './AdminSKAMLaunch';
import SKAMAuthorityRevokePanel from '@/components/skam/SKAMAuthorityRevokePanel';

export default function AdminSKAMLaunchV2() {
  return (
    <>
      <div className="bg-slate-950 px-4 pt-6 sm:px-6">
        <SKAMAuthorityRevokePanel />
      </div>
      <AdminSKAMLaunch />
    </>
  );
}
