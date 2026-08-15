import React from 'react';
import { Shield, ExternalLink, BookOpen, Globe2, LockKeyhole, BadgeCheck } from 'lucide-react';

const PROFILE_IMAGE = '/images/raden-abdul-rahman-founder.jpg';

export default function Founder() {
  return (
    <main className="min-h-screen bg-[#060d1a] text-white pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.2em]">Founder & CEO</p>
        <section className="mt-3 grid lg:grid-cols-[360px_1fr] gap-6 items-stretch">
          <div className="rounded-3xl overflow-hidden border border-sky-500/20 bg-slate-900/70 min-h-[420px]">
            <img src={PROFILE_IMAGE} alt="Raden Abdul Rahman, M.Sc. — Founder & CEO KriptoAman" className="w-full h-full object-cover object-center" />
          </div>
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Raden Abdul Rahman, M.Sc.</h1>
            <p className="text-sky-300 font-semibold mt-2">Founder & CEO · KriptoAman</p>
            <p className="text-slate-300 leading-relaxed mt-5 max-w-3xl">Memimpin pengembangan KriptoAman dengan fokus pada keamanan informasi, transparansi data, edukasi aset digital, dan pengalaman pengguna yang profesional.</p>
            <p className="text-slate-400 leading-relaxed mt-3 max-w-3xl">KriptoAman dikembangkan sebagai platform informasi dan analitik aset digital yang membantu pengguna memahami pasar dengan pendekatan yang bertanggung jawab dan berorientasi pada keamanan.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-7">
              {[['Keamanan Informasi', Shield], ['Transparansi & Integritas', BadgeCheck], ['Edukasi & Literasi', BookOpen], ['Teknologi Digital', Globe2]].map(([label, Icon]) => (
                <div key={label} className="rounded-2xl border border-slate-700/50 bg-slate-950/40 p-4 flex items-center gap-3"><Icon className="w-5 h-5 text-sky-300"/><span className="text-sm font-semibold">{label}</span></div>
              ))}
            </div>
            <a href="https://radenabdulrahman.com/" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-5 py-3 text-sm font-bold text-sky-300 hover:bg-sky-500/15">Profil Resmi <ExternalLink className="w-4 h-4"/></a>
          </div>
        </section>
        <section className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-6"><h2 className="font-bold text-lg">Visi Kepemimpinan</h2><p className="text-slate-400 text-sm leading-relaxed mt-3">Mendorong ekosistem informasi aset digital yang aman, transparan, edukatif, dan dapat dipahami oleh beragam pengguna.</p></div>
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-6"><h2 className="font-bold text-lg flex items-center gap-2"><LockKeyhole className="w-5 h-5 text-sky-300"/>Komitmen Platform</h2><p className="text-slate-400 text-sm leading-relaxed mt-3">Rilis publik memprioritaskan pemantauan dan informasi. KriptoAman tidak meminta seed phrase atau private key pengguna.</p></div>
        </section>
      </div>
    </main>
  );
}
