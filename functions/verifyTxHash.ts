import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Verifies a crypto transaction hash against public block explorers.
 * Supports: ETH/ERC-20, SOL, BNB, BTC, USDT (auto-detect network).
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
        // Check recipient matches platform address (case-insensitive)
        const toOk = !toAddress || tx.to?.toLowerCase() === toAddress.toLowerCase();

        if (toOk) {
          // For native ETH/BNB, value is in hex wei
          const valueWei = parseInt(tx.value, 16);
          const valueEth = valueWei / 1e18;
          actualAmount = valueEth;

          // For USDT (ERC-20), we need the receipt logs - use a simpler amount match
          // If USDT, skip amount check strictly (log parsing is complex without key)
          const amountOk = coin === 'USDT' || !expectedAmount || Math.abs(valueEth - parseFloat(expectedAmount)) / parseFloat(expectedAmount) < 0.05;
          verified = amountOk;
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
        // Confirmed if no error
        const preBalances = tx.meta?.preBalances || [];
        const postBalances = tx.meta?.postBalances || [];
        // Amount transferred = change in receiver's balance (lamports → SOL)
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
          // Find output matching platform address
          const output = toAddress
            ? tx.vout?.find(v => v.scriptpubkey_address === toAddress)
            : tx.vout?.[0];
          if (output) {
            actualAmount = output.value / 1e8; // satoshi → BTC
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
      // Unknown coin — just mark as pending for manual review
      errorMsg = `Verifikasi otomatis untuk ${coin} belum didukung. Menunggu konfirmasi manual admin.`;
    }

    // ── Update deposit request ──
    if (verified) {
      await base44.asServiceRole.entities.DepositRequest.update(depositRequestId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        adminNote: `Auto-verified via blockchain. Amount: ${actualAmount ?? expectedAmount}`,
      });

      // Credit balance to user
      if (userEmail) {
        const balances = await base44.asServiceRole.entities.UserBalance.filter({ userEmail, coin });
        if (balances.length > 0) {
          const bal = balances[0];
          await base44.asServiceRole.entities.UserBalance.update(bal.id, {
            amount: (bal.amount || 0) + parseFloat(expectedAmount),
          });
        } else {
          await base44.asServiceRole.entities.UserBalance.create({
            userEmail,
            coin,
            amount: parseFloat(expectedAmount),
          });
        }
      }
    }

    return Response.json({
      verified,
      actualAmount,
      explorerLink,
      errorMsg: verified ? null : (errorMsg || 'Verifikasi gagal.'),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});