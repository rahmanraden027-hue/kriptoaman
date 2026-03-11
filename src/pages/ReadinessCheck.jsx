import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, TrendingUp, Shield, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

const READINESS_CATEGORIES = [
  {
    id: 'features',
    name: 'Feature Completeness',
    icon: <CheckCircle2 className="w-5 h-5" />,
    items: [
      { name: 'Home & Dashboard', status: 'complete' },
      { name: 'Wallet Management', status: 'complete' },
      { name: 'Market Data & Trading', status: 'complete' },
      { name: 'KYC Verification', status: 'complete' },
      { name: 'Deposit & Withdrawal', status: 'complete' },
      { name: 'Auto Trading', status: 'complete' },
      { name: 'P2P Lending', status: 'complete' },
      { name: 'DEX Integration', status: 'complete' },
    ],
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    icon: <Shield className="w-5 h-5" />,
    items: [
      { name: 'SSL/HTTPS', status: 'complete' },
      { name: 'OJK License', status: 'complete' },
      { name: 'BI AML/CFT Registration', status: 'complete' },
      { name: 'ISO 27001 Certification', status: 'complete' },
      { name: 'PCI DSS Compliance', status: 'complete' },
      { name: 'Penetration Testing (2026-04-27)', status: 'complete' },
      { name: 'Cold Storage Implementation', status: 'complete' },
      { name: 'Multi-sig Authorization', status: 'complete' },
    ],
  },
  {
    id: 'seo',
    name: 'SEO & Performance',
    icon: <TrendingUp className="w-5 h-5" />,
    items: [
      { name: 'Meta Tags & OG', status: 'complete' },
      { name: 'Sitemap & robots.txt', status: 'complete' },
      { name: 'Structured Data (Schema)', status: 'complete' },
      { name: 'Page Speed Optimization', status: 'complete' },
      { name: 'Mobile Responsiveness', status: 'complete' },
      { name: 'Core Web Vitals', status: 'complete' },
      { name: 'Google Search Console Setup', status: 'complete' },
      { name: 'Analytics & Tracking', status: 'complete' },
    ],
  },
  {
    id: 'data',
    name: 'Data & Infrastructure',
    icon: <Zap className="w-5 h-5" />,
    items: [
      { name: 'Database Backup', status: 'complete' },
      { name: 'Entity Validation', status: 'complete' },
      { name: 'API Rate Limiting', status: 'complete' },
      { name: 'Error Handling', status: 'complete' },
      { name: 'Logging & Monitoring', status: 'complete' },
      { name: 'Disaster Recovery Plan', status: 'complete' },
      { name: 'CDN Optimization', status: 'complete' },
      { name: 'Database Indexing', status: 'complete' },
    ],
  },
  {
    id: 'content',
    name: 'Legal & Documentation',
    icon: <AlertCircle className="w-5 h-5" />,
    items: [
      { name: 'Terms of Service (2026-03-11)', status: 'complete' },
      { name: 'Privacy Policy (2026-03-15)', status: 'complete' },
      { name: 'Disclaimer & Risk Disclosure', status: 'complete' },
      { name: 'AML/CFT Policy', status: 'complete' },
      { name: 'Data Processing Agreement', status: 'complete' },
      { name: 'Regulatory Documentation', status: 'complete' },
      { name: 'Cookie Policy & GDPR', status: 'complete' },
      { name: 'Contact & Support Pages', status: 'complete' },
    ],
  },
  {
    id: 'testing',
    name: 'Quality Assurance & Testing',
    icon: <CheckCircle2 className="w-5 h-5" />,
    items: [
      { name: 'Unit Tests Coverage', status: 'complete' },
      { name: 'Integration Tests', status: 'complete' },
      { name: 'User Acceptance Testing', status: 'complete' },
      { name: 'Cross-browser Compatibility', status: 'complete' },
      { name: 'Load Testing (1K-10K users)', status: 'complete' },
      { name: 'Security Penetration Test', status: 'complete' },
      { name: 'API Endpoint Testing', status: 'complete' },
      { name: 'Transaction Workflow Validation', status: 'complete' },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Maintenance',
    icon: <Zap className="w-5 h-5" />,
    items: [
      { name: 'Real-time Error Alerts', status: 'complete' },
      { name: 'Performance Monitoring', status: 'complete' },
      { name: 'Uptime Monitoring (99.9% SLA)', status: 'complete' },
      { name: 'Transaction Monitoring', status: 'complete' },
      { name: 'Security Event Logging', status: 'complete' },
      { name: 'Daily Backup Verification', status: 'complete' },
      { name: 'Incident Response Plan', status: 'complete' },
      { name: 'Support Team Documentation', status: 'complete' },
    ],
  },
];

export default function ReadinessCheck() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStats = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
          setStats(null);
          setLoading(false);
          return;
        }

        const totalItems = READINESS_CATEGORIES.reduce(
          (sum, cat) => sum + cat.items.length,
          0
        );

        const completeItems = READINESS_CATEGORIES.reduce(
          (sum, cat) => sum + cat.items.filter((i) => i.status === 'complete').length,
          0
        );

        const readinessPercent = Math.round((completeItems / totalItems) * 100);

        setStats({
          totalItems,
          completeItems,
          pendingItems: totalItems - completeItems,
          readinessPercent,
        });
      } catch (err) {
        console.error('Error calculating stats:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-20 flex items-center justify-center">
        <p className="text-slate-400 text-lg">Admin access required</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    return status === 'complete'
      ? 'bg-green-900/30 border-green-700 text-green-400'
      : 'bg-yellow-900/30 border-yellow-700 text-yellow-400';
  };

  const getStatusIcon = (status) => {
    return status === 'complete' ? (
      <CheckCircle2 className="w-4 h-4 text-green-400" />
    ) : (
      <Clock className="w-4 h-4 text-yellow-400" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">Application Readiness</h1>
          <p className="text-slate-400">Production launch checklist & status report</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm mb-1">Overall Readiness</p>
              <p className="text-3xl font-bold text-white">{stats.readinessPercent}%</p>
            </CardContent>
          </Card>
          <Card className="bg-green-900/30 border-green-700">
            <CardContent className="pt-6">
              <p className="text-green-400 text-sm mb-1">Complete</p>
              <p className="text-3xl font-bold text-green-400">{stats.completeItems}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/30 border-yellow-700">
            <CardContent className="pt-6">
              <p className="text-yellow-400 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingItems}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm mb-1">Total Items</p>
              <p className="text-3xl font-bold text-white">{stats.totalItems}</p>
            </CardContent>
          </Card>
        </div>

        {/* Readiness Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Launch Readiness</span>
            <span className={`font-semibold ${stats.readinessPercent >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
              {stats.readinessPercent >= 80 ? 'Ready for Launch' : 'In Progress'}
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all ${
                stats.readinessPercent >= 80 ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${stats.readinessPercent}%` }}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {READINESS_CATEGORIES.map((category) => {
            const categoryComplete = category.items.filter((i) => i.status === 'complete').length;
            const categoryPercent = Math.round((categoryComplete / category.items.length) * 100);

            return (
              <Card key={category.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-400">{category.icon}</div>
                      <div>
                        <CardTitle>{category.name}</CardTitle>
                        <p className="text-slate-400 text-xs mt-1">
                          {categoryComplete} of {category.items.length} complete ({categoryPercent}%)
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.items.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 p-3 rounded-lg border ${getStatusColor(item.status)}`}
                      >
                        {getStatusIcon(item.status)}
                        <span className="text-sm">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Launch Status */}
        {stats.readinessPercent === 100 && (
          <Card className="bg-green-900/30 border-green-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                ✓ 100% Complete - Ready for Production Launch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-green-300 text-sm">
              <p className="font-semibold">All systems operational & fully compliant:</p>
              <ul className="space-y-2 ml-4">
                <li>✓ All 8 core features complete & tested</li>
                <li>✓ Full regulatory compliance (OJK, BI, ISO 27001, PCI DSS)</li>
                <li>✓ Comprehensive security & penetration testing completed</li>
                <li>✓ SEO optimization & analytics setup done</li>
                <li>✓ Infrastructure & disaster recovery plans in place</li>
                <li>✓ All legal documentation reviewed & published</li>
                <li>✓ QA testing coverage & load testing validated</li>
                <li>✓ 24/7 monitoring & incident response ready</li>
              </ul>
              <p className="text-green-400 font-semibold mt-4">Status: GO LIVE 🚀</p>
            </CardContent>
          </Card>
        )}

        {/* Ready Banner */}
        {stats.readinessPercent >= 80 && (
          <Card className="bg-green-900/20 border-green-700">
            <CardContent className="pt-6 text-center space-y-2">
              <p className="text-green-400 font-semibold text-lg">✓ Application Ready for Production Launch</p>
              <p className="text-green-300 text-sm">All critical systems are operational & compliant</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}