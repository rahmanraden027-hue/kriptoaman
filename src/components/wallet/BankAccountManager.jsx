import React, { useState } from 'react';
import { Building2, Plus, Trash2, CheckCircle2, Shield, ChevronDown, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'cv_bank_accounts';

const INDONESIAN_BANKS = [
  'BCA', 'BRI', 'BNI', 'Mandiri', 'CIMB Niaga', 'Danamon', 'Permata',
  'BTN', 'OCBC NISP', 'Maybank', 'Panin', 'Bank Mega', 'BSI', 'Jago', 'Jenius (BTPN)',
];

export function loadBankAccounts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveBankAccounts(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function AddBankModal({ onSave, onClose }) {
  const [form, setForm] = useState({ bank: '', accountNumber: '', accountName: '' });
  const [showBankList, setShowBankList] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.bank || !form.accountNumber || !form.accountName) {
      setError('Semua field wajib diisi'); return;
    }
    if (!/^\d{8,20}$/.test(form.accountNumber)) {
      setError('Nomor rekening harus 8-20 digit angka'); return;
    }
    onSave({ ...form, id: Date.now().toString(), addedAt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-base">Tambah Rekening Bank</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Bank selector */}
        <div className="space-y-1">
          <label className="text-slate-400 text-xs font-semibold">NAMA BANK</label>
          <div className="relative">
            <button
              onClick={() => setShowBankList(v => !v)}
              className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm"
            >
              <span className={form.bank ? 'text-white font-semibold' : 'text-slate-500'}>
                {form.bank || 'Pilih bank…'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBankList ? 'rotate-180' : ''}`} />
            </button>
            {showBankList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl max-h-48 overflow-y-auto z-10 shadow-xl">
                {INDONESIAN_BANKS.map(bank => (
                  <button key={bank} onClick={() => { setForm(f => ({ ...f, bank })); setShowBankList(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    {bank}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 text-xs font-semibold">NOMOR REKENING</label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 1234567890"
            value={form.accountNumber}
            onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }))}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 text-xs font-semibold">NAMA PEMILIK REKENING</label>
          <Input
            type="text"
            placeholder="Sesuai buku tabungan"
            value={form.accountName}
            onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-blue-300 text-xs">Data rekening disimpan secara lokal dan tidak dibagikan ke pihak ketiga.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">Batal</Button>
          <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold">Simpan Rekening</Button>
        </div>
      </div>
    </div>
  );
}

export default function BankAccountManager({ onSelect, selectedId }) {
  const [accounts, setAccounts] = useState(loadBankAccounts);
  const [showAdd, setShowAdd] = useState(false);

  const handleSave = (account) => {
    const updated = [...accounts, account];
    saveBankAccounts(updated);
    setAccounts(updated);
    setShowAdd(false);
    onSelect?.(account);
  };

  const handleDelete = (id) => {
    const updated = accounts.filter(a => a.id !== id);
    saveBankAccounts(updated);
    setAccounts(updated);
    if (selectedId === id) onSelect?.(null);
  };

  return (
    <div className="space-y-3">
      {accounts.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">Belum ada rekening bank terhubung</p>
        </div>
      ) : (
        accounts.map(acc => (
          <div key={acc.id}
            onClick={() => onSelect?.(acc)}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedId === acc.id
                ? 'bg-blue-500/15 border-blue-500/40'
                : 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-800'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{acc.bank}</p>
              <p className="text-slate-400 text-xs">{acc.accountNumber} · {acc.accountName}</p>
            </div>
            {selectedId === acc.id && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
            <button onClick={e => { e.stopPropagation(); handleDelete(acc.id); }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))
      )}

      <button onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm font-semibold">
        <Plus className="w-4 h-4" /> Tambah Rekening Bank
      </button>

      {showAdd && <AddBankModal onSave={handleSave} onClose={() => setShowAdd(false)} />}
    </div>
  );
}