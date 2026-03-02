import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Bitcoin, Building2, Wallet, AlertCircle, Copy, CheckCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Crypto address regex validators ──────────────────────────────────────────
const CRYPTO_VALIDATORS = {
  BTC:  /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/,
  ETH:  /^0x[a-fA-F0-9]{40}$/,
  USDT: /^(0x[a-fA-F0-9]{40}|T[a-zA-Z0-9]{33})$/,
  SOL:  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  BNB:  /^0x[a-fA-F0-9]{40}$/,
  LTC:  /^(L|M|ltc1)[a-zA-HJ-NP-Z0-9]{25,62}$/,
  DOGE: /^D[a-zA-HJ-NP-Z0-9]{33}$/,
};

const COINS = [
  { id: 'BTC',  label: 'Bitcoin',   color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/30' },
  { id: 'ETH',  label: 'Ethereum',  color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  { id: 'USDT', label: 'USDT',      color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30' },
  { id: 'SOL',  label: 'Solana',    color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
  { id: 'BNB',  label: 'BNB',       color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  { id: 'LTC',  label: 'Litecoin',  color: 'text-slate-400',  bg: 'bg-slate-500/15 border-slate-500/30' },
  { id: 'DOGE', label: 'Dogecoin',  color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
];

const BANK_LIST = ['BCA', 'BNI', 'BRI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Danamon', 'Permata', 'OVO', 'GoPay', 'Dana', 'ShopeePay'];

const STORAGE_KEY_CRYPTO = 'cv_crypto_addresses';
const STORAGE_KEY_BANK   = 'cv_bank_accounts_v2';

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-slate-600">
      <Icon className="w-8 h-8" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ── Crypto Address Form ───────────────────────────────────────────────────────
function CryptoForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { coin: 'BTC', label: '', address: '', network: '' });
  const [error, setError] = useState('');

  const validate = () => {
    if (!form.label.trim()) return 'Label wajib diisi.';
    if (!form.address.trim()) return 'Alamat wajib diisi.';
    const regex = CRYPTO_VALIDATORS[form.coin];
    if (regex && !regex.test(form.address.trim())) return `Format alamat ${form.coin} tidak valid.`;
    return '';
  };

  const handleSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    onSave({ ...form, address: form.address.trim(), label: form.label.trim() });
  };

  const coin = COINS.find(c => c.id === form.coin);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
      {/* Coin selector */}
      <div>
        <label className="text-slate-400 text-xs mb-1.5 block font-semibold">Koin</label>
        <div className="flex flex-wrap gap-2">
          {COINS.map(c => (
            <button key={c.id} onClick={() => setForm(f => ({ ...f, coin: c.id, address: '' }))}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${form.coin === c.id ? `${c.bg} ${c.color}` : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}>
              {c.id}
            </button>
          ))}
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="text-slate-400 text-xs mb-1 block font-semibold">Label / Nama</label>
        <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          placeholder="mis. Dompet Pribadi"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
      </div>

      {/* Address */}
      <div>
        <label className="text-slate-400 text-xs mb-1 block font-semibold">Alamat {form.coin}</label>
        <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          placeholder={`Masukkan alamat ${form.coin}...`}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono" />
      </div>

      {/* Network (optional) */}
      <div>
        <label className="text-slate-400 text-xs mb-1 block font-semibold">Jaringan <span className="text-slate-600">(opsional)</span></label>
        <input value={form.network} onChange={e => setForm(f => ({ ...f, network: e.target.value }))}
          placeholder="mis. ERC-20, TRC-20, BEP-20"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          <Check className="w-4 h-4" /> Simpan
        </button>
        <button onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors">
          <X className="w-4 h-4" /> Batal
        </button>
      </div>
    </div>
  );
}

// ── Crypto Address Card ───────────────────────────────────────────────────────
function CryptoCard({ item, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const coin = COINS.find(c => c.id === item.coin) || COINS[0];

  const copy = () => {
    navigator.clipboard.writeText(item.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${coin.bg} ${coin.color}`}>{coin.id}</span>
          <span className="text-white text-sm font-semibold truncate">{item.label}</span>
          {item.network && <span className="text-[10px] text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded-full">{item.network}</span>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={copy} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Salin">
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Hapus">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500 font-mono break-all">{item.address}</p>
    </div>
  );
}

// ── Bank Form ─────────────────────────────────────────────────────────────────
function BankForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { bank: 'BCA', accountNumber: '', accountName: '', label: '' });
  const [error, setError] = useState('');

  const validate = () => {
    if (!form.bank) return 'Pilih bank terlebih dahulu.';
    if (!form.accountNumber.trim()) return 'Nomor rekening wajib diisi.';
    if (!/^\d{6,20}$/.test(form.accountNumber.trim())) return 'Nomor rekening harus 6-20 digit angka.';
    if (!form.accountName.trim()) return 'Nama pemilik rekening wajib diisi.';
    if (form.accountName.trim().length < 3) return 'Nama terlalu pendek.';
    return '';
  };

  const handleSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    onSave({ ...form, accountNumber: form.accountNumber.trim(), accountName: form.accountName.trim(), label: form.label.trim() || form.bank });
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
      {/* Bank selector */}
      <div>
        <label className="text-slate-400 text-xs mb-1.5 block font-semibold">Bank / E-Wallet</label>
        <select value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
          {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Account number */}
      <div>
        <label className="text-slate-400 text-xs mb-1 block font-semibold">Nomor Rekening</label>
        <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }))}
          placeholder="mis. 1234567890"
          inputMode="numeric"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono" />
      </div>

      {/* Account name */}
      <div>
        <label className="text-slate-400 text-xs mb-1 block font-semibold">Nama Pemilik Rekening</label>
        <input value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
          placeholder="Sesuai buku tabungan"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
      </div>

      {/* Label (optional) */}
      <div>
        <label className="text-slate-400 text-xs mb-1 block font-semibold">Label <span className="text-slate-600">(opsional)</span></label>
        <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          placeholder="mis. Rekening Utama"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors">
          <Check className="w-4 h-4" /> Simpan
        </button>
        <button onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors">
          <X className="w-4 h-4" /> Batal
        </button>
      </div>
    </div>
  );
}

// ── Bank Card ─────────────────────────────────────────────────────────────────
function BankCard({ item, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(item.accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">{item.label || item.bank}</p>
            <p className="text-slate-500 text-[10px]">{item.bank}</p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={copy} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Salin No. Rekening">
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Hapus">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="bg-slate-900/50 rounded-xl px-3 py-2">
          <p className="text-slate-600 text-[10px] mb-0.5">No. Rekening</p>
          <p className="text-white text-sm font-mono font-semibold">{item.accountNumber}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl px-3 py-2">
          <p className="text-slate-600 text-[10px] mb-0.5">Nama Pemilik</p>
          <p className="text-white text-sm font-semibold truncate">{item.accountName}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PaymentAddressBook() {
  const [tab, setTab] = useState('crypto');
  const [cryptos, setCryptos] = useState([]);
  const [banks, setBanks] = useState([]);
  const [showCryptoForm, setShowCryptoForm] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBank, setEditingBank] = useState(null);

  useEffect(() => {
    setCryptos(load(STORAGE_KEY_CRYPTO));
    setBanks(load(STORAGE_KEY_BANK));
  }, []);

  // ── Crypto CRUD ──────────────────────────────────────────────────────────
  const saveCrypto = (data) => {
    if (editingCrypto) {
      const updated = cryptos.map(c => c.id === editingCrypto.id ? { ...c, ...data } : c);
      setCryptos(updated); save(STORAGE_KEY_CRYPTO, updated);
    } else {
      const updated = [...cryptos, { ...data, id: uid() }];
      setCryptos(updated); save(STORAGE_KEY_CRYPTO, updated);
    }
    setShowCryptoForm(false); setEditingCrypto(null);
  };

  const deleteCrypto = (id) => {
    const updated = cryptos.filter(c => c.id !== id);
    setCryptos(updated); save(STORAGE_KEY_CRYPTO, updated);
  };

  const startEditCrypto = (item) => {
    setEditingCrypto(item); setShowCryptoForm(true);
  };

  // ── Bank CRUD ────────────────────────────────────────────────────────────
  const saveBank = (data) => {
    if (editingBank) {
      const updated = banks.map(b => b.id === editingBank.id ? { ...b, ...data } : b);
      setBanks(updated); save(STORAGE_KEY_BANK, updated);
    } else {
      const updated = [...banks, { ...data, id: uid() }];
      setBanks(updated); save(STORAGE_KEY_BANK, updated);
    }
    setShowBankForm(false); setEditingBank(null);
  };

  const deleteBank = (id) => {
    const updated = banks.filter(b => b.id !== id);
    setBanks(updated); save(STORAGE_KEY_BANK, updated);
  };

  const startEditBank = (item) => {
    setEditingBank(item); setShowBankForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab */}
      <div className="grid grid-cols-2 gap-1 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-1">
        {[
          { id: 'crypto', label: 'Alamat Kripto', icon: Wallet },
          { id: 'bank',   label: 'Rekening Bank', icon: Building2 },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── CRYPTO TAB ── */}
      {tab === 'crypto' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-xs">{cryptos.length} alamat tersimpan</p>
            <button onClick={() => { setEditingCrypto(null); setShowCryptoForm(v => !v); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
              <Plus className="w-3.5 h-3.5" /> Tambah Alamat
            </button>
          </div>

          {showCryptoForm && (
            <CryptoForm initial={editingCrypto} onSave={saveCrypto} onCancel={() => { setShowCryptoForm(false); setEditingCrypto(null); }} />
          )}

          {cryptos.length === 0 && !showCryptoForm
            ? <EmptyState icon={Wallet} text="Belum ada alamat kripto tersimpan." />
            : cryptos.map(item => (
                <CryptoCard key={item.id} item={item} onEdit={startEditCrypto} onDelete={deleteCrypto} />
              ))
          }
        </div>
      )}

      {/* ── BANK TAB ── */}
      {tab === 'bank' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-xs">{banks.length} rekening tersimpan</p>
            <button onClick={() => { setEditingBank(null); setShowBankForm(v => !v); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors">
              <Plus className="w-3.5 h-3.5" /> Tambah Rekening
            </button>
          </div>

          {showBankForm && (
            <BankForm initial={editingBank} onSave={saveBank} onCancel={() => { setShowBankForm(false); setEditingBank(null); }} />
          )}

          {banks.length === 0 && !showBankForm
            ? <EmptyState icon={Building2} text="Belum ada rekening bank tersimpan." />
            : banks.map(item => (
                <BankCard key={item.id} item={item} onEdit={startEditBank} onDelete={deleteBank} />
              ))
          }
        </div>
      )}
    </div>
  );
}