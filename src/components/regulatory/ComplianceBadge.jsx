import React from 'react';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Compliance Badge Component
 * Displays regulatory status & certifications
 */
export function ComplianceBadge({ type = 'ojk', size = 'md' }) {
  const badges = {
    ojk: {
      label: 'OJK Licensed',
      icon: '🇮🇩',
      color: 'bg-blue-900/30 border-blue-700 text-blue-400',
      fullText: 'Licensed by Otoritas Jasa Keuangan (Indonesian Financial Authority)',
    },
    bi: {
      label: 'BI Registered',
      icon: '🏦',
      color: 'bg-green-900/30 border-green-700 text-green-400',
      fullText: 'Registered with Bank Indonesia for AML/CFT Compliance',
    },
    iso27001: {
      label: 'ISO 27001',
      icon: '🔒',
      color: 'bg-purple-900/30 border-purple-700 text-purple-400',
      fullText: 'ISO/IEC 27001:2022 Information Security Certified',
    },
    pci: {
      label: 'PCI DSS L1',
      icon: '💳',
      color: 'bg-amber-900/30 border-amber-700 text-amber-400',
      fullText: 'PCI DSS Level 1 Compliant for Payment Processing',
    },
  };

  const badge = badges[type];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-2';

  return (
    <div
      title={badge.fullText}
      className={`inline-flex items-center gap-2 border rounded-full ${sizeClass} ${badge.color} transition-all cursor-help hover:opacity-80`}
    >
      <span>{badge.icon}</span>
      <span className="font-semibold">{badge.label}</span>
      <CheckCircle2 className="w-4 h-4" />
    </div>
  );
}

/**
 * Compliance Status Banner
 * Shows overall compliance status
 */
export function ComplianceStatusBanner() {
  return (
    <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-xl p-4 flex items-start gap-4">
      <div className="text-green-400 mt-1">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="text-white font-bold">Fully Regulated & Compliant</h3>
        <p className="text-slate-300 text-sm mt-1">
          KriptoAman operates under OJK license and BI registration with ISO 27001 & PCI DSS certifications.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <ComplianceBadge type="ojk" size="sm" />
          <ComplianceBadge type="bi" size="sm" />
          <ComplianceBadge type="iso27001" size="sm" />
          <ComplianceBadge type="pci" size="sm" />
        </div>
      </div>
    </div>
  );
}

/**
 * Regulatory Info Card
 * Compact info about licenses
 */
export function RegulatoryInfoCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-bold">Regulatory Status</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
          <span className="text-slate-300">OJK License</span>
          <span className="text-green-400 font-semibold">Active</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
          <span className="text-slate-300">BI Registration</span>
          <span className="text-green-400 font-semibold">Registered</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
          <span className="text-slate-300">ISO 27001</span>
          <span className="text-green-400 font-semibold">Certified</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
          <span className="text-slate-300">AML/CFT Monitoring</span>
          <span className="text-green-400 font-semibold">24/7</span>
        </div>
      </div>

      <a href="/RegulatoryDocs" className="block text-center text-blue-400 text-xs font-semibold hover:text-blue-300 transition-colors mt-3">
        View Full Documentation →
      </a>
    </div>
  );
}