import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Activity,
  Database,
  FileCheck2,
  Radar,
  Server,
  ShieldCheck,
  UserCog,
  Wallet,
} from 'lucide-react';

const SUITE_NAV = [
  { page: 'AdminKYCManagement', label: 'KYC Management', icon: FileCheck2 },
  { page: 'AdminUserBalances', label: 'User Balances', icon: UserCog },
  { page: 'AdminPlatformAssets', label: 'Platform Assets', icon: Wallet },
  { page: 'AMLDashboard', label: 'AML Monitoring', icon: Radar },
  { page: 'SecurityCenter', label: 'Security Center', icon: ShieldCheck },
  { page: 'ServerControl', label: 'Server Control', icon: Server },
];

export default function AdminCommandShell({ kicker, title, description, icon: Icon, children }) {
  const location = useLocation();
  const activePath = location.pathname.toLowerCase();

  return (
    <div className="ka-bg ka-workspace-page ka-admin-modern min-h-screen text-white pb-28">
      <div className="mx-auto max-w-[1480px] px-4 pt-5 sm:px-6 lg:px-8">
        <div className="ka-suite-topline mb-4">
          <div className="min-w-0">
            <p className="ka-command-kicker">KRIPTOAMAN ADMIN INTELLIGENCE SUITE</p>
            <p className="mt-1 text-[10px] text-slate-500">Security · Compliance · Identity · Asset Operations</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="ka-suite-badge"><Activity className="h-3.5 w-3.5 text-emerald-400" /> DATA-BOUND UI</span>
            <span className="ka-suite-badge"><ShieldCheck className="h-3.5 w-3.5 text-sky-400" /> ROLE GUARDED</span>
            <span className="ka-suite-badge"><Database className="h-3.5 w-3.5 text-indigo-300" /> ADMIN ENTITIES</span>
          </div>
        </div>

        <nav className="ka-suite-nav mb-4" aria-label="Admin intelligence navigation">
          {SUITE_NAV.map(({ page, label, icon: NavIcon }) => {
            const active = activePath.includes(page.toLowerCase());
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                className={`ka-suite-nav-item ${active ? 'is-active' : ''}`}
              >
                <NavIcon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <section className="ka-command-hero p-5 sm:p-7 mb-5">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="ka-suite-icon-tile">
                <Icon className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className="ka-command-kicker">{kicker}</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl xl:text-4xl">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ka-command-status">ADMIN SESSION</span>
              <span className="ka-suite-badge ka-suite-badge-indigo">
                <ShieldCheck className="h-3.5 w-3.5" /> OWNER CONTROL
              </span>
              <span className="ka-suite-badge">
                <Activity className="h-3.5 w-3.5" /> OPERATION WORKSPACE
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="ka-admin-legacy">{children}</div>

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <footer className="ka-suite-footer mt-5">
          <div><span className="ka-suite-dot bg-emerald-400" /> Role guard enabled</div>
          <div><span className="ka-suite-dot bg-sky-400" /> Connected admin workspace</div>
          <div><span className="ka-suite-dot bg-indigo-400" /> Security-aware interface</div>
          <div className="ml-auto text-slate-600">KriptoAman Intelligence Workspace</div>
        </footer>
      </div>
    </div>
  );
}
