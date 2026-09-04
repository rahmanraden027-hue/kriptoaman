export default function Enterprise() {
  const services = [
    {
      title: 'KriptoAman Data & API',
      description: 'Akses data pasar, monitoring, dan integrasi data aset digital untuk dashboard, riset, dan aplikasi internal bisnis.',
      price: 'Mulai Rp1.500.000 / bulan',
      note: 'Paket dan batas penggunaan disesuaikan kebutuhan.'
    },
    {
      title: 'Dedicated KAM RPC',
      description: 'Endpoint RPC khusus untuk pengembangan, observability, dan kebutuhan aplikasi yang memerlukan kapasitas terpisah dari public RPC.',
      price: 'Mulai Rp2.000.000 / bulan',
      note: 'Tidak termasuk custody, pengelolaan private key, atau jaminan keuntungan.'
    },
    {
      title: 'Managed Node Infrastructure',
      description: 'Deployment, hardening, monitoring, backup, dan dukungan operasional node untuk kebutuhan institusi dan mitra teknis.',
      price: 'Mulai Rp3.500.000 / bulan',
      note: 'Kunci dan otorisasi kritikal tetap berada dalam kontrol pemilik yang sah.'
    },
    {
      title: 'Web3 Integration',
      description: 'Integrasi wallet, RPC, explorer, smart-contract interface, interoperability, dan konektivitas aplikasi enterprise.',
      price: 'Mulai Rp15.000.000 / proyek',
      note: 'Scope, milestone, pajak, dan SLA dituangkan dalam kontrak.'
    },
    {
      title: 'Security & Network Monitoring',
      description: 'Monitoring uptime, health check, alerting, RPC consistency, dan bukti operasional untuk sistem blockchain dan Web3.',
      price: 'Mulai Rp3.000.000 / bulan',
      note: 'Bukan pengganti audit keamanan independen.'
    },
    {
      title: 'Technical Research & Architecture',
      description: 'Kajian arsitektur blockchain, integrasi jaringan, dokumentasi teknis, dan readiness assessment untuk tim produk dan teknologi.',
      price: 'Custom engagement',
      note: 'Tidak mencakup nasihat investasi atau janji hasil finansial.'
    }
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(16,185,129,.12),transparent_38%)]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">KriptoAman Enterprise</p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">Membangun ekonomi nyata melalui layanan teknologi yang dapat digunakan hari ini.</h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">KriptoAman menyediakan layanan data, infrastruktur, integrasi Web3, dan monitoring yang dapat dikontrak oleh bisnis serta mitra teknis. Pendapatan layanan berasal dari penggunaan nyata—bukan dari janji kenaikan harga token.</p>
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
      </section>

      <section className="border-y border-slate-800 bg-slate-900/35">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Pendapatan nyata</p>
            <h2 className="mt-3 text-2xl font-black">Kontrak layanan & penggunaan infrastruktur</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Target utama adalah pendapatan dari pelanggan dan mitra yang menggunakan layanan KriptoAman secara nyata.</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Utility KAM</p>
            <h2 className="mt-3 text-2xl font-black">Gas & aktivitas jaringan</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">KAM diarahkan sebagai native utility untuk penggunaan jaringan. Nilai ekonominya harus dibangun dari aktivitas dan permintaan riil.</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Market integrity</p>
            <h2 className="mt-3 text-2xl font-black">Tanpa volume atau harga artifisial</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">KriptoAman tidak menggunakan wash trading, transaksi semu, atau token pasangan buatan untuk menciptakan kesan likuiditas dan valuasi.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black">Mulai dari pilot yang terukur</h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-400">Setiap engagement dimulai dari ruang lingkup yang jelas, deliverable terukur, invoice/kontrak, dan rekonsiliasi pendapatan perusahaan. Layanan ini tidak merupakan penawaran investasi, jaminan keuntungan, atau klaim bahwa KAM telah memperoleh persetujuan perdagangan tertentu.</p>
        <a href="mailto:kriptoaman@gmail.com?subject=Permintaan%20Pilot%20Enterprise%20KriptoAman" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-600 px-7 text-sm font-black transition hover:bg-emerald-500">Ajukan Pilot Enterprise</a>
      </section>
    </main>
  );
}
