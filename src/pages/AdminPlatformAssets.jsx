import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Check, X, Building2, Wallet,
  AlertCircle, Copy, CheckCheck, Loader2, ShieldAlert, ToggleLeft, ToggleRight
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function SectionHeader({ icon: Icon, title, count, onAdd, addLabel, color = 'blue' }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 text-${color}-400`} />
        <h2 className="text-white font-bold text-lg">{title}</h2>
        <span className={`text-xs bg-${color}-500/15 text-${color}-400 border border-${color}-500/30 px-2 py-0.5 rounded-full font-semibold`}>{count}</span>
      </div>
      <button onClick={onAdd}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-${color}-600 hover:bg-${color}-500 text-white text-xs font-semibold transition-colors`}>
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}

// ── Crypto Form ───────────────────────────────────────────────────────────────
function CryptoForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { coin: 'BTC', label: '', address: '', network: '', isActive: true, minDeposit: '', maxDeposit: '', notes: '' });
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
    onSave({ ...form, address: form.address.trim(), label: form.label.trim(), minDeposit: form.minDeposit ? parseFloat(form.minDeposit) : null });
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3 mb-4">
      <p className="text-white font-semibold text-sm">{initial?.id ? 'Edit Alamat Kripto' : 'Tambah Alamat Kripto Baru'}</p>

      <div>
        <label className="text-slate-400 text-xs mb-1.5 block font-semibold">Koin</label>
        <div className="flex flex-wrap gap-2">
          {COINS.map(c => (
            <button key={c.id} onClick={() => setForm(f => ({ ...f, coin: c.id }))}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${form.coin === c.id ? `${c.bg} ${c.color}` : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}>
              {c.id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs mb-1 block font-semibold">Label</label>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="mis. Alamat Deposit USDT"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1 block font-semibold">Jaringan (opsional)</label>
          <input value={form.network} onChange={e => setForm(f => ({ ...f, network: e.target.value }))}
            placeholder="ERC-20, TRC-20..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-xs mb-1 block font-semibold">Alamat {form.coin}</label>
        <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          placeholder={`Alamat ${form.coin} platform...`}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs mb-1 block font-semibold">Minimum Deposit (opsional)</label>
          <input type="number" value={form.minDeposit} onChange={e => setForm(f => ({ ...f, minDeposit: e.target.value }))}
            placeholder={`mis. 4.7`} min="0" step="any"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500" />
          <p className="text-slate-600 text-[10px] mt-1">Dalam satuan {form.coin}</p>
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1 block font-semibold">Catatan Admin (opsional)</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Catatan internal..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
          className={`w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-slate-600'} relative`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
        </div>
        <span className="text-slate-300 text-sm">{form.isActive ? 'Aktif' : 'Nonaktif'}</span>
      </label>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Simpan
        </button>
        <button onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors">
          <X className="w-4 h-4" /> Batal
        </button>
      </div>
    </div>
  );
}

// ── Crypto Card ───────────────────────────────────────────────────────────────
function CryptoCard({ item, onEdit, onDelete, onToggle }) {
  const coin = COINS.find(c => c.id === item.coin) || COINS[0];
  return (
    <div className={`border rounded-2xl p-4 transition-all ${item.isActive !== false ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-900/30 border-slate-800/40 opacity-60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border shrink-0 ${coin.bg} ${coin.color}`}>{coin.id}</span>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{item.label}</p>
            <div className="flex items-center gap-1.5">
              {item.network && <span className="text-[10px] text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded-full">{item.network}</span>}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${item.isActive !== false ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {item.isActive !== false ? '● Aktif' : '● Nonaktif'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <CopyBtn text={item.address} />
          <button onClick={() => onToggle(item)} className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Toggle aktif">
            {item.isActive !== false ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500 font-mono break-all">{item.address}</p>
      {item.minDeposit > 0 && (
        <p className="mt-1 text-[11px] text-amber-500">Min. deposit: {item.minDeposit} {item.coin}</p>
      )}
      {item.notes && <p className="mt-1 text-[11px] text-slate-600 italic">{item.notes}</p>}
    </div>
  );
}

// ── Bank Form ─────────────────────────────────────────────────────────────────
function BankForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { bank: 'BCA', accountNumber: '', accountName: '', label: '', isActive: true, notes: '' });
  const [error, setError] = useState('');

  const validate = () => {
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
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3 mb-4">
      <p className="text-white font-semibold text-sm">{initial?.id ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs mb-1 block font-semibold">Bank / E-Wallet</label>
          <select value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
            {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1 block font-semibold">Label (opsional)</label>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="mis. Rekening Utama"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs mb-1 block font-semibold">Nomor Rekening</label>
          <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }))}
            placeholder="1234567890" inputMode="numeric"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-500 font-mono" />
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1 block font-semibold">Nama Pemilik</label>
          <input value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
            placeholder="Sesuai buku tabungan"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-500" />
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-xs mb-1 block font-semibold">Catatan Admin (opsional)</label>
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Catatan internal..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-500" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
          className={`w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-slate-600'} relative`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
        </div>
        <span className="text-slate-300 text-sm">{form.isActive ? 'Aktif' : 'Nonaktif'}</span>
      </label>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Simpan
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
function BankCard({ item, onEdit, onDelete, onToggle }) {
  return (
    <div className={`border rounded-2xl p-4 transition-all ${item.isActive !== false ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-900/30 border-slate-800/40 opacity-60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">{item.label || item.bank}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px]">{item.bank}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${item.isActive !== false ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {item.isActive !== false ? '● Aktif' : '● Nonaktif'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <CopyBtn text={item.accountNumber} />
          <button onClick={() => onToggle(item)} className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Toggle aktif">
            {item.isActive !== false ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
      {item.notes && <p className="mt-2 text-[11px] text-slate-600 italic">{item.notes}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPlatformAssets() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('crypto');
  const [showCryptoForm, setShowCryptoForm] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBank, setEditingBank] = useState(null);

  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { data: cryptos = [], isLoading: loadingCrypto } = useQuery({
    queryKey: ['platformCryptoAddresses'],
    queryFn: () => base44.entities.PlatformCryptoAddress.list(),
    enabled: user?.role === 'admin',
  });

  const { data: banks = [], isLoading: loadingBank } = useQuery({
    queryKey: ['platformBankAccounts'],
    queryFn: () => base44.entities.PlatformBankAccount.list(),
    enabled: user?.role === 'admin',
  });

  const createCrypto  = useMutation({ mutationFn: d => base44.entities.PlatformCryptoAddress.create(d), onSuccess: () => { qc.invalidateQueries(['platformCryptoAddresses']); setShowCryptoForm(false); setEditingCrypto(null); } });
  const updateCrypto  = useMutation({ mutationFn: ({ id, d }) => base44.entities.PlatformCryptoAddress.update(id, d), onSuccess: () => { qc.invalidateQueries(['platformCryptoAddresses']); setShowCryptoForm(false); setEditingCrypto(null); } });
  const deleteCrypto  = useMutation({ mutationFn: id => base44.entities.PlatformCryptoAddress.delete(id), onSuccess: () => qc.invalidateQueries(['platformCryptoAddresses']) });

  const createBank    = useMutation({ mutationFn: d => base44.entities.PlatformBankAccount.create(d), onSuccess: () => { qc.invalidateQueries(['platformBankAccounts']); setShowBankForm(false); setEditingBank(null); } });
  const updateBank    = useMutation({ mutationFn: ({ id, d }) => base44.entities.PlatformBankAccount.update(id, d), onSuccess: () => { qc.invalidateQueries(['platformBankAccounts']); setShowBankForm(false); setEditingBank(null); } });
  const deleteBank    = useMutation({ mutationFn: id => base44.entities.PlatformBankAccount.delete(id), onSuccess: () => qc.invalidateQueries(['platformBankAccounts']) });

  const saveCrypto = (data) => {
    if (editingCrypto) updateCrypto.mutate({ id: editingCrypto.id, d: data });
    else createCrypto.mutate(data);
  };
  const saveBank = (data) => {
    if (editingBank) updateBank.mutate({ id: editingBank.id, d: data });
    else createBank.mutate(data);
  };

  const toggleCrypto = (item) => updateCrypto.mutate({ id: item.id, d: { isActive: !(item.isActive !== false) } });
  const toggleBank   = (item) => updateBank.mutate({ id: item.id, d: { isActive: !(item.isActive !== false) } });

  // ── Access guard ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
    </div>
  );

  if (!user || user.role !== 'admin') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-red-400 font-bold text-lg">Akses Ditolak</h2>
        <p className="text-slate-400 text-sm">Hanya admin yang dapat mengakses halaman ini.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Aset Platform</h1>
              <p className="text-slate-500 text-xs">Kelola alamat kripto & rekening bank platform</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-amber-300 text-xs">Alamat & rekening yang aktif akan ditampilkan ke pengguna saat deposit.</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
            <p className="text-slate-500 text-xs mb-1">Alamat Kripto</p>
            <p className="text-white text-2xl font-bold">{cryptos.length}</p>
            <p className="text-green-400 text-xs">{cryptos.filter(c => c.isActive !== false).length} aktif</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
            <p className="text-slate-500 text-xs mb-1">Rekening Bank</p>
            <p className="text-white text-2xl font-bold">{banks.length}</p>
            <p className="text-green-400 text-xs">{banks.filter(b => b.isActive !== false).length} aktif</p>
          </div>
        </div>

        {/* Tab */}
        <div className="grid grid-cols-2 gap-1 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-1">
          {[{ id: 'crypto', label: 'Alamat Kripto', icon: Wallet }, { id: 'bank', label: 'Rekening Bank', icon: Building2 }].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── CRYPTO SECTION ── */}
        {tab === 'crypto' && (
          <div>
            <SectionHeader icon={Wallet} title="Alamat Kripto Platform" count={cryptos.length} color="blue"
              onAdd={() => { setEditingCrypto(null); setShowCryptoForm(v => !v); }} addLabel="Tambah Alamat" />

            {showCryptoForm && (
              <CryptoForm initial={editingCrypto} saving={createCrypto.isPending || updateCrypto.isPending}
                onSave={saveCrypto} onCancel={() => { setShowCryptoForm(false); setEditingCrypto(null); }} />
            )}

            {loadingCrypto ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
            ) : cryptos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-600">
                <Wallet className="w-8 h-8" />
                <p className="text-sm">Belum ada alamat kripto platform.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cryptos.map(item => (
                  <CryptoCard key={item.id} item={item}
                    onEdit={i => { setEditingCrypto(i); setShowCryptoForm(true); }}
                    onDelete={id => deleteCrypto.mutate(id)}
                    onToggle={toggleCrypto} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BANK SECTION ── */}
        {tab === 'bank' && (
          <div>
            <SectionHeader icon={Building2} title="Rekening Bank Platform" count={banks.length} color="green"
              onAdd={() => { setEditingBank(null); setShowBankForm(v => !v); }} addLabel="Tambah Rekening" />

            {showBankForm && (
              <BankForm initial={editingBank} saving={createBank.isPending || updateBank.isPending}
                onSave={saveBank} onCancel={() => { setShowBankForm(false); setEditingBank(null); }} />
            )}

            {loadingBank ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
            ) : banks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-600">
                <Building2 className="w-8 h-8" />
                <p className="text-sm">Belum ada rekening bank platform.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {banks.map(item => (
                  <BankCard key={item.id} item={item}
                    onEdit={i => { setEditingBank(i); setShowBankForm(true); }}
                    onDelete={id => deleteBank.mutate(id)}
                    onToggle={toggleBank} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}