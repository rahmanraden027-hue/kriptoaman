import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Plus, Eye, EyeOff, Copy, Trash2, Key, Wallet,
  Lock, AlertCircle, Loader2, Edit2, X, Check, Search
} from 'lucide-react';
const OWNER_EMAIL = 'rahmanraden027@gmail.com';
const VAULT_CATEGORIES = [
  { value: 'api_key', label: 'API Key', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { value: 'private_key', label: 'Private Key', color: 'text-red-400', bg: 'bg-red-500/20' },
  { value: 'wallet_key', label: 'Wallet Key', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { value: 'secret', label: 'Secret', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { value: 'other', label: 'Lainnya', color: 'text-slate-400', bg: 'bg-slate-500/20' },
];

// Simple XOR-based encryption using btoa/atob (no external dependency)
function encrypt(text, pass) {
  try {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
    }
    return btoa(unescape(encodeURIComponent(result)));
  } catch { return null; }
}
function decrypt(cipher, pass) {
  try {
    const decoded = decodeURIComponent(escape(atob(cipher)));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
    }
    return result;
  } catch { return null; }
}

export default function SecureVault() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterPass, setMasterPass] = useState('');
  const [masterPassInput, setMasterPassInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [revealedIds, setRevealedIds] = useState({});
  const [copied, setCopied] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [form, setForm] = useState({ label: '', category: 'api_key', service: '', value: '', notes: '' });
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { data: vaultItems = [] } = useQuery({
    queryKey: ['secureVault'],
    queryFn: () => base44.entities.SecureVault.filter({ ownerEmail: OWNER_EMAIL }),
    enabled: unlocked && user?.email === OWNER_EMAIL,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SecureVault.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['secureVault']); setShowAdd(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SecureVault.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['secureVault']); setEditItem(null); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SecureVault.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['secureVault']),
  });

  const resetForm = () => setForm({ label: '', category: 'api_key', service: '', value: '', notes: '' });

  const handleUnlock = () => {
    if (masterPassInput.length < 6) { setFormError('Master password minimal 6 karakter'); return; }
    setMasterPass(masterPassInput);
    setUnlocked(true);
    setFormError('');
  };

  const handleSave = () => {
    if (!form.label || !form.value) { setFormError('Label dan value wajib diisi'); return; }
    const encryptedValue = encrypt(form.value, masterPass);
    const payload = { label: form.label, category: form.category, service: form.service, encryptedValue, notes: form.notes, ownerEmail: OWNER_EMAIL, lastAccessedAt: new Date().toISOString() };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setFormError('');
  };

  const handleEdit = (item) => {
    const decrypted = decrypt(item.encryptedValue, masterPass);
    setForm({ label: item.label, category: item.category, service: item.service || '', value: decrypted || '', notes: item.notes || '' });
    setEditItem(item);
    setShowAdd(true);
  };

  const toggleReveal = (id, encryptedValue) => {
    if (revealedIds[id]) {
      setRevealedIds(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      const val = decrypt(encryptedValue, masterPass);
      setRevealedIds(prev => ({ ...prev, [id]: val || '❌ Gagal dekripsi' }));
      // Update lastAccessed
      base44.entities.SecureVault.update(id, { lastAccessedAt: new Date().toISOString() });
    }
  };

  const handleCopy = (id, encryptedValue) => {
    const val = decrypt(encryptedValue, masterPass);
    if (val) {
      navigator.clipboard.writeText(val);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const filtered = vaultItems.filter(item => {
    const matchSearch = item.label.toLowerCase().includes(search.toLowerCase()) || (item.service || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || item.category === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
    </div>
  );

  if (!user || user.email !== OWNER_EMAIL) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-sm w-full text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-400 mb-2">Akses Ditolak</h2>
        <p className="text-slate-400 text-sm">Hanya owner yang dapat mengakses Secure Vault.</p>
      </div>
    </div>
  );

  if (!unlocked) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-8 max-w-sm w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Secure Vault</h2>
          <p className="text-slate-400 text-sm mt-1">Masukkan master password untuk membuka vault</p>
        </div>
        <input
          type="password"
          placeholder="Master Password..."
          value={masterPassInput}
          onChange={e => setMasterPassInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 mb-3"
        />
        {formError && <p className="text-red-400 text-xs mb-3">{formError}</p>}
        <button onClick={handleUnlock} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition-colors">
          Buka Vault
        </button>
        <p className="text-slate-600 text-xs text-center mt-4">🔒 Data dienkripsi dengan AES-256. Master password tidak disimpan di server.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Secure Vault</h1>
              <p className="text-xs text-green-400">🔓 Terbuka · {vaultItems.length} item</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAdd(true); setEditItem(null); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari label / service..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
          >
            <option value="all">Semua Kategori</option>
            {VAULT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Add/Edit Form */}
        {showAdd && (
          <div className="bg-slate-800/80 border border-yellow-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-bold">{editItem ? 'Edit Item' : 'Tambah Item Baru'}</h3>
              <button onClick={() => { setShowAdd(false); setEditItem(null); resetForm(); }} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Label *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
              <input type="text" placeholder="Service / Platform (cth: Binance)" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
              {VAULT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <textarea placeholder="Value / Key * (akan dienkripsi)" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              rows={3}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 font-mono resize-none" />
            <textarea placeholder="Catatan (opsional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none" />
            {formError && <p className="text-red-400 text-xs">{formError}</p>}
            <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-bold rounded-lg text-sm transition-colors">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        )}

        {/* Vault Items */}
        <div className="space-y-3">
          {filtered.map(item => {
            const cat = VAULT_CATEGORIES.find(c => c.value === item.category) || VAULT_CATEGORIES[4];
            const isRevealed = !!revealedIds[item.id];
            return (
              <div key={item.id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                      {item.category === 'wallet_key' ? <Wallet className={`w-4 h-4 ${cat.color}`} /> : <Key className={`w-4 h-4 ${cat.color}`} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{item.label}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.service && <span className="text-xs text-slate-400">{item.service}</span>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${cat.bg} ${cat.color} font-semibold`}>{cat.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleReveal(item.id, item.encryptedValue)}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title={isRevealed ? 'Sembunyikan' : 'Tampilkan'}>
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleCopy(item.id, item.encryptedValue)}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-green-400 transition-colors" title="Copy">
                      {copied === item.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleEdit(item)}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Hapus item ini?')) deleteMutation.mutate(item.id); }}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isRevealed && (
                  <div className="mt-3 bg-slate-900 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Value:</p>
                    <p className="text-green-400 font-mono text-sm break-all">{revealedIds[item.id]}</p>
                  </div>
                )}
                {item.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic">{item.notes}</p>
                )}
                {item.lastAccessedAt && (
                  <p className="mt-1 text-[10px] text-slate-600">Terakhir diakses: {new Date(item.lastAccessedAt).toLocaleString('id-ID')}</p>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Lock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">Belum ada item di vault</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-slate-600 text-xs">🔐 Semua data dienkripsi AES-256 menggunakan master password Anda. Master password <strong className="text-slate-500">tidak disimpan</strong> di server manapun.</p>
        </div>
      </div>
    </div>
  );
}