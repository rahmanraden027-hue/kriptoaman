import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, ShieldCheck, Scale, ExternalLink, UserRound } from 'lucide-react';

export default function LegalCorporateInformation() {
  useEffect(() => {
    const title = 'Legal & Corporate Information | PT Kripto Aman Indonesia';
    const description = 'Informasi legal dan korporasi PT Kripto Aman Indonesia, Corporate Office Jakarta, ruang lingkup layanan KriptoAman, posisi regulasi, kepemimpinan, serta kanal verifikasi resmi.';
    const canonicalUrl = 'https://kriptoaman.com/LegalCorporateInformation';

    const previousTitle = document.title;
    document.title = title;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    const descriptionCreated = !descriptionMeta;
    const previousDescription = descriptionMeta?.getAttribute('content') ?? null;
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute('content', description);

    let robotsMeta = document.querySelector('meta[name="robots"]');
    const robotsCreated = !robotsMeta;
    const previousRobots = robotsMeta?.getAttribute('content') ?? null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'index, follow');

    let canonical = document.querySelector('link[rel="canonical"]');
    const canonicalCreated = !canonical;
    const previousCanonical = canonical?.getAttribute('href') ?? null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    return () => {
      document.title = previousTitle;
      if (descriptionCreated) descriptionMeta.remove();
      else if (previousDescription !== null) descriptionMeta.setAttribute('content', previousDescription);
      if (robotsCreated) robotsMeta.remove();
      else if (previousRobots !== null) robotsMeta.setAttribute('content', previousRobots);
      if (canonicalCreated) canonical.remove();
      else if (previousCanonical !== null) canonical.setAttribute('href', previousCanonical);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Link to="/" className="text-sm text-blue-500 hover:underline">← Kembali ke KriptoAman</Link>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Legal & Corporate Information</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight">PT Kripto Aman Indonesia</h1>
          <p className="mt-5 max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Informasi korporasi dan posisi layanan KriptoAman disajikan untuk mendukung transparansi, akuntabilitas, dan komunikasi publik yang dapat diverifikasi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mt-10">
          <article className="rounded-2xl border p-6 bg-card">
            <Building2 className="w-6 h-6 text-blue-500" />
            <h2 className="mt-4 text-lg font-bold">Identitas Korporasi</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              KriptoAman dioperasikan oleh <strong className="text-foreground">PT Kripto Aman Indonesia</strong>, badan usaha Indonesia. Informasi pada halaman ini tidak dimaksudkan sebagai pengganti dokumen resmi yang diterbitkan instansi berwenang.
            </p>
          </article>

          <article className="rounded-2xl border p-6 bg-card">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h2 className="mt-4 text-lg font-bold">Corporate Office</h2>
            <address className="mt-3 not-italic text-sm text-muted-foreground leading-relaxed">
              Soho Capital – Podomoro City, 25th Floor, Unit 2508<br />
              Jl. Letjen S. Parman Kav. 28<br />
              Tanjung Duren Selatan, Grogol Petamburan<br />
              Jakarta Barat, DKI Jakarta 11470 · Indonesia
            </address>
          </article>

          <article className="rounded-2xl border p-6 bg-card">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <h2 className="mt-4 text-lg font-bold">Ruang Lingkup Layanan</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              KriptoAman menyediakan informasi, pemantauan, edukasi, verifikasi berbasis sumber publik, serta analisis risiko indikatif aset digital. Hasil analisis bukan jaminan keamanan, harga, keuntungan, likuiditas, atau keberhasilan listing suatu aset.
            </p>
          </article>

          <article className="rounded-2xl border p-6 bg-card">
            <Scale className="w-6 h-6 text-blue-500" />
            <h2 className="mt-4 text-lg font-bold">Posisi Regulasi</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              KriptoAman tidak menyatakan dirinya sebagai bursa, kustodian, broker, atau penasihat investasi. Status izin, persetujuan, pendaftaran, atau keanggotaan regulator hanya akan dinyatakan setelah dapat diverifikasi melalui keputusan atau sumber resmi yang berlaku.
            </p>
          </article>
        </div>

        <section className="mt-8 rounded-2xl border p-6 bg-card">
          <UserRound className="w-6 h-6 text-blue-500" />
          <h2 className="mt-4 text-lg font-bold">Leadership</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            KriptoAman dipimpin oleh <strong className="text-foreground">Raden Abdul Rahman, M.Sc.</strong> sebagai Founder & CEO KriptoAman dan CEO PT Kripto Aman Indonesia.
          </p>
          <Link to="/founder" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-500 hover:underline">
            Profil Founder & CEO <ExternalLink className="w-4 h-4" />
          </Link>
        </section>

        <section className="mt-8 rounded-2xl border p-6 bg-card">
          <h2 className="text-lg font-bold">Verifikasi & Transparansi</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            Untuk melindungi data perusahaan dan keamanan operasional, informasi sensitif seperti NPWP, QR dokumen, nomor pribadi, kredensial, dan dokumen internal tidak dipublikasikan pada halaman ini. Dokumen korporasi dapat diverifikasi melalui kanal resmi dan instansi berwenang sesuai kebutuhan yang sah.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://ahu.go.id" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted">AHU <ExternalLink className="w-4 h-4" /></a>
            <a href="https://oss.go.id" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted">OSS <ExternalLink className="w-4 h-4" /></a>
            <a href="https://www.ojk.go.id" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted">OJK <ExternalLink className="w-4 h-4" /></a>
          </div>
        </section>

        <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
          Terakhir diperbarui: 29 Agustus 2026. Informasi dapat diperbarui apabila terdapat perubahan korporasi, operasional, atau status regulasi yang telah terverifikasi.
        </p>
      </section>
    </main>
  );
}
