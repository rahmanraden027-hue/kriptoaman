import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAddressInfo, getRecommendedFees, broadcastTransaction } from './bitcoinApi';
import { decryptData, satoshiToBtc, btcToSatoshi } from './walletUtils';
import { X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export default function SendModal({ wallet, sessionPassword, onClose, onSuccess }) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [feeLevel, setFeeLevel] = useState('medium');
  const [fees, setFees] = useState({ low: 1, medium: 5, high: 10 });
  const [balance, setBalance] = useState(0);
  const [step, setStep] = useState('form'); // form | confirm | success | error
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [btcAmount, setBtcAmount] = useState(0);

  useEffect(() => {
    Promise.all([getRecommendedFees(), getAddressInfo(wallet.address).catch(() => null)]).then(([f, info]) => {
      setFees(f);
      if (info) setBalance(info.balance || 0);
    });
  }, []);

  const estimatedFee = fees[feeLevel] * 250; // ~250 bytes per tx
  const estimatedFeeBtc = parseFloat(satoshiToBtc(estimatedFee));
  const balanceBtc = parseFloat(satoshiToBtc(balance));

  const handleReview = () => {
    const amt = parseFloat(amount);
    if (!toAddress || toAddress.length < 25) { setErrorMsg('Alamat Bitcoin tidak valid'); return; }
    if (!amt || amt <= 0) { setErrorMsg('Masukkan jumlah yang valid'); return; }
    if (amt + estimatedFeeBtc > balanceBtc) { setErrorMsg('Saldo tidak mencukupi (termasuk fee)'); return; }
    setBtcAmount(amt);
    setErrorMsg('');
    setStep('confirm');
  };

  const handleSend = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Decrypt mnemonic and re-derive private key
      const mnemonic = decryptData(wallet.encryptedMnemonic, sessionPassword);
      if (!mnemonic) throw new Error('Gagal mendekripsi wallet. Password salah?');

      const seed = await bip39.mnemonicToSeed(mnemonic, { wordlist });
      const hdKey = HDKey.fromMasterSeed(seed);
      const child = hdKey.derive("m/44'/0'/0'/0/0");

      // Build and sign transaction using BlockCypher's tx builder API
      const txSkeleton = await buildAndBroadcast(child, toAddress, btcToSatoshi(btcAmount), estimatedFee);
      setTxHash(txSkeleton);
      setStep('success');
      onSuccess && onSuccess();
    } catch (e) {
      setErrorMsg(e.message || 'Transaksi gagal');
      setStep('error');
    }
    setLoading(false);
  };

  const buildAndBroadcast = async (hdKey, toAddr, amountSat, feeSat) => {
    const { bytesToHex } = await import('./walletUtils');

    // 1. Create new transaction via BlockCypher
    const newTxRes = await fetch('https://api.blockcypher.com/v1/btc/main/txs/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: [{ addresses: [wallet.address] }],
        outputs: [{ addresses: [toAddr], value: amountSat }],
        fees: feeSat,
      }),
    });
    const newTx = await newTxRes.json();
    if (newTx.errors) throw new Error(newTx.errors[0]?.error || 'Gagal membuat transaksi');

    // 2. Sign each input's tosign hex
    const { secp256k1 } = await import('@noble/curves/secp256k1');
    const signatures = newTx.tosign.map(hex => {
      const msgBytes = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
      const sig = secp256k1.sign(msgBytes, hdKey.privateKey, { lowS: true });
      return bytesToHex(sig.toDERRawBytes());
    });

    const pubkeyHex = bytesToHex(hdKey.publicKey);

    // 3. Send signed transaction
    const sendRes = await fetch('https://api.blockcypher.com/v1/btc/main/txs/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTx,
        signatures,
        pubkeys: newTx.tosign.map(() => pubkeyHex),
      }),
    });
    const sentTx = await sendRes.json();
    if (sentTx.errors) throw new Error(sentTx.errors[0]?.error || 'Gagal mengirim transaksi');
    return sentTx.hash || sentTx.tx?.hash;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={step !== 'success' ? onClose : undefined}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {step === 'form' && 'Kirim Bitcoin'}
            {step === 'confirm' && 'Konfirmasi Transaksi'}
            {step === 'success' && 'Berhasil Terkirim!'}
            {step === 'error' && 'Transaksi Gagal'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {step === 'form' && (
          <>
            <div className="text-right text-sm text-slate-400">Saldo: <span className="text-white">{balanceBtc.toFixed(8)} BTC</span></div>
            <div className="space-y-2">
              <Label className="text-slate-300">Alamat Tujuan</Label>
              <Input value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="Masukkan alamat Bitcoin" className="bg-slate-800 border-slate-700 text-white font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Jumlah (BTC)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00000000" className="bg-slate-800 border-slate-700 text-white" step="0.00000001" min="0" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Prioritas Fee</Label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map(level => (
                  <button key={level} onClick={() => setFeeLevel(level)} className={`py-2 rounded-xl text-sm font-medium border transition-all ${feeLevel === level ? 'bg-orange-500 border-orange-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-orange-500/50'}`}>
                    <div>{level === 'low' ? 'Lambat' : level === 'medium' ? 'Normal' : 'Cepat'}</div>
                    <div className="text-xs opacity-70">{fees[level]} sat/B</div>
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-xs">Est. fee: ~{estimatedFeeBtc.toFixed(8)} BTC</p>
            </div>
            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
            <Button onClick={handleReview} className="w-full bg-orange-500 hover:bg-orange-600 text-white">Review Transaksi</Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Ke</span><span className="text-white font-mono text-xs break-all max-w-[60%] text-right">{toAddress}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Jumlah</span><span className="text-white">{btcAmount} BTC</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Fee</span><span className="text-white">~{estimatedFeeBtc.toFixed(8)} BTC</span></div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold"><span className="text-slate-300">Total</span><span className="text-orange-400">{(btcAmount + estimatedFeeBtc).toFixed(8)} BTC</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Ubah</Button>
              <Button onClick={handleSend} disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</> : 'Konfirmasi'}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
            <p className="text-slate-300 text-sm">Transaksi berhasil disiarkan ke jaringan Bitcoin.</p>
            {txHash && (
              <a href={`https://www.blockchain.com/explorer/transactions/btc/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-orange-400 text-xs hover:underline font-mono break-all block">{txHash}</a>
            )}
            <Button onClick={onClose} className="w-full bg-orange-500 hover:bg-orange-600 text-white">Tutup</Button>
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