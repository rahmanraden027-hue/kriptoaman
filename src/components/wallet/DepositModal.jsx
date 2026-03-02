import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, Loader2, Building2, AlertTriangle, Info, ArrowDownToLine, ShieldCheck, Clock } from 'lucide-react';
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
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // null | { verified, errorMsg, explorerLink }

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
    setVerifyResult(null);

    // Create deposit request first (pending)
    const deposit = await base44.entities.DepositRequest.create({
      userEmail,
      type: 'crypto',
      coin: selectedCryptoEntry.coin,
      network: selectedCryptoEntry.network,
      amountCrypto: parseFloat(amountCrypto),
      txHash: txHash.trim(),
      status: 'pending',
    });

    setSubmitting(false);
    setVerifying(true);

    // Auto-verify via backend
    try {
      const res = await base44.functions.invoke('verifyTxHash', {
        txHash: txHash.trim(),
        coin: selectedCryptoEntry.coin,
        network: selectedCryptoEntry.network,
        expectedAmount: parseFloat(amountCrypto),
        toAddress: selectedCryptoEntry.address,
        depositRequestId: deposit.id,
        userEmail,
      });
      setVerifyResult(res.data);
    } catch (_) {
      setVerifyResult({ verified: false, errorMsg: 'Gagal menghubungi verifikator. Admin akan konfirmasi manual.' });
    }
    setVerifying(false);
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

        {/* Verifying overlay */}
        {verifying && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Memverifikasi TX Hash...</h3>
              <p className="text-slate-400 text-sm mt-1">Mengecek transaksi di blockchain. Mohon tunggu.</p>
            </div>
          </div>
        )}

        {/* Success */}
        {!verifying && step === 'success' ? (
          <div className="p-6 text-center space-y-4">
            {tab === 'crypto' && verifyResult?.verified ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Deposit Terkonfirmasi Otomatis!</h3>
                  <p className="text-green-400 text-sm mt-1">Transaksi terverifikasi di blockchain. Saldo telah dikreditkan.</p>
                </div>
                {verifyResult.explorerLink && (
                  <a href={verifyResult.explorerLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 text-xs hover:underline">
                    Lihat di Block Explorer ↗
                  </a>
                )}
              </>
            ) : tab === 'crypto' && verifyResult && !verifyResult.verified ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Deposit Menunggu Konfirmasi</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {verifyResult.errorMsg || 'Verifikasi otomatis tidak berhasil. Admin akan mengkonfirmasi dalam 1–24 jam.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Deposit Diajukan!</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Bukti transfer dikirim. Saldo IDR akan dikreditkan setelah admin konfirmasi.
                  </p>
                </div>
              </>
            )}
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
                {loadingPlatform ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : cryptoAddresses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">Belum ada alamat deposit tersedia. Hubungi admin.</p>
                  </div>
                ) : (
                  <>
                    {/* Coin selector from DB */}
                    <div className="flex flex-wrap gap-2">
                      {cryptoAddresses.map(c => (
                        <button key={c.id} onClick={() => setSelectedCoin(c.coin + '_' + c.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                            selectedCoin === c.coin + '_' + c.id
                              ? 'border-blue-500/60 bg-blue-500/15'
                              : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800'
                          }`}>
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: COIN_COLORS[c.coin] || '#555' }}>
                            {COIN_ICONS[c.coin] || c.coin[0]}
                          </span>
                          <div className="text-left">
                            <p className="text-white text-xs font-semibold">{c.coin}</p>
                            {c.network && <p className="text-slate-500 text-[9px]">{c.network}</p>}
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedCryptoEntry && (
                      <>
                        {/* Deposit address */}
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-slate-400 text-xs font-semibold">ALAMAT DEPOSIT</p>
                            {selectedCryptoEntry.network && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                {selectedCryptoEntry.network}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-xs font-semibold">{selectedCryptoEntry.label}</p>
                          <div className="bg-slate-900 rounded-lg p-3 break-all text-white text-xs font-mono leading-relaxed">
                            {selectedCryptoEntry.address}
                          </div>
                          <button onClick={() => copy(selectedCryptoEntry.address, 'addr')}
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
                            Pastikan mengirim {selectedCryptoEntry.coin} melalui jaringan <strong>{selectedCryptoEntry.network || selectedCryptoEntry.coin}</strong> yang benar.
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Form konfirmasi */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">JUMLAH DIKIRIM ({selectedCryptoEntry?.coin})</label>
                    <Input type="number" value={amountCrypto} onChange={e => setAmountCrypto(e.target.value)}
                      placeholder="0.00" className="bg-slate-800 border-slate-700 text-white"
                      min={selectedCryptoEntry?.minDeposit || 0} />
                    {selectedCryptoEntry?.minDeposit > 0 && (
                      <p className="text-slate-500 text-[10px]">Minimum: {selectedCryptoEntry.minDeposit} {selectedCryptoEntry.coin}</p>
                    )}
                    {selectedCryptoEntry?.minDeposit > 0 && amountCrypto && parseFloat(amountCrypto) < selectedCryptoEntry.minDeposit && (
                      <p className="text-red-400 text-[10px] flex items-center gap-1">
                        ⚠ Jumlah kurang dari minimum deposit ({selectedCryptoEntry.minDeposit} {selectedCryptoEntry.coin})
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">TX HASH / TRANSACTION ID</label>
                    <Input value={txHash} onChange={e => setTxHash(e.target.value)}
                      placeholder="0x... atau signature..." className="bg-slate-800 border-slate-700 text-white font-mono text-xs" />
                    <p className="text-slate-600 text-[10px]">Dapatkan dari block explorer setelah transaksi berhasil.</p>
                  </div>
                </div>

                <Button onClick={submitCrypto} disabled={!txHash.trim() || !amountCrypto || !selectedCryptoEntry || submitting}
                  className="w-full h-12 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowDownToLine className="w-4 h-4 mr-2" /> Kirim Bukti Deposit</>}
                </Button>
              </div>
            )}

            {/* === BANK TAB === */}
            {tab === 'bank' && (
              <div className="space-y-4">
                {loadingPlatform ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-400" />
                  </div>
                ) : bankAccounts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">Belum ada rekening bank tersedia. Hubungi admin.</p>
                  </div>
                ) : (
                  <>
                    {/* Bank selector */}
                    {bankAccounts.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {bankAccounts.map(b => (
                          <button key={b.id} onClick={() => setSelectedBank(b)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              selectedBank?.id === b.id
                                ? 'border-green-500/60 bg-green-500/15 text-green-300'
                                : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                            }`}>{b.bank}</button>
                        ))}
                      </div>
                    )}

                    {/* Rekening terpilih */}
                    {selectedBank && (
                      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                        <p className="text-slate-400 text-xs font-semibold">TRANSFER KE REKENING PLATFORM</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white font-bold">{selectedBank.label || selectedBank.bank}</p>
                            <p className="text-slate-400 text-xs">A/N: {selectedBank.accountName} · {selectedBank.bank}</p>
                          </div>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                          <span className="text-white font-mono font-bold text-xl tracking-widest">{selectedBank.accountNumber}</span>
                          <button onClick={() => copy(selectedBank.accountNumber, 'bank')}
                            className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
                            {copied === 'bank' ? <><CheckCircle2 className="w-3.5 h-3.5" /> Tersalin</> : <><Copy className="w-3.5 h-3.5" /> Salin</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

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

                <Button onClick={submitBank} disabled={idrRaw < 50000 || !senderName.trim() || !selectedBank || submitting}
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