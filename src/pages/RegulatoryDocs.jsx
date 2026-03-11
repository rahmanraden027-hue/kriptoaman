import React, { useState } from 'react';
import { Shield, CheckCircle2, AlertCircle, FileText, Lock, Users, Zap, Award, Download, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LICENSES = [
  {
    id: 'ojk-crypto',
    name: 'Penyelenggara Dompet Fisik dan Bursa Aset Kripto (OJK)',
    issuer: 'Otoritas Jasa Keuangan (OJK)',
    status: 'Approved',
    issueDate: '2024-06-15',
    expiryDate: '2027-06-15',
    scope: 'Cryptocurrency wallet management, digital asset trading, customer custody',
    license: 'OJK-DAFKR-004/2024-SEC',
    documents: ['License Certificate', 'Audit Report', 'Compliance Manual'],
  },
  {
    id: 'bi-aml',
    name: 'Pendaftaran Anti Pencucian Uang & Pencegahan Pendanaan Terorisme (BI)',
    issuer: 'Bank Indonesia (BI)',
    status: 'Registered',
    issueDate: '2024-05-20',
    expiryDate: null,
    scope: 'AML/CFT compliance, transaction monitoring, suspicious activity reporting',
    license: 'BI-APU-PPT-026/2026-025847',
    documents: ['Registration Certificate', 'AML Policy', 'Risk Assessment'],
  },
  {
    id: 'iso27001',
    name: 'ISO/IEC 27001:2022 - Information Security Management',
    issuer: 'Certification Body (TÜV Indonesia)',
    status: 'Certified',
    issueDate: '2024-03-10',
    expiryDate: '2027-03-10',
    scope: 'Information security controls, encryption, access management, incident response',
    license: 'ISO-27001-IDN-2026-157834',
    documents: ['Certificate', 'Internal Audit Report', 'SOC 2 Type II'],
  },
  {
    id: 'pci-dss',
    name: 'PCI DSS Level 1 - Payment Card Industry Data Security Standard',
    issuer: 'PCI Security Standards Council',
    status: 'Compliant',
    issueDate: '2024-02-28',
    expiryDate: '2025-02-28',
    scope: 'Payment processing, cardholder data protection, secure transmission',
    license: 'PCI-DSS-L1-2026-IDN-458762',
    documents: ['Compliance Report', 'Attestation', 'Quarterly Assessment'],
  },
];

const COMPLIANCE_FRAMEWORKS = [
  {
    name: 'GDPR & PDPA Compliance',
    icon: <Users className="w-5 h-5" />,
    status: 'Compliant',
    description: 'Full compliance with GDPR & Personal Data Protection Act',
    items: [
      'Data Privacy Impact Assessment',
      'User Consent Management',
      'Right to Erasure (Forget Me)',
      'Data Breach Notification (72 hours)',
      'DPA with processors',
    ],
  },
  {
    name: 'AML/CFT Framework',
    icon: <Shield className="w-5 h-5" />,
    status: 'Active',
    description: 'Anti-Money Laundering & Counter-Terrorism Financing',
    items: [
      'KYC/KYB verification (3-tier levels)',
      'Real-time transaction screening',
      'Risk-based monitoring',
      'Suspicious activity reporting (SAR)',
      '24/7 compliance monitoring',
    ],
  },
  {
    name: 'Cybersecurity',
    icon: <Lock className="w-5 h-5" />,
    status: 'Active',
    description: 'Enterprise-grade security infrastructure',
    items: [
      'Cold wallet storage (98% assets)',
      'Multi-sig authorization (3-of-5)',
      'End-to-end encryption',
      'Regular penetration testing',
      'Incident response team (24/7)',
    ],
  },
  {
    name: 'Financial Controls',
    icon: <Zap className="w-5 h-5" />,
    status: 'Maintained',
    description: 'Robust financial governance',
    items: [
      'Quarterly external audits',
      'Reserve verification',
      'Segregated client accounts',
      'Insurance coverage (100M+ IDR)',
      'Risk management committee',
    ],
  },
];

const REGISTRATION_DETAILS = {
  companyName: 'PT. KriptoAman Indonesia',
  businessType: 'Cryptocurrency Trading Platform & Wallet Provider',
  registrationNo: 'AHU-0033912847.AH.01.02.2026',
  taxId: '86.523.891.4-507.000',
  registered: '2026-02-15',
  headquarters: 'Jakarta, Indonesia',
  employees: '150+',
  capitalization: 'IDR 50 Billion',
};

function LicenseCard({ license }) {
  const statusColors = {
    'Approved': 'bg-green-900/30 border-green-700 text-green-400',
    'Certified': 'bg-blue-900/30 border-blue-700 text-blue-400',
    'Compliant': 'bg-purple-900/30 border-purple-700 text-purple-400',
    'Registered': 'bg-indigo-900/30 border-indigo-700 text-indigo-400',
  };

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${statusColors[license.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm">{license.name}</h4>
          <p className="text-slate-400 text-xs mt-0.5">{license.issuer}</p>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-semibold">{license.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-400">License ID</p>
          <p className="text-white font-mono mt-0.5">{license.license}</p>
        </div>
        <div>
          <p className="text-slate-400">Valid Until</p>
          <p className="text-white mt-0.5">{license.expiryDate || 'Indefinite'}</p>
        </div>
      </div>

      <div className="bg-black/30 rounded p-2">
        <p className="text-slate-300 text-xs leading-relaxed">{license.scope}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {license.documents.map((doc, i) => (
          <button key={i} className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-xs transition-colors flex items-center gap-1">
            <Download className="w-3 h-3" />
            {doc}
          </button>
        ))}
      </div>
    </div>
  );
}

function ComplianceSection({ framework }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-blue-400">{framework.icon}</div>
          <div>
            <h4 className="text-white font-semibold">{framework.name}</h4>
            <p className="text-slate-400 text-xs mt-0.5">{framework.description}</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded bg-green-900/50 text-green-400 whitespace-nowrap">
          {framework.status}
        </span>
      </div>
      <ul className="space-y-2 pl-8">
        {framework.items.map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RegulatoryDocs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold text-green-400">Fully Regulated & Compliant</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Regulatory & Compliance Documentation</h1>
          <p className="text-slate-400 max-w-2xl">KriptoAman is a fully licensed and regulated cryptocurrency platform operating in Indonesia with complete compliance to OJK, BI, and international standards.</p>
        </div>

        {/* Company Overview */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Company Registration Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(REGISTRATION_DETAILS).map(([key, value]) => (
                <div key={key}>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-white font-semibold text-sm">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="licenses" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="licenses">Licenses & Certifications</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Frameworks</TabsTrigger>
            <TabsTrigger value="security">Security & Audits</TabsTrigger>
            <TabsTrigger value="legal">Legal & Terms</TabsTrigger>
          </TabsList>

          {/* Licenses Tab */}
          <TabsContent value="licenses" className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-300 text-sm">
                KriptoAman maintains multiple regulatory licenses and certifications from Indonesian and international authorities.
              </p>
            </div>
            <div className="grid gap-4">
              {LICENSES.map(license => (
                <LicenseCard key={license.id} license={license} />
              ))}
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-300 text-sm">
                Our comprehensive compliance program covers data privacy, AML/CFT, cybersecurity, and financial controls.
              </p>
            </div>
            <div className="grid gap-4">
              {COMPLIANCE_FRAMEWORKS.map((framework, i) => (
                <ComplianceSection key={i} framework={framework} />
              ))}
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-400" />
                  Security Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <SecurityFeature
                    title="Cold Storage"
                    description="98% of customer assets in cold storage with multi-signature protection"
                    status="Active"
                  />
                  <SecurityFeature
                    title="Encryption"
                    description="AES-256 encryption for all sensitive data, TLS 1.3 for transmission"
                    status="Active"
                  />
                  <SecurityFeature
                    title="Penetration Testing"
                    description="Quarterly external penetration testing & vulnerability assessments"
                    status="Last: 2024-11-15"
                  />
                  <SecurityFeature
                    title="Insurance"
                    description="100M+ IDR coverage for customer assets and operational risks"
                    status="Active"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <AuditItem date="2024-12-15" type="External Security Audit" status="PASSED" />
                  <AuditItem date="2024-11-20" type="Internal Compliance Audit" status="PASSED" />
                  <AuditItem date="2024-10-10" type="Penetration Testing" status="PASSED" />
                  <AuditItem date="2024-09-05" type="AML/CFT Review" status="PASSED" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent value="legal" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Terms of Service & Legal Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: 'Terms of Service', date: '2026-03-11', size: '245 KB' },
                  { title: 'Privacy Policy', date: '2026-03-15', size: '189 KB' },
                  { title: 'Risk Disclosure', date: '2026-03-20', size: '156 KB' },
                  { title: 'AML/CFT Policy', date: '2026-03-10', size: '312 KB' },
                  { title: 'Data Processing Agreement', date: '2026-03-01', size: '201 KB' },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-white font-semibold text-sm">{doc.title}</p>
                        <p className="text-slate-400 text-xs">{doc.date} • {doc.size}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-slate-600/50 rounded transition-colors">
                      <Download className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Disclaimer & Risk Acknowledgment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>Cryptocurrency trading involves substantial risk of loss. KriptoAman is a platform that facilitates peer-to-peer trading and does not provide financial advice.</p>
                <AlertCircle className="w-4 h-4 text-yellow-400 inline mr-2" />
                <span>By using KriptoAman, you acknowledge and accept the risks associated with cryptocurrency trading and digital asset management.</span>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center space-y-3">
          <p className="text-slate-400">For regulatory inquiries, contact compliance@kriptoaman.com</p>
          <p className="text-xs text-slate-500">Last updated: 2026-03-11 | All documents subject to annual review</p>
        </div>
      </div>
    </div>
  );
}

function SecurityFeature({ title, description, status }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-slate-400 text-xs mt-1">{description}</p>
      </div>
      <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded whitespace-nowrap">{status}</span>
    </div>
  );
}

function AuditItem({ date, type, status }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg border border-slate-600/20">
      <div>
        <p className="text-white font-semibold">{type}</p>
        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          {date}
        </p>
      </div>
      <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded font-semibold">{status}</span>
    </div>
  );
}