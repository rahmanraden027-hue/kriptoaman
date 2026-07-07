import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Verifies a crypto transaction hash against public block explorers.
 * Supports: ETH/ERC-20, SOL, BNB, BTC, USDT (auto-detect network).
 * 
 * IMPORTANT: This function ONLY updates DepositRequest status to 'confirmed'.
 * Actual balance credit is handled by the autoConfirmDeposit automation (entity trigger),
 * which fires when DepositRequest status changes to 'confirmed'.
 * This prevents double-credit.
 *
 * Payload: { txHash, coin, network, expectedAmount, toAddress, depositRequestId, userEmail }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { txHash, coin, network, expectedAmount, toAddress, depositRequestId, userEmail } = await req.json();

    if (!txHash || !coin || !depositRequestId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Guard: fetch actual deposit and enforce owner before any service-role update.
    const existingDeposits = await base44.asServiceRole.entities.DepositRequest.filter({ id: depositRequestId });
    const existingDeposit = existingDeposits[0];
    if (!existingDeposit) {
      return Response.json({ error: 'Deposit not found' }, { status: 404 });
    }
    if (user.role !== 'admin' && existingDeposit.userEmail !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (existingDeposit.status === 'confirmed') {
      return Response.json({ verified: true, alreadyConfirmed: true, errorMsg: null });
    }

    let verified = false;
    let actualAmount = null;
    let explorerLink = '';
    let errorMsg = '';

    const hash = txHash.trim();
    const isEVM = ['ETH', 'USDT', 'BNB', 'MATIC'].includes(coin) ||
      (network && (network.toLowerCase().includes('erc') || network.toLowerCase().includes('bsc') || network.toLowerCase().includes('bnb')));
    const isSol = coin === 'SOL' || (network && network.toLowerCase().includes('sol'));
    const isBtc = coin === 'BTC' || (network && network.toLowerCase().includes('btc'));

    // ── ETH / EVM via Etherscan (free, no key needed for basic tx lookup) ──
    if (isEVM && !isBtc) {
      const isBNB = coin === 'BNB' || (network && (network.toLowerCase().includes('bsc') || network.toLowerCase().includes('bnb')));
      const apiBase = isBNB
        ? 'https://api.bscscan.com/api'
        : 'https://api.etherscan.io/api';
      explorerLink = isBNB
        ? `https://bscscan.com/tx/${hash}`
        : `https://etherscan.io/tx/${hash}`;

      const url = `${apiBase}?module=proxy&action=eth_getTransactionByHash&txhash=${hash}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();

      if (data?.result && data.result !== null) {
        const tx = data.result;
        const toOk = !toAddress || tx.to?.toLowerCase() === toAddress.toLowerCase();

        if (toOk) {
          const valueWei = parseInt(tx.value, 16);
          const valueEth = valueWei / 1e18;
          actualAmount = valueEth;
          // USDT: skip strict amount check (ERC-20 log parsing needs API key)
          const amountOk = coin === 'USDT' || !expectedAmount || Math.abs(valueEth - parseFloat(expectedAmount)) / parseFloat(expectedAmount) < 0.05;
          verified = amountOk;
          if (!amountOk) errorMsg = `Jumlah tidak sesuai. Terdeteksi: ${valueEth.toFixed(6)} ${coin}`;
        } else {
          errorMsg = 'Alamat penerima tidak cocok dengan platform.';
        }
      } else {
        errorMsg = 'TX Hash tidak ditemukan di jaringan. Mungkin belum terkonfirmasi.';
      }
    }

    // ── SOL via public RPC ──
    else if (isSol) {
      explorerLink = `https://solscan.io/tx/${hash}`;
      const rpc = 'https://api.mainnet-beta.solana.com';
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getTransaction',
          params: [hash, { encoding: 'json', maxSupportedTransactionVersion: 0 }],
        }),
      });
      const data = await res.json();
      const tx = data?.result;
      if (tx && !tx.meta?.err) {
        const preBalances = tx.meta?.preBalances || [];
        const postBalances = tx.meta?.postBalances || [];
        const maxChange = Math.max(...postBalances.map((b, i) => b - (preBalances[i] || 0)));
        actualAmount = maxChange / 1e9;
        const amountOk = !expectedAmount || Math.abs(actualAmount - parseFloat(expectedAmount)) / parseFloat(expectedAmount) < 0.05;
        verified = amountOk;
        if (!amountOk) errorMsg = `Jumlah tidak sesuai. Terdeteksi: ${actualAmount.toFixed(6)} SOL`;
      } else if (tx?.meta?.err) {
        errorMsg = 'Transaksi gagal di jaringan Solana.';
      } else {
        errorMsg = 'TX Hash tidak ditemukan. Mungkin belum terkonfirmasi.';
      }
    }

    // ── BTC via Blockstream ──
    else if (isBtc) {
      explorerLink = `https://mempool.space/tx/${hash}`;
      const res = await fetch(`https://blockstream.info/api/tx/${hash}`);
      if (res.ok) {
        const tx = await res.json();
        if (tx?.status?.confirmed) {
          const output = toAddress
            ? tx.vout?.find(v => v.scriptpubkey_address === toAddress)
            : tx.vout?.[0];
          if (output) {
            actualAmount = output.value / 1e8;
            const amountOk = !expectedAmount || Math.abs(actualAmount - parseFloat(expectedAmount)) / parseFloat(expectedAmount) < 0.05;
            verified = amountOk;
            if (!amountOk) errorMsg = `Jumlah tidak sesuai. Terdeteksi: ${actualAmount.toFixed(8)} BTC`;
          } else {
            errorMsg = 'Alamat penerima tidak cocok.';
          }
        } else {
          errorMsg = 'Transaksi belum terkonfirmasi di blockchain BTC.';
        }
      } else {
        errorMsg = 'TX Hash BTC tidak ditemukan.';
      }
    }

    else {
      errorMsg = `Verifikasi otomatis untuk ${coin} belum didukung. Menunggu konfirmasi manual admin.`;
    }

    // ── Update DepositRequest status ──
    // Balance credit TIDAK dilakukan di sini — diserahkan ke automation autoConfirmDeposit
    // sehingga tidak ada double-credit baik via auto-verify maupun admin manual confirm
    if (verified) {
      await base44.asServiceRole.entities.DepositRequest.update(depositRequestId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        adminNote: `Auto-verified via blockchain. Amount: ${actualAmount ?? expectedAmount} ${coin}`,
      });
      console.log(`[verifyTxHash] DepositRequest ${depositRequestId} confirmed. Balance akan di-credit oleh automation.`);
    } else {
      // Tandai pending reason agar admin tahu
      await base44.asServiceRole.entities.DepositRequest.update(depositRequestId, {
        pendingReason: errorMsg || 'Verifikasi otomatis gagal, menunggu review manual.',
      });
    }

    return Response.json({
      verified,
      actualAmount,
      explorerLink,
      errorMsg: verified ? null : (errorMsg || 'Verifikasi gagal.'),
    });

  } catch (error) {
    if (error.message?.includes('Object not found')) {
      return Response.json({ error: 'Deposit not found' }, { status: 404 });
    }
    console.error('[verifyTxHash] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});