import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, Loader2, Building2, AlertTriangle, Info, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const COIN_COLORS = {
  BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B', SOL: '#9945FF',
  BNB: '#F3BA2F', LTC: '#BFBBBB', DOGE: '#C2A633',
};
const COIN_ICONS = {
  BTC: '₿', ETH: 'Ξ', USDT: '₮', SOL: '◎', BNB: 'B', LTC: 'Ł', DOGE: 'Ð',
};

const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function DepositModal({ onClose, userEmail }) {
  const [tab, setTab] = useState('crypto');
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [copied, setCopied] = useState('');
  const [step, setStep] = useState('form');

  // Platform data from DB
  const [cryptoAddresses, setCryptoAddresses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingPlatform, setLoadingPlatform] = useState(true);
  const [selectedBank, setSelectedBank] = useState(null);

  // Crypto form
  const [txHash, setTxHash] = useState('');
  const [amountCrypto, setAmountCrypto] = useState('');

  // Bank form
  const [amountIDR, setAmountIDR] = useState('');
  const [senderName, setSenderName] = useState('');
  const [proofNote, setProofNote] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.PlatformCryptoAddress.filter({ isActive: true }),
      base44.entities.PlatformBankAccount.filter({ isActive: true }),
    ]).then(([cryptos, banks]) => {
      setCryptoAddresses(cryptos);
      setBankAccounts(banks);
      if (cryptos.length > 0) setSelectedCoin(cryptos[0].coin + '_' + cryptos[0].id);
      if (banks.length > 0) setSelectedBank(banks[0]);
      setLoadingPlatform(false);
    }).catch(() => setLoadingPlatform(false));
  }, []);

  const selectedCryptoEntry = cryptoAddresses.find(c => (c.coin + '_' + c.id) === selectedCoin);
  const idrRaw = parseInt(amountIDR.replace(/\D/g, '') || '0');

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const submitCrypto = async () => {
    if (!txHash.trim() || !amountCrypto || !selectedCryptoEntry) return;
    setSubmitting(true);
    await base44.entities.DepositRequest.create({
      userEmail,
      type: 'crypto',
      coin: selectedCryptoEntry.coin,
      network: selectedCryptoEntry.network,
      amountCrypto: parseFloat(amountCrypto),
      txHash: txHash.trim(),
      status: 'pending',
    });
    setSubmitting(false);
    setStep('success');
  };

  const submitBank = async () => {
    if (idrRaw < 50000 || !senderName.trim() || !selectedBank) return;
    setSubmitting(true);
    await base44.entities.DepositRequest.create({
      userEmail,
      type: 'bank',
      coin: 'IDR',
      amountIDR: idrRaw,
      senderName: senderName.trim(),
      proofNote: proofNote + (selectedBank ? ` | Transfer ke ${selectedBank.bank} - ${selectedBank.accountNumber}` : ''),
      status: 'pending',
    });
    setSubmitting(false);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">Deposit Saldo</span>
              <div className="text-slate-500 text-[10px]">Kripto atau Transfer Bank ke platform</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success */}
        {step === 'success' ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Deposit Diajukan!</h3>
              <p className="text-slate-400 text-sm mt-1">
                {tab === 'crypto'
                  ? 'TX Hash diterima. Saldo akan dikreditkan setelah dikonfirmasi admin (1–24 jam).'
                  : 'Bukti transfer dikirim. Saldo IDR akan dikreditkan setelah admin konfirmasi.'}
              </p>
            </div>
            <Button onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold">
              Selesai
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Tabs */}
            <div className="flex bg-slate-800/60 border border-slate-700/40 rounded-xl p-1 gap-1">
              {[{ key: 'crypto', label: '🔗 Kripto' }, { key: 'bank', label: '🏦 Transfer Bank' }].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* === CRYPTO TAB === */}
            {tab === 'crypto' && (
              <div className="space-y-4">
                {/* Coin selector */}
                <div className="flex gap-2">
                  {Object.entries(PLATFORM_ADDRESSES).map(([coin, info]) => (
                    <button key={coin} onClick={() => setSelectedCoin(coin)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                        selectedCoin === coin
                          ? 'border-blue-500/60 bg-blue-500/15'
                          : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800'
                      }`}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: info.color }}>
                        {info.icon}
                      </span>
                      <span className="text-white text-sm font-semibold">{coin}</span>
                    </button>
                  ))}
                </div>

                {/* Deposit address */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs font-semibold">ALAMAT DEPOSIT PLATFORM</p>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      {coinInfo.network}
                    </span>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 break-all text-white text-xs font-mono leading-relaxed">
                    {coinInfo.address}
                  </div>
                  <button onClick={() => copy(coinInfo.address, 'addr')}
                    className={`w-full py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      copied === 'addr'
                        ? 'border-green-500/60 bg-green-500/15 text-green-400'
                        : 'border-slate-600 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}>
                    {copied === 'addr' ? <><CheckCircle2 className="w-4 h-4" /> Tersalin!</> : <><Copy className="w-4 h-4" /> Salin Alamat</>}
                  </button>
                </div>

                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300 text-xs">
                    Minimum deposit: <strong>{coinInfo.min}</strong>. Pastikan mengirim melalui jaringan <strong>{coinInfo.network}</strong>.
                  </p>
                </div>

                {/* Form konfirmasi */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">JUMLAH DIKIRIM ({selectedCoin})</label>
                    <Input type="number" value={amountCrypto} onChange={e => setAmountCrypto(e.target.value)}
                      placeholder="0.00" className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">TX HASH / TRANSACTION ID</label>
                    <Input value={txHash} onChange={e => setTxHash(e.target.value)}
                      placeholder="0x... atau signature..." className="bg-slate-800 border-slate-700 text-white font-mono text-xs" />
                    <p className="text-slate-600 text-[10px]">Dapatkan dari block explorer setelah transaksi berhasil.</p>
                  </div>
                </div>

                <Button onClick={submitCrypto} disabled={!txHash.trim() || !amountCrypto || submitting}
                  className="w-full h-12 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowDownToLine className="w-4 h-4 mr-2" /> Kirim Bukti Deposit</>}
                </Button>
              </div>
            )}

            {/* === BANK TAB === */}
            {tab === 'bank' && (
              <div className="space-y-4">
                {/* Rekening admin */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                  <p className="text-slate-400 text-xs font-semibold">TRANSFER KE REKENING PLATFORM</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{ADMIN_BANK.bank}</p>
                      <p className="text-slate-400 text-xs">A/N: {ADMIN_BANK.name}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-white font-mono font-bold text-xl tracking-widest">{ADMIN_BANK.account}</span>
                    <button onClick={() => copy(ADMIN_BANK.account, 'bank')}
                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
                      {copied === 'bank' ? <><CheckCircle2 className="w-3.5 h-3.5" /> Tersalin</> : <><Copy className="w-3.5 h-3.5" /> Salin</>}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-blue-300 text-xs">
                    Transfer IDR ke rekening di atas, lalu isi formulir bukti transfer. Saldo akan dikreditkan setelah admin konfirmasi.
                  </p>
                </div>

                {/* Form bukti transfer */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">JUMLAH TRANSFER (IDR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                      <Input type="text" inputMode="numeric" value={amountIDR}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setAmountIDR(raw ? parseInt(raw).toLocaleString('id-ID') : '');
                        }}
                        placeholder="0" className="pl-10 bg-slate-800 border-slate-700 text-white text-lg font-bold" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[100000, 500000, 1000000, 5000000].map(n => (
                        <button key={n} onClick={() => setAmountIDR(n.toLocaleString('id-ID'))}
                          className="text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full hover:bg-blue-500/20 transition-colors">
                          {formatIDR(n)}
                        </button>
                      ))}
                    </div>
                    <p className="text-slate-600 text-xs">Minimum: Rp 50.000</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">NAMA PENGIRIM (sesuai rekening)</label>
                    <Input value={senderName} onChange={e => setSenderName(e.target.value)}
                      placeholder="Nama pemilik rekening" className="bg-slate-800 border-slate-700 text-white" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">CATATAN (opsional)</label>
                    <Input value={proofNote} onChange={e => setProofNote(e.target.value)}
                      placeholder="Nomor referensi / waktu transfer" className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                </div>

                <Button onClick={submitBank} disabled={idrRaw < 50000 || !senderName.trim() || submitting}
                  className="w-full h-12 font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-40">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowDownToLine className="w-4 h-4 mr-2" /> Kirim Bukti Transfer</>}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}