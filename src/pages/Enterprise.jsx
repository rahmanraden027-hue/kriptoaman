export default function Enterprise() {
  const services = [
    {
      title: 'KriptoAman Data & API',
      description: 'Akses data pasar, monitoring, dan integrasi data aset digital untuk dashboard, riset, dan aplikasi internal bisnis.',
      price: 'Harga indikatif mulai Rp1.500.000 / bulan*',
      note: 'Paket, kapasitas, dan batas penggunaan disesuaikan dengan kebutuhan bisnis.'
    },
    {
      title: 'Dedicated KAM RPC',
      description: 'Endpoint RPC khusus untuk pengembangan, observability, dan kebutuhan aplikasi yang memerlukan kapasitas terpisah dari public RPC.',
      price: 'Harga indikatif mulai Rp2.000.000 / bulan*',
      note: 'Kapasitas dan SLA disusun sesuai kebutuhan teknis dan skala penggunaan.'
    },
    {
      title: 'Managed Node Infrastructure',
      description: 'Deployment, hardening, monitoring, backup, dan dukungan operasional node untuk kebutuhan institusi dan mitra teknis.',
      price: 'Harga indikatif mulai Rp3.500.000 / bulan*',
      note: 'Dirancang untuk mendukung operasional node yang terukur dengan kontrol akses yang jelas.'
    },
    {
      title: 'Web3 Integration',
      description: 'Integrasi wallet, RPC, explorer, smart-contract interface, interoperability, dan konektivitas aplikasi enterprise.',
      price: 'Berdasarkan scope proyek',
      note: 'Ruang lingkup, milestone, SLA, jadwal, dan harga final dituangkan dalam proposal atau kontrak.'
    },
    {
      title: 'Security & Network Monitoring',
      description: 'Monitoring uptime, health check, alerting, RPC consistency, dan bukti operasional untuk sistem blockchain dan Web3.',
      price: 'Harga indikatif mulai Rp3.000.000 / bulan*',
      note: 'Mendukung kesiapan operasional, visibilitas jaringan, dan respons yang lebih terukur.'
    },
    {
      title: 'Technical Research & Architecture',
      description: 'Kajian arsitektur blockchain, integrasi jaringan, dokumentasi teknis, dan readiness assessment untuk tim produk dan teknologi.',
      price: 'Berdasarkan scope engagement',
      note: 'Disusun sesuai tujuan, kompleksitas, dan deliverable teknis yang disepakati.'
    }
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(16,185,129,.12),transparent_38%)]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">KriptoAman Enterprise</p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">Membangun ekonomi nyata melalui layanan teknologi yang dapat digunakan hari ini.</h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">KriptoAman menghadirkan layanan data, infrastruktur, integrasi Web3, dan monitoring untuk membantu bisnis serta mitra teknis membangun sistem digital yang lebih terhubung, terukur, dan siap berkembang.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="mailto:kriptoaman@gmail.com?subject=KriptoAman%20Enterprise%20Inquiry" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-600 px-6 text-sm font-black transition hover:bg-sky-500">Hubungi Tim Enterprise</a>
              <a href="/KAMNetworkDocs" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/70 px-6 text-sm font-bold text-slate-200 transition hover:border-slate-500">Lihat Dokumentasi Jaringan</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.title} className="rounded-[28px] border border-slate-800 bg-slate-900/65 p-6 shadow-2xl shadow-black/10">
              <h2 className="text-xl font-black">{service.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{service.description}</p>
              <p className="mt-6 text-lg font-black text-emerald-300">{service.price}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{service.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/45 px-5 py-4 text-xs leading-6 text-slate-400">
          <p>*Harga bersifat indikatif dan dapat disesuaikan berdasarkan ruang lingkup, kapasitas, SLA, durasi, serta kebutuhan teknis. Harga final dituangkan dalam proposal atau kontrak resmi PT Kripto Aman Indonesia. Pajak mengikuti ketentuan yang berlaku.</p>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/35">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Ekonomi berbasis penggunaan</p>
            <h2 className="mt-3 text-2xl font-black">Kontrak layanan & infrastruktur nyata</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">KriptoAman membangun pertumbuhan melalui layanan yang digunakan oleh pelanggan dan mitra, dengan ruang lingkup serta hasil kerja yang dapat diukur.</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Utility Jaringan KAM</p>
            <h2 className="mt-3 text-2xl font-black">Penggunaan jaringan yang terukur</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Native KAM digunakan untuk fungsi jaringan yang didukung secara teknis. Aktivitas dan biaya jaringan dilaporkan berdasarkan data on-chain yang dapat diverifikasi.</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Transparansi & Integritas</p>
            <h2 className="mt-3 text-2xl font-black">Data yang dapat diverifikasi</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">KriptoAman mengutamakan penggunaan jaringan yang nyata, informasi faktual, dan transparansi data untuk mendukung kepercayaan serta pertumbuhan ekosistem jangka panjang.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black">Mulai dari pilot yang terukur</h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-400">Setiap engagement dimulai dari tujuan yang jelas, ruang lingkup terukur, deliverable yang disepakati, serta proposal atau kontrak yang mendukung hubungan bisnis profesional dan berkelanjutan.</p>
        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/45 px-5 py-4 text-left text-xs leading-6 text-slate-400">
          <strong className="text-slate-200">Informasi layanan:</strong> KriptoAman Enterprise menyediakan layanan teknologi dan infrastruktur. Penawaran pada halaman ini bukan penawaran investasi, layanan perdagangan aset kripto, layanan kustodian, atau jaminan keuntungan atas KAM maupun aset digital lainnya. Aktivitas yang memerlukan izin atau persetujuan khusus mengikuti ketentuan yang berlaku.
        </div>
        <a href="mailto:kriptoaman@gmail.com?subject=Permintaan%20Pilot%20Enterprise%20KriptoAman" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-600 px-7 text-sm font-black transition hover:bg-emerald-500">Ajukan Pilot Enterprise</a>
      </section>
    </main>
  );
}
