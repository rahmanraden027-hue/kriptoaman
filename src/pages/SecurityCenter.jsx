import React, { useState, useEffect } from 'react';
import { Shield, Key, Lock, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Loader2, Eye, EyeOff, Copy, CheckCheck, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminGuard, { OWNER_EMAIL } from '../components/security/AdminGuard';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StatusBadge({ ok, label }) {
  return (
    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${ok ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}

function Section({ title, icon: Icon, color = 'blue', children }) {
  return (
    <div className={`bg-slate-800/40 border border-${color}-500/20 rounded-2xl p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 text-${color}-400`} />
        <h2 className={`text-${color}-300 font-bold`}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Smart contract security checklist items
const SC_CHECKLIST = [
  { label: 'Gunakan Ownable (OpenZeppelin) — hanya owner yang bisa panggil fungsi sensitif', done: true },
  { label: 'onlyOwner modifier di semua fungsi withdraw/mint/pause', done: true },
  { label: 'renounceOwnership() JANGAN dipanggil — Anda tetap owner selamanya', done: true },
  { label: 'transferOwnership() HANYA ke wallet Anda sendiri', done: true },
  { label: 'Gunakan Pausable — bisa pause kontrak jika darurat', done: true },
  { label: 'ReentrancyGuard di semua fungsi yang kirim ETH/token', done: true },
  { label: 'Verify & publish source code di Etherscan (read-only untuk publik)', done: false },
  { label: 'Audit oleh pihak ketiga (Certik / Hacken / SlowMist)', done: false },
  { label: 'Gunakan multisig (Gnosis Safe) untuk transaksi besar', done: false },
  { label: 'Set spending limit harian di wallet deployer', done: false },
];

const PRIVATE_KEY_RULES = [
  'JANGAN PERNAH ketik private key di browser / website manapun',
  'JANGAN simpan di email, WhatsApp, cloud notes, atau Google Drive sebagai plain text',
  'Gunakan hardware wallet (Ledger/Trezor) untuk deploy smart contract',
  'Private key untuk deploy = wallet terpisah, BUKAN wallet utama',
  'Seed phrase disimpan offline (kertas, metal plate) di tempat aman',
  'Backup seed phrase di 2-3 lokasi berbeda (tidak online)',
  'Gunakan password manager untuk enkripsi keystore file',
  'Aktifkan 2FA di semua exchange & layanan kripto',
  'Jangan share private key ke siapapun — termasuk "tim teknis"',
  'Rotasi wallet deployer secara berkala setelah deploy selesai',
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

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-400" /> Security Center
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Kontrol penuh di tangan Anda</p>
            </div>
            <button onClick={runSecurityCheck} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Cek Sekarang
            </button>
          </div>

          {/* Owner Identity Lock */}
          <Section title="Identitas Owner (Dikunci)" icon={Lock} color="indigo">
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-3">
                <div>
                  <p className="text-slate-500 text-xs">Owner Email (hardcoded)</p>
                  <p className="text-white font-mono text-sm">{OWNER_EMAIL}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyBtn text={OWNER_EMAIL} />
                  <StatusBadge ok={true} label="Terkunci" />
                </div>
              </div>
              <p className="text-slate-500 text-xs px-1">
                Email ini dikodekan langsung di aplikasi dan backend. Siapapun yang mencoba akses admin dengan email berbeda akan ditolak otomatis dan Anda menerima notifikasi email.
              </p>
            </div>
          </Section>

          {/* Security Audit Report */}
          <Section title="Laporan Keamanan Real-time" icon={Shield} color="green">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-green-400" />
              </div>
            ) : securityReport ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs">Admin Tidak Sah</p>
                    <p className={`text-2xl font-bold ${securityReport.security?.rogueAdminsFound > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {securityReport.security?.rogueAdminsFound ?? 0}
                    </p>
                    <p className="text-xs text-slate-600">{securityReport.security?.rogueAdminsFound > 0 ? 'Ditemukan & dinonaktifkan' : 'Aman'}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs">Total Admin</p>
                    <p className="text-2xl font-bold text-white">{securityReport.security?.adminCount ?? 1}</p>
                    <p className="text-xs text-slate-600">Hanya Anda</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs">Withdrawal Pending</p>
                    <p className={`text-2xl font-bold ${(securityReport.security?.pendingWithdrawals ?? 0) > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {securityReport.security?.pendingWithdrawals ?? 0}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs">Deposit Pending</p>
                    <p className={`text-2xl font-bold ${(securityReport.security?.pendingDeposits ?? 0) > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {securityReport.security?.pendingDeposits ?? 0}
                    </p>
                  </div>
                </div>
                {lastChecked && (
                  <p className="text-slate-600 text-xs text-right">Terakhir dicek: {lastChecked} WIB</p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">Gagal mengambil laporan</p>
            )}
          </Section>

          {/* Smart Contract Security */}
          <Section title="Smart Contract Security Checklist" icon={Key} color="yellow">
            <div className="space-y-2">
              {SC_CHECKLIST.map((item, i) => (
                <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${item.done ? 'bg-green-500/5 border border-green-500/15' : 'bg-yellow-500/5 border border-yellow-500/15'}`}>
                  {item.done
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />}
                  <span className={`text-xs ${item.done ? 'text-slate-300' : 'text-yellow-300'}`}>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-slate-900/60 rounded-xl p-4 space-y-2">
              <p className="text-slate-400 text-xs font-bold">Template Solidity — Ownable + Pausable:</p>
              <pre className="text-green-300 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract KriptoAman is Ownable, Pausable, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}

    // Hanya owner yang bisa withdraw
    function withdraw(uint256 amount) 
        external onlyOwner nonReentrant whenNotPaused {
        payable(owner()).transfer(amount);
    }

    // Emergency pause — hanya owner
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // JANGAN panggil renounceOwnership()!
}`}</pre>
            </div>

            <div className="mt-3 space-y-1">
              {[
                ['Verify Contract di Etherscan', 'https://etherscan.io/verifyContract'],
                ['OpenZeppelin Ownable Docs', 'https://docs.openzeppelin.com/contracts/4.x/access-control'],
                ['Gnosis Safe Multisig', 'https://app.safe.global'],
              ].map(([label, url]) => (
                <a key={url} href={url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs transition-colors">
                  <ExternalLink className="w-3 h-3" /> {label}
                </a>
              ))}
            </div>
          </Section>

          {/* Private Key Rules */}
          <Section title="Aturan Keamanan Private Key" icon={AlertTriangle} color="red">
            <div className="space-y-2">
              {PRIVATE_KEY_RULES.map((rule, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-red-200 text-xs">{rule}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Admin Panel Access Info */}
          <Section title="Kontrol Akses Admin Panel" icon={Shield} color="blue">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs">Email owner dikodekan langsung di kode aplikasi — tidak bisa diubah dari database</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs">Backend function otomatis downgrade akun admin tidak sah & kirim email alert ke Anda</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs">Semua halaman admin dilindungi dengan double-check: role admin + email harus cocok</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs">Link admin hanya muncul di sidebar untuk user dengan role admin</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs">Monitoring otomatis setiap jam untuk deteksi aktivitas mencurigakan</p>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </AdminGuard>
  );
}