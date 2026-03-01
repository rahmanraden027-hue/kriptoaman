import React, { useState, useEffect } from 'react';
import { X, ArrowDownToLine, ArrowUpFromLine, Building2, CheckCircle2, AlertTriangle, Loader2, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BankAccountManager, { loadBankAccounts } from './BankAccountManager';
import { getPrices } from './multiCoinApi';

const SUPPORTED_COINS = [
  { id: 'BTC', name: 'Bitcoin', color: '#F7931A', icon: '₿' },
  { id: 'ETH', name: 'Ethereum', color: '#627EEA', icon: 'Ξ' },
  { id: 'BNB', name: 'BNB', color: '#F0B90B', icon: 'B' },
  { id: 'USDT', name: 'Tether', color: '#26A17B', icon: '₮' },
  { id: 'SOL', name: 'Solana', color: '#9945FF', icon: '◎' },
];

const USD_TO_IDR = 16250; // approximate

function formatIDR(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function CoinSelector({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {SUPPORTED_COINS.map(coin => (
        <button key={coin.id} onClick={() => onSelect(coin)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 transition-all ${
            selected?.id === coin.id
              ? 'border-blue-500/60 bg-blue-500/15'
              : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800'
          }`}
        >
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: coin.color }}>
            {coin.icon}
          </span>
          <span className="text-white text-sm font-semibold">{coin.id}</span>
        </button>
      ))}
    </div>
  );
}

export default function BankDepositWithdrawModal({ onClose }) {
  const [mode, setMode] = useState('deposit'); // 'deposit' | 'withdraw'
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'success'
  const [selectedCoin, setSelectedCoin] = useState(SUPPORTED_COINS[0]);
  const [selectedBank, setSelectedBank] = useState(() => loadBankAccounts()[0] || null);
  const [amountIDR, setAmountIDR] = useState('');
  const [prices, setPrices] = useState({});
  const [priceLoading, setPriceLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [bankTab, setBankTab] = useState(false);

  const USDT_PRICE_IDR = (prices['USDT']?.price || 1) * USD_TO_IDR;
  const coinPriceUSD = prices[selectedCoin?.id]?.price || 0;
  const coinPriceIDR = coinPriceUSD * USD_TO_IDR;

  const idrAmount = parseFloat(amountIDR.replace(/\./g, '') || '0');
  const cryptoAmount = coinPriceIDR > 0 ? idrAmount / coinPriceIDR : 0;

  useEffect(() => {
    getPrices().then(p => { setPrices(p); setPriceLoading(false); });
  }, []);

  const handleAmountInput = (val) => {
    const raw = val.replace(/\D/g, '');
    setAmountIDR(raw ? parseInt(raw).toLocaleString('id-ID') : '');
  };

  const handleProceed = async () => {
    if (idrAmount < 50000) return;
    if (!selectedBank) { setBankTab(true); return; }
    setStep('confirm');
  };

  const handleExecute = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1800));
    setProcessing(false);
    setStep('success');
  };

  const fee = mode === 'deposit' ? Math.min(idrAmount * 0.005, 15000) : Math.min(idrAmount * 0.01, 25000);
  const netCrypto = coinPriceIDR > 0 ? Math.max(idrAmount - fee, 0) / coinPriceIDR : 0;

  const QUICK_AMOUNTS = [100000, 500000, 1000000, 5000000];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">Bank ↔ Kripto</span>
              <div className="text-slate-500 text-[10px]">Deposit & Withdraw via rekening bank</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {step === 'form' && (
            <>
              {/* Mode toggle */}
              <div className="flex bg-slate-800/60 border border-slate-700/40 rounded-xl p-1 gap-1">
                {[
                  { id: 'deposit', label: 'Deposit IDR', icon: ArrowDownToLine, desc: 'Bank → Kripto' },
                  { id: 'withdraw', label: 'Withdraw IDR', icon: ArrowUpFromLine, desc: 'Kripto → Bank' },
                ].map(({ id, label, icon: Icon, desc }) => (
                  <button key={id} onClick={() => setMode(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      mode === id ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Coin select */}
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-semibold">
                  {mode === 'deposit' ? 'KRIPTO YANG AKAN DIBELI' : 'KRIPTO YANG AKAN DIJUAL'}
                </label>
                <CoinSelector selected={selectedCoin} onSelect={setSelectedCoin} />
                {!priceLoading && coinPriceIDR > 0 && (
                  <p className="text-slate-500 text-xs">
                    1 {selectedCoin.id} ≈ {formatIDR(coinPriceIDR)}
                    <span className={`ml-2 ${prices[selectedCoin.id]?.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {prices[selectedCoin.id]?.change24h >= 0 ? '+' : ''}{prices[selectedCoin.id]?.change24h?.toFixed(2)}%
                    </span>
                  </p>
                )}
              </div>

              {/* Amount IDR */}
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-semibold">JUMLAH (IDR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={amountIDR}
                    onChange={e => handleAmountInput(e.target.value)}
                    placeholder="0"
                    className="pl-10 bg-slate-800 border-slate-700 text-white text-xl font-bold placeholder:text-slate-700"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {QUICK_AMOUNTS.map(n => (
                    <button key={n} onClick={() => setAmountIDR(n.toLocaleString('id-ID'))}
                      className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-full transition-colors">
                      {formatIDR(n)}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-xs">Minimum: Rp 50.000</p>
              </div>

              {/* Conversion preview */}
              {idrAmount >= 50000 && coinPriceIDR > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 space-y-2">
                  <p className="text-slate-400 text-xs font-semibold">ESTIMASI KONVERSI</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Jumlah</span>
                    <span className="text-white font-semibold">{formatIDR(idrAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Biaya layanan ({mode === 'deposit' ? '0.5%' : '1%'})</span>
                    <span className="text-red-400">- {formatIDR(fee)}</span>
                  </div>
                  <hr className="border-slate-700" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{mode === 'deposit' ? 'Anda mendapat' : 'Anda menjual'}</span>
                    <span className="text-green-400 font-bold">{netCrypto.toFixed(6)} {selectedCoin.id}</span>
                  </div>
                </div>
              )}

              {/* Bank account */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 text-xs font-semibold">REKENING BANK</label>
                  <button onClick={() => setBankTab(v => !v)} className="text-blue-400 text-xs hover:text-blue-300">
                    {bankTab ? 'Tutup' : 'Kelola Rekening'}
                  </button>
                </div>

                {bankTab ? (
                  <BankAccountManager selectedId={selectedBank?.id} onSelect={acc => { setSelectedBank(acc); setBankTab(false); }} />
                ) : selectedBank ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{selectedBank.bank}</p>
                      <p className="text-slate-400 text-xs">{selectedBank.accountNumber} · {selectedBank.accountName}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  </div>
                ) : (
                  <button onClick={() => setBankTab(true)}
                    className="w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white text-sm font-semibold transition-colors">
                    + Tambah Rekening Bank
                  </button>
                )}
              </div>

              {!selectedBank && (
                <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-yellow-300 text-xs">Tambahkan rekening bank terlebih dahulu untuk melanjutkan.</p>
                </div>
              )}

              <Button
                onClick={handleProceed}
                disabled={idrAmount < 50000 || !selectedBank}
                className="w-full h-12 font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-40 shadow-lg"
              >
                {mode === 'deposit' ? <><ArrowDownToLine className="w-4 h-4 mr-2" /> Deposit IDR</> : <><ArrowUpFromLine className="w-4 h-4 mr-2" /> Withdraw IDR</>}
              </Button>
            </>
          )}

          {/* CONFIRM STEP */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-white font-bold text-lg">Konfirmasi {mode === 'deposit' ? 'Deposit' : 'Withdraw'}</h3>
                <p className="text-slate-500 text-sm">Periksa detail transaksi Anda</p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-700/50">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedBank.bank}</p>
                    <p className="text-slate-400 text-xs">{selectedBank.accountNumber} · {selectedBank.accountName}</p>
                  </div>
                </div>
                {[
                  { label: mode === 'deposit' ? 'Jumlah Transfer' : 'Jumlah Jual', value: formatIDR(idrAmount) },
                  { label: 'Biaya Layanan', value: `- ${formatIDR(fee)}`, color: 'text-red-400' },
                  { label: mode === 'deposit' ? 'Kripto Diterima' : 'IDR Diterima', value: mode === 'deposit' ? `${netCrypto.toFixed(6)} ${selectedCoin.id}` : formatIDR(idrAmount - fee), color: 'text-green-400' },
                  { label: 'Kurs', value: `1 ${selectedCoin.id} ≈ ${formatIDR(coinPriceIDR)}` },
                  { label: 'Estimasi Proses', value: '1-3 hari kerja' },
                ].map(({ label, value, color = 'text-white' }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-300 text-xs">
                  {mode === 'deposit'
                    ? 'Transfer IDR ke virtual account yang akan dikirim via email. Kripto akan dikreditkan setelah konfirmasi.'
                    : 'Kripto akan dijual di harga pasar. IDR akan ditransfer ke rekening Anda dalam 1-3 hari kerja.'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('form')} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">Kembali</Button>
                <Button onClick={handleExecute} disabled={processing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold">
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Konfirmasi</>}
                </Button>
              </div>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto shadow-lg shadow-green-500/10">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">
                  {mode === 'deposit' ? 'Deposit Berhasil Diajukan!' : 'Withdraw Berhasil Diajukan!'}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {mode === 'deposit'
                    ? `Cek email untuk instruksi transfer. ${netCrypto.toFixed(6)} ${selectedCoin.id} akan dikreditkan dalam 1x24 jam.`
                    : `${formatIDR(idrAmount - fee)} akan ditransfer ke ${selectedBank.bank} - ${selectedBank.accountNumber} dalam 1-3 hari kerja.`}
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Jenis</span><span className="text-white font-semibold capitalize">{mode}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Jumlah IDR</span><span className="text-white font-semibold">{formatIDR(idrAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Kripto</span><span className="text-green-400 font-bold">{netCrypto.toFixed(6)} {selectedCoin.id}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Bank</span><span className="text-white">{selectedBank.bank}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">No. Rekening</span><span className="text-white font-mono">{selectedBank.accountNumber}</span></div>
              </div>

              <Button onClick={onClose} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold">Selesai</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}