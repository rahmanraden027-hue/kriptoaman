export default function HeroBanner() {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6">
      <h1 className="text-3xl font-bold text-white">
        Selamat Datang di KriptoAman
      </h1>

      <p className="text-slate-300 mt-3">
        Platform aset kripto yang aman, nyaman, transparan, dan terintegrasi.
      </p>

      <div className="mt-6">
        <button className="px-5 py-3 rounded-xl bg-blue-600 text-white">
          Mulai Trading
        </button>
      </div>
    </div>
  );
}
