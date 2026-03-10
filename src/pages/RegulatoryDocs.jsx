import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, FileText, Download, ExternalLink, Lock, ChevronDown, ChevronRight, BookOpen, AlertTriangle } from 'lucide-react';

const OJK_DOCS = [
  {
    category: "Perizinan & Pendaftaran",
    color: "from-blue-600 to-blue-800",
    icon: "🏛️",
    docs: [
      {
        title: "POJK No. 77/POJK.01/2016",
        desc: "Layanan Pinjam Meminjam Uang Berbasis Teknologi Informasi (Fintech P2P Lending)",
        type: "Peraturan OJK",
        url: "https://www.ojk.go.id/id/kanal/iknb/regulasi/lembaga-keuangan-mikro/peraturan-ojk/Pages/POJK-Nomor-77-POJK.01-2016.aspx",
        status: "Berlaku",
        year: "2016"
      },
      {
        title: "POJK No. 13/POJK.02/2018",
        desc: "Inovasi Keuangan Digital di Sektor Jasa Keuangan",
        type: "Peraturan OJK",
        url: "https://www.ojk.go.id/id/regulasi/Pages/Inovasi-Keuangan-Digital-di-Sektor-Jasa-Keuangan.aspx",
        status: "Berlaku",
        year: "2018"
      },
      {
        title: "POJK No. 57/POJK.04/2020",
        desc: "Penawaran Efek Melalui Layanan Urun Dana Berbasis Teknologi Informasi (Equity Crowdfunding)",
        type: "Peraturan OJK",
        url: "https://www.ojk.go.id/id/regulasi/Pages/Penawaran-Efek-Melalui-Layanan-Urun-Dana-Berbasis-Teknologi-Informasi.aspx",
        status: "Berlaku",
        year: "2020"
      },
      {
        title: "SEOJK No. 18/SEOJK.02/2017",
        desc: "Tata Kelola dan Manajemen Risiko Teknologi Informasi pada Layanan Pinjam Meminjam Uang",
        type: "Surat Edaran OJK",
        url: "https://www.ojk.go.id/id/kanal/iknb/regulasi/lembaga-keuangan-mikro/surat-edaran-ojk/Pages/SEOJK-Nomor-18-SEOJK.02-2017.aspx",
        status: "Berlaku",
        year: "2017"
      },
    ]
  },
  {
    category: "Perlindungan Konsumen",
    color: "from-emerald-600 to-emerald-800",
    icon: "🛡️",
    docs: [
      {
        title: "POJK No. 6/POJK.07/2022",
        desc: "Perlindungan Konsumen dan Masyarakat di Sektor Jasa Keuangan",
        type: "Peraturan OJK",
        url: "https://www.ojk.go.id/id/regulasi/Pages/Perlindungan-Konsumen-dan-Masyarakat-di-Sektor-Jasa-Keuangan.aspx",
        status: "Berlaku",
        year: "2022"
      },
      {
        title: "POJK No. 31/POJK.05/2020",
        desc: "Perubahan atas POJK tentang Layanan Pinjam Meminjam Uang Berbasis Teknologi Informasi",
        type: "Peraturan OJK",
        url: "https://www.ojk.go.id/id/regulasi/Pages/default.aspx",
        status: "Berlaku",
        year: "2020"
      },
    ]
  },
  {
    category: "Anti Pencucian Uang (APU/PPT)",
    color: "from-violet-600 to-violet-800",
    icon: "🔍",
    docs: [
      {
        title: "POJK No. 12/POJK.01/2017",
        desc: "Penerapan Program Anti Pencucian Uang dan Pencegahan Pendanaan Terorisme di Sektor Jasa Keuangan",
        type: "Peraturan OJK",
        url: "https://www.ojk.go.id/id/regulasi/Pages/Penerapan-Program-Anti-Pencucian-Uang-dan-Pencegahan-Pendanaan-Terorisme-di-Sektor-Jasa-Keuangan.aspx",
        status: "Berlaku",
        year: "2017"
      },
      {
        title: "SEOJK No. 32/SEOJK.01/2017",
        desc: "Penerapan Program APU dan PPT di Sektor Jasa Keuangan",
        type: "Surat Edaran OJK",
        url: "https://www.ojk.go.id/id/regulasi/Pages/default.aspx",
        status: "Berlaku",
        year: "2017"
      },
    ]
  }
];

const BAPPEBTI_DOCS = [
  {
    category: "Perdagangan Aset Kripto",
    color: "from-orange-600 to-orange-800",
    icon: "₿",
    docs: [
      {
        title: "Perba No. 8 Tahun 2021",
        desc: "Pedoman Penyelenggaraan Perdagangan Pasar Fisik Aset Kripto (Crypto Asset) di Bursa Berjangka",
        type: "Peraturan Bappebti",
        url: "https://www.bappebti.go.id/resources/docs/peraturan/sk_kep_kepala_bappebti/sk_kep_kepala_bappebti_2021_09_07_id.pdf",
        status: "Berlaku",
        year: "2021"
      },
      {
        title: "Perba No. 13 Tahun 2022",
        desc: "Perubahan atas Peraturan Bappebti tentang Pedoman Penyelenggaraan Perdagangan Pasar Fisik Aset Kripto",
        type: "Peraturan Bappebti",
        url: "https://www.bappebti.go.id/resources/docs/peraturan/sk_kep_kepala_bappebti/2022_11_22_id.pdf",
        status: "Berlaku",
        year: "2022"
      },
      {
        title: "Perba No. 4 Tahun 2019",
        desc: "Ketentuan Teknis Penyelenggaraan Pasar Fisik Aset Kripto (Crypto Asset) di Bursa Berjangka",
        type: "Peraturan Bappebti",
        url: "https://www.bappebti.go.id/resources/docs/peraturan/sk_kep_kepala_bappebti/sk_kep_kepala_bappebti_2019_08_09_id.pdf",
        status: "Berlaku",
        year: "2019"
      },
      {
        title: "Perba No. 11 Tahun 2022",
        desc: "Penetapan Daftar Aset Kripto yang Diperdagangkan di Pasar Fisik Aset Kripto",
        type: "Peraturan Bappebti",
        url: "https://www.bappebti.go.id/resources/docs/peraturan/sk_kep_kepala_bappebti/2022_11_22_id.pdf",
        status: "Berlaku",
        year: "2022"
      },
    ]
  },
  {
    category: "Perdagangan Berjangka Komoditi",
    color: "from-amber-600 to-amber-800",
    icon: "📊",
    docs: [
      {
        title: "UU No. 10 Tahun 2011",
        desc: "Perubahan atas UU No. 32 Tahun 1997 tentang Perdagangan Berjangka Komoditi",
        type: "Undang-Undang",
        url: "https://www.bappebti.go.id/regulasi/undang_undang/detail/3",
        status: "Berlaku",
        year: "2011"
      },
      {
        title: "Perba No. 3 Tahun 2022",
        desc: "Penyelenggaraan Perdagangan Kontrak Berjangka Komoditi Berbasis Teknologi",
        type: "Peraturan Bappebti",
        url: "https://www.bappebti.go.id/regulasi/peraturan_bappebti",
        status: "Berlaku",
        year: "2022"
      },
    ]
  },
  {
    category: "KYC & Anti Money Laundering",
    color: "from-red-600 to-red-800",
    icon: "🔐",
    docs: [
      {
        title: "Perba No. 7 Tahun 2020",
        desc: "Penetapan Daftar Aset Kripto dan Persyaratan Teknis Calon Pedagang Aset Kripto",
        type: "Peraturan Bappebti",
        url: "https://www.bappebti.go.id/resources/docs/peraturan/sk_kep_kepala_bappebti/sk_kep_kepala_bappebti_2020_12_17_id.pdf",
        status: "Berlaku",
        year: "2020"
      },
      {
        title: "Perba No. 9 Tahun 2019",
        desc: "Penyelenggaraan Pasar Fisik Emas Digital di Bursa Berjangka",
        type: "Peraturan Bappebti",
        url: "https://www.bappebti.go.id/resources/docs/peraturan/sk_kep_kepala_bappebti/sk_kep_kepala_bappebti_2019_08_09_id.pdf",
        status: "Berlaku",
        year: "2019"
      },
    ]
  }
];

export default function RegulatoryDocs() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedOJK, setExpandedOJK] = useState({});
  const [expandedBappebti, setExpandedBappebti] = useState({});
  const [activeTab, setActiveTab] = useState('ojk');

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Only admin can view
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-white text-xl font-bold">Akses Terbatas</h2>
        <p className="text-slate-400 text-center text-sm max-w-xs">
          Halaman ini hanya dapat diakses oleh Administrator platform.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-xs font-semibold">Admin Only</span>
        </div>
      </div>
    );
  }

  const toggleOJK = (i) => setExpandedOJK(prev => ({ ...prev, [i]: !prev[i] }));
  const toggleBappebti = (i) => setExpandedBappebti(prev => ({ ...prev, [i]: !prev[i] }));

  const renderDocs = (categories, expanded, toggle) => (
    <div className="space-y-4">
      {categories.map((cat, ci) => (
        <div key={ci} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggle(ci)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-lg`}>
                {cat.icon}
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">{cat.category}</p>
                <p className="text-slate-500 text-[10px]">{cat.docs.length} dokumen</p>
              </div>
            </div>
            {expanded[ci] ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expanded[ci] && (
            <div className="border-t border-slate-700/40 divide-y divide-slate-700/30">
              {cat.docs.map((doc, di) => (
                <div key={di} className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white text-sm font-semibold">{doc.title}</span>
                        <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full font-bold">
                          {doc.status}
                        </span>
                        <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">
                          {doc.year}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{doc.desc}</p>
                      <span className="inline-block mt-1.5 text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                        {doc.type}
                      </span>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                      <span className="text-indigo-400 text-[10px] font-semibold">Buka</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto p-4 pb-8">

        {/* Header */}
        <div className="pt-4 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
              <ShieldCheck className="w-3 h-3 text-rose-400" />
              <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wide">Admin Only</span>
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold mt-2">Dokumen Regulasi</h1>
          <p className="text-slate-400 text-sm mt-1">OJK & Bappebti — Referensi hukum dan peraturan platform</p>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300 text-xs leading-relaxed">
            Dokumen ini hanya untuk referensi internal admin. Selalu verifikasi dokumen terbaru langsung dari situs resmi OJK dan Bappebti sebelum mengambil keputusan hukum.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-5 p-1 bg-slate-800/50 border border-slate-700/40 rounded-2xl">
          <button
            onClick={() => setActiveTab('ojk')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'ojk'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            OJK
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'ojk' ? 'bg-white/20' : 'bg-slate-700'}`}>
              {OJK_DOCS.reduce((a, c) => a + c.docs.length, 0)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('bappebti')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'bappebti'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Bappebti
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'bappebti' ? 'bg-white/20' : 'bg-slate-700'}`}>
              {BAPPEBTI_DOCS.reduce((a, c) => a + c.docs.length, 0)}
            </span>
          </button>
        </div>

        {/* OJK Tab */}
        {activeTab === 'ojk' && (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <span className="text-lg">🏛️</span>
              </div>
              <div>
                <p className="text-blue-300 font-bold text-sm">Otoritas Jasa Keuangan</p>
                <p className="text-blue-500 text-xs">ojk.go.id — Regulator Sektor Keuangan Indonesia</p>
              </div>
              <a href="https://www.ojk.go.id" target="_blank" rel="noopener noreferrer"
                className="ml-auto p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors">
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              </a>
            </div>
            {renderDocs(OJK_DOCS, expandedOJK, toggleOJK)}
          </div>
        )}

        {/* Bappebti Tab */}
        {activeTab === 'bappebti' && (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <p className="text-orange-300 font-bold text-sm">Badan Pengawas Perdagangan Berjangka Komoditi</p>
                <p className="text-orange-500 text-xs">bappebti.go.id — Regulator Aset Kripto Indonesia</p>
              </div>
              <a href="https://www.bappebti.go.id" target="_blank" rel="noopener noreferrer"
                className="ml-auto p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors">
                <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
              </a>
            </div>
            {renderDocs(BAPPEBTI_DOCS, expandedBappebti, toggleBappebti)}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/30 rounded-2xl text-center">
          <p className="text-slate-500 text-xs">Terakhir diperbarui: Maret 2026</p>
          <p className="text-slate-600 text-[10px] mt-1">Untuk dokumen terbaru, kunjungi langsung situs resmi regulator</p>
        </div>
      </div>
    </div>
  );
}