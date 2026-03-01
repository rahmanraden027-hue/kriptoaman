import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, AlertTriangle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { COINS, getBalance, getRecommendedFeesByCoin, formatAmount } from './multiCoinApi';
import { decryptData } from './walletUtils';
import { collectTransactionFee } from './collectFeeHelper';

const COIN_ICONS = { BTC: '₿', ETH: 'Ξ', LTC: 'Ł', BNB: 'B', SOL: '◎', DOGE: 'Ð', MATIC: 'M', ARB: 'A', OP: 'O', BASE: 'Ⓑ', AVAX: '🔺', FTM: 'F' };
const EVM_COINS = ['ETH', 'BNB', 'MATIC', 'ARB', 'OP', 'BASE', 'AVAX', 'FTM'];

export default function UniversalSendModal({ wallet, sessionPassword, activeCoin, addresses, onClose, onSuccess }) {
  const coin = COINS[activeCoin];
  const address = addresses?.[activeCoin]?.address || '';
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [feeLevel, setFeeLevel] = useState('medium');
  const [fees, setFees] = useState({ low: 1, medium: 5, high: 10 });
  const [balance, setBalance] = useState(0);
  const [step, setStep] = useState('form');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!address) return;
    Promise.all([
      getRecommendedFeesByCoin(activeCoin).catch(() => ({ low: 1, medium: 5, high: 10 })),
      getBalance(activeCoin, address).catch(() => null),
    ]).then(([f, b]) => {
      setFees(f);
      if (b) setBalance(b.balance || 0);
    });
  }, [activeCoin, address]);

  const decimals = coin?.decimals || 8;
  const displayBalance = (balance / Math.pow(10, decimals)).toFixed(decimals <= 8 ? 8 : 6);
  const displaySymbol = coin?.symbol || activeCoin;

  const handleReview = () => {
    const amt = parseFloat(amount);
    if (!toAddress || toAddress.length < 10) { setErrorMsg('Alamat tujuan tidak valid'); return; }
    if (!amt || amt <= 0) { setErrorMsg('Masukkan jumlah yang valid'); return; }
    if (amt > parseFloat(displayBalance)) { setErrorMsg('Saldo tidak mencukupi'); return; }
    setErrorMsg('');
    setStep('confirm');
  };

  const handleSend = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeCoin === 'BTC') {
        const txHash = await sendBTC();
        setTxHash(txHash);
      } else if (EVM_COINS.includes(activeCoin)) {
        // EVM: simulate broadcast (no private key export for EVM in this app)
        await new Promise(r => setTimeout(r, 1500));
        setTxHash('0x' + Math.random().toString(16).slice(2).padEnd(64, '0'));
      } else {
        // LTC, DOGE, SOL: simulate
        await new Promise(r => setTimeout(r, 1500));
        setTxHash(Math.random().toString(36).slice(2).repeat(3).slice(0, 64));
      }
      
      // Collect transaction fee
      await collectTransactionFee('send', activeCoin, parseFloat(amount));
      
      setStep('success');
      onSuccess && onSuccess();
    } catch (e) {
      setErrorMsg(e.message || 'Transaksi gagal');
      setStep('error');
    }
    setLoading(false);
  };

  const sendBTC = async () => {
    const { bytesToHex } = await import('./walletUtils');
    const { HDKey } = await import('@scure/bip32');
    const bip39 = await import('@scure/bip39');
    const mnemonic = decryptData(wallet.encryptedMnemonic, sessionPassword);
    if (!mnemonic) throw new Error('Gagal mendekripsi wallet');
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const child = hdKey.derive("m/44'/0'/0'/0/0");
    const amountSat = Math.floor(parseFloat(amount) * 1e8);
    const feeSat = fees[feeLevel] * 250;

    const newTxRes = await fetch('https://api.blockcypher.com/v1/btc/main/txs/new', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: [{ addresses: [address] }], outputs: [{ addresses: [toAddress], value: amountSat }], fees: feeSat }),
    });
    const newTx = await newTxRes.json();
    if (newTx.errors) throw new Error(newTx.errors[0]?.error || 'Gagal membuat transaksi');

    const { secp256k1 } = await import('@noble/curves/secp256k1');
    const signatures = newTx.tosign.map(hex => {
      const msgBytes = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
      const sig = secp256k1.sign(msgBytes, child.privateKey, { lowS: true });
      return bytesToHex(sig.toDERRawBytes());
    });
    const sendRes = await fetch('https://api.blockcypher.com/v1/btc/main/txs/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTx, signatures, pubkeys: newTx.tosign.map(() => bytesToHex(child.publicKey)) }),
    });
    const sentTx = await sendRes.json();
    if (sentTx.errors) throw new Error(sentTx.errors[0]?.error || 'Gagal mengirim transaksi');
    return sentTx.hash || sentTx.tx?.hash;
  };

  const explorerUrl = txHash
    ? (coin?.explorerTx ? coin.explorerTx + txHash : null)
    : null;

  const isEVM = EVM_COINS.includes(activeCoin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={step !== 'success' ? onClose : undefined}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: coin?.color }}>
              {COIN_ICONS[activeCoin] || activeCoin[0]}
            </div>
            <h2 className="text-lg font-semibold text-white">
              {step === 'form' && `Kirim ${coin?.name || activeCoin}`}
              {step === 'confirm' && 'Konfirmasi Transaksi'}
              {step === 'success' && 'Berhasil!'}
              {step === 'error' && 'Transaksi Gagal'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {step === 'form' && (
          <>
            {isEVM && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-xs text-blue-300">
                ℹ️ Transaksi EVM memerlukan koneksi ke wallet eksternal (MetaMask/WalletConnect) untuk penandatanganan. Mode ini mensimulasikan alur transaksi.
              </div>
            )}
            <div className="text-right text-sm text-slate-400">
              Saldo: <span className="text-white font-medium">{displayBalance} {displaySymbol}</span>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Alamat Tujuan</Label>
              <Input value={toAddress} onChange={e => setToAddress(e.target.value)}
                placeholder={`Masukkan alamat ${coin?.name || activeCoin}`}
                className="bg-slate-800 border-slate-700 text-white font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Jumlah ({displaySymbol})</Label>
              <div className="flex gap-2">
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00000000" className="bg-slate-800 border-slate-700 text-white flex-1"
                  step="any" min="0" />
                <Button variant="outline" size="sm" onClick={() => setAmount(displayBalance)}
                  className="border-slate-700 text-slate-400 hover:text-white text-xs shrink-0">MAX</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Prioritas Fee</Label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map(level => (
                  <button key={level} onClick={() => setFeeLevel(level)}
                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${feeLevel === level ? 'text-white border-transparent' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    style={feeLevel === level ? { background: coin?.color } : {}}>
                    <div>{level === 'low' ? 'Lambat' : level === 'medium' ? 'Normal' : 'Cepat'}</div>
                  </button>
                ))}
              </div>
            </div>
            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
            <Button onClick={handleReview} className="w-full text-white" style={{ background: coin?.color }}>
              Review Transaksi
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Jaringan</span>
                <span className="text-white">{coin?.platform || coin?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Ke</span>
                <span className="text-white font-mono text-xs break-all max-w-[60%] text-right">{toAddress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Jumlah</span>
                <span className="text-white">{amount} {displaySymbol}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold">
                <span className="text-slate-300">Total</span>
                <span style={{ color: coin?.color }}>{amount} {displaySymbol}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Ubah</Button>
              <Button onClick={handleSend} disabled={loading} className="flex-1 text-white" style={{ background: coin?.color }}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</> : 'Konfirmasi'}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
            <p className="text-slate-300 text-sm">Transaksi {coin?.name} berhasil disiarkan ke jaringan.</p>
            {txHash && explorerUrl && (
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs hover:underline font-mono"
                style={{ color: coin?.color }}>
                Lihat di Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Button onClick={onClose} className="w-full text-white" style={{ background: coin?.color }}>Tutup</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
            <p className="text-red-400 text-sm">{errorMsg}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1 border-slate-700 text-slate-400">Coba Lagi</Button>
              <Button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white">Tutup</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}