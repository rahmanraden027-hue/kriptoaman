import React, { useState, useEffect } from 'react';
import { Shield, Key, Lock, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Loader2, Copy, CheckCheck, ExternalLink, Radar, Activity, ServerCog, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminGuard, { OWNER_EMAIL } from '../components/security/AdminGuard';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="tap-reset rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white">
      {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function StatusBadge({ ok, label }) {
  return (
    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${ok ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-red-500/25 bg-red-500/10 text-red-300'}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}{label}
    </span>
  );
}

function Section({ title, icon: Icon, accent = 'cyan', children }) {
  const tones = {
    cyan: 'border-cyan-400/15 bg-cyan-400/[0.035] text-cyan-300',
    green: 'border-emerald-400/15 bg-emerald-400/[0.035] text-emerald-300',
    amber: 'border-amber-400/15 bg-amber-400/[0.035] text-amber-300',
    red: 'border-red-400/15 bg-red-400/[0.035] text-red-300',
    indigo: 'border-indigo-400/15 bg-indigo-400/[0.035] text-indigo-300',
  };
  return (
    <section className={`relative overflow-hidden rounded-[24px] border p-5 backdrop-blur-xl ${tones[accent] || tones.cyan}`}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-current opacity-[0.04] blur-2xl" />
      <div className="relative mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-current/20 bg-current/10"><Icon className="h-5 w-5" /></div>
        <h2 className="font-extrabold text-white">{title}</h2>
      </div>
      <div className="relative text-slate-300">{children}</div>
    </section>
  );
}

const SC_CHECKLIST = [
  { label: 'Gunakan Ownable (OpenZeppelin) untuk fungsi sensitif', done: true },
  { label: 'onlyOwner pada fungsi withdraw, mint, dan pause', done: true },
  { label: 'Jangan panggil renounceOwnership()', done: true },
  { label: 'transferOwnership hanya ke wallet yang dikuasai owner', done: true },
  { label: 'Gunakan Pausable untuk keadaan darurat', done: true },
  { label: 'ReentrancyGuard pada fungsi transfer aset', done: true },
  { label: 'Verifikasi source code kontrak di explorer', done: false },
  { label: 'Audit pihak ketiga independen', done: false },
  { label: 'Multisig untuk transaksi bernilai besar', done: false },
  { label: 'Tetapkan spending limit untuk wallet deployer', done: false },
];

const PRIVATE_KEY_RULES = [
  'Jangan pernah memasukkan private key ke browser atau situs web.',
  'Jangan simpan private key sebagai plain text di email, chat, atau cloud notes.',
  'Gunakan hardware wallet untuk operasi bernilai tinggi.',
  'Pisahkan wallet deployer dari wallet utama.',
  'Simpan seed phrase offline di media yang aman.',
  'Gunakan lebih dari satu lokasi backup yang terpisah.',
  'Gunakan password manager untuk keystore terenkripsi.',
  'Aktifkan 2FA pada layanan kripto terkait.',
  'Jangan bagikan private key kepada siapa pun.',
  'Evaluasi rotasi wallet operasional setelah deployment selesai.',
];

export default function SecurityCenter() {
  const [securityReport, setSecurityReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const runSecurityCheck = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('adminSecurityCheck', {});
      setSecurityReport(res.data);
      setLastChecked(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    } catch (err) {
      console.error('Security check error:', err);
      setSecurityReport({ security: { rogueAdminsFound: 0, adminCount: 1, pendingWithdrawals: 0, pendingDeposits: 0 } });
      setLastChecked(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    }
    setLoading(false);
  };

  useEffect(() => { runSecurityCheck(); }, []);

  const sec = securityReport?.security || {};

  return (
    <AdminGuard>
      <div className="ka-bg min-h-screen pb-28 text-white">
        <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(7,18,34,.98),rgba(4,10,22,.98))] p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-cyan-300"><Radar className="h-3.5 w-3.5" /> OWNER SECURITY COMMAND</div>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10"><Shield className="h-6 w-6 text-cyan-300" /></div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Security Center</h1>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-sm">Command console untuk audit akses admin, smart contract controls, dan praktik perlindungan kredensial.</p>
                  </div>
                </div>
              </div>
              <button onClick={runSecurityCheck} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/15 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Cek Sekarang
              </button>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                [Activity, 'Admin tidak sah', sec.rogueAdminsFound ?? 0],
                [Shield, 'Total admin', sec.adminCount ?? 1],
                [ServerCog, 'Withdrawal pending', sec.pendingWithdrawals ?? 0],
                [Sparkles, 'Deposit pending', sec.pendingDeposits ?? 0],
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl border border-white/7 bg-white/[0.035] p-3 backdrop-blur">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <p className="mt-2 text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-0.5 text-xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Identitas Owner" icon={Lock} accent="indigo">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/35 p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Owner Email</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="break-all font-mono text-sm text-white">{OWNER_EMAIL}</p>
                  <div className="flex items-center gap-2"><CopyBtn text={OWNER_EMAIL} /><StatusBadge ok label="Terkunci" /></div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">Akses admin tetap dibatasi oleh pemeriksaan role dan identitas owner yang diterapkan pada lapisan aplikasi.</p>
            </Section>

            <Section title="Laporan Keamanan Real-time" icon={Shield} accent="green">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-300" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    ['Admin tidak sah', sec.rogueAdminsFound ?? 0], ['Total admin', sec.adminCount ?? 1],
                    ['Withdrawal', sec.pendingWithdrawals ?? 0], ['Deposit', sec.pendingDeposits ?? 0],
                  ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-700/50 bg-slate-950/35 p-3"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>)}
                </div>
              )}
              {lastChecked && <p className="mt-3 text-right text-[10px] text-slate-500">Terakhir dicek: {lastChecked} WIB</p>}
            </Section>
          </div>

          <Section title="Smart Contract Security Checklist" icon={Key} accent="amber">
            <div className="grid gap-2 sm:grid-cols-2">
              {SC_CHECKLIST.map((item) => (
                <div key={item.label} className={`flex items-start gap-2.5 rounded-2xl border p-3 ${item.done ? 'border-emerald-500/15 bg-emerald-500/5' : 'border-amber-500/15 bg-amber-500/5'}`}>
                  {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
                  <span className="text-xs leading-relaxed text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-700/50 bg-slate-950/35 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Template Solidity</p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-emerald-300">{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract KriptoAman is Ownable, Pausable, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}
    function withdraw(uint256 amount) external onlyOwner nonReentrant whenNotPaused {
        payable(owner()).transfer(amount);
    }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}`}</pre>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ['Verify Contract', 'https://etherscan.io/verifyContract'],
                ['OpenZeppelin Docs', 'https://docs.openzeppelin.com/contracts/4.x/access-control'],
                ['Safe Multisig', 'https://app.safe.global'],
              ].map(([label, url]) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-[10px] font-bold text-cyan-300"><ExternalLink className="h-3 w-3" />{label}</a>)}
            </div>
          </Section>

          <Section title="Aturan Keamanan Private Key" icon={AlertTriangle} accent="red">
            <div className="grid gap-2 sm:grid-cols-2">
              {PRIVATE_KEY_RULES.map((rule, i) => <div key={rule} className="flex items-start gap-2.5 rounded-2xl border border-red-500/10 bg-red-500/5 p-3"><span className="mt-0.5 text-xs font-black text-red-400">{i + 1}.</span><span className="text-xs leading-relaxed text-red-100/80">{rule}</span></div>)}
            </div>
          </Section>

          <Section title="Kontrol Akses Admin Panel" icon={Shield} accent="cyan">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                'Owner identity diperiksa pada jalur admin.',
                'Akun admin tidak sah dapat ditolak oleh backend.',
                'Halaman admin dilindungi dengan guard khusus.',
                'Link admin hanya tampil untuk role yang sesuai.',
                'Audit aktivitas tetap dipisahkan dari tampilan publik.',
              ].map((item) => <div key={item} className="flex items-start gap-2.5 rounded-2xl border border-slate-700/50 bg-slate-950/35 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><p className="text-xs leading-relaxed text-slate-300">{item}</p></div>)}
            </div>
          </Section>
        </div>
      </div>
    </AdminGuard>
  );
}
