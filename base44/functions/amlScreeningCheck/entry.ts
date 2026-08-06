import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * AML Screening Service — detects fraud indicators & calculates risk scores
 * Triggered on withdrawals, sends, large deposits
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { userEmail, transactionId, transactionType, amount, toAddress } = await req.json();

    if (!userEmail || !transactionType || typeof amount !== 'number') {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (user.role !== 'admin' && user.email !== userEmail) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`[AML] Screening ${userEmail}: ${transactionType} $${amount}`);

    // Fetch user's recent transactions (24h window)
    const txHistory = await base44.asServiceRole.entities.WithdrawalRequest.filter({
      userEmail,
      status: { $in: ['pending', 'processing', 'completed'] },
      created_date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    });

    // Try to fetch send history if entity exists
    let sendHistory = [];
    try {
      sendHistory = await base44.asServiceRole.entities.SendTransaction?.filter?.({
        userEmail,
        created_date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
      }) || [];
    } catch (err) {
      // Entity doesn't exist, continue with just withdrawals
      sendHistory = [];
    }

    const allTx = [...(txHistory || []), ...(sendHistory || [])].sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );

    // ─────────────────────────────────────────────────────────────────
    // INDICATOR 1: Rapid Transfers (multiple TXs dalam 1 jam)
    // ─────────────────────────────────────────────────────────────────
    const lastHourTx = allTx.filter(tx => 
      Date.now() - new Date(tx.created_date).getTime() < 60 * 60 * 1000
    );
    
    let rapidTransferScore = 0;
    let rapidIndicator = null;
    if (lastHourTx.length >= 3) {
      rapidTransferScore = 25;
      rapidIndicator = {
        type: 'rapid_transfers',
        description: `${lastHourTx.length} transfers dalam 1 jam terakhir`,
        score: rapidTransferScore
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // INDICATOR 2: High Volume (> $50K in 24h)
    // ─────────────────────────────────────────────────────────────────
    const totalVolume24h = allTx.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    let volumeScore = 0;
    let volumeIndicator = null;
    if (totalVolume24h > 50000) {
      volumeScore = Math.min(30, (totalVolume24h - 50000) / 10000);
      volumeIndicator = {
        type: 'high_volume',
        description: `$${totalVolume24h.toFixed(2)} dalam 24 jam (limit: $50K)`,
        score: volumeScore
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // INDICATOR 3: Unknown Address (first time sending to this address)
    // ─────────────────────────────────────────────────────────────────
    let unknownAddressScore = 0;
    let unknownIndicator = null;
    if (toAddress) {
      const prevToThisAddress = allTx.filter(tx => tx.toAddress === toAddress);
      if (prevToThisAddress.length === 0) {
        unknownAddressScore = 15;
        unknownIndicator = {
          type: 'unknown_address',
          description: `First transfer ke address ${toAddress.slice(0, 8)}...`,
          score: unknownAddressScore
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // INDICATOR 4: Velocity Check (sudden increase from pattern)
    // ─────────────────────────────────────────────────────────────────
    let velocityScore = 0;
    let velocityIndicator = null;
    if (allTx.length > 0) {
      const avgTxAmount = allTx.reduce((sum, tx) => sum + (tx.amount || 0), 0) / allTx.length;
      const currentTxIncrease = (amount - avgTxAmount) / avgTxAmount;
      
      if (currentTxIncrease > 2.0) { // 2x lebih besar dari rata-rata
        velocityScore = 20;
        velocityIndicator = {
          type: 'velocity_check',
          description: `TX $${amount} is ${currentTxIncrease.toFixed(1)}x larger than average $${avgTxAmount.toFixed(2)}`,
          score: velocityScore
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // INDICATOR 5: Round Amount (psychological marker for manual/bot)
    // ─────────────────────────────────────────────────────────────────
    let roundScore = 0;
    let roundIndicator = null;
    const amountStr = amount.toString();
    if (amount % 1000 === 0 && amount >= 10000) {
      roundScore = 5;
      roundIndicator = {
        type: 'round_amount',
        description: `Round amount $${amount} (possible automated transfer)`,
        score: roundScore
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // INDICATOR 6: Off-Hours Transaction
    // ─────────────────────────────────────────────────────────────────
    let offHoursScore = 0;
    let offHoursIndicator = null;
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 22 || hour <= 4) { // 10pm - 4am
      offHoursScore = 8;
      offHoursIndicator = {
        type: 'off_hours',
        description: `Transaction at ${hour}:00 (unusual hours)`,
        score: offHoursScore
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // CALCULATE TOTAL RISK SCORE
    // ─────────────────────────────────────────────────────────────────
    const totalScore = rapidTransferScore + volumeScore + unknownAddressScore + 
                       velocityScore + roundScore + offHoursScore;

    const indicators = [rapidIndicator, volumeIndicator, unknownIndicator, 
                       velocityIndicator, roundIndicator, offHoursIndicator].filter(Boolean);

    let riskLevel = 'low';
    if (totalScore >= 75) riskLevel = 'critical';
    else if (totalScore >= 50) riskLevel = 'high';
    else if (totalScore >= 25) riskLevel = 'medium';

    // ─────────────────────────────────────────────────────────────────
    // STORE SCREENING RESULT
    // ─────────────────────────────────────────────────────────────────
    const screeningRecord = await base44.asServiceRole.entities.AMLScreening.create({
      userEmail,
      riskScore: totalScore,
      riskLevel,
      flaggedTransaction: transactionId,
      transactionAmount: amount,
      indicators,
      transactionHistory24h: allTx.slice(0, 10).map(tx => ({
        timestamp: tx.created_date,
        amount: tx.amount,
        type: tx.status,
        riskScore: 0
      })),
      status: totalScore >= 75 ? 'flagged' : totalScore >= 25 ? 'pending_review' : 'clean',
      lastScreenedAt: new Date().toISOString()
    });

    console.log(`[AML] Risk Score: ${totalScore} (${riskLevel})`);

    // ─────────────────────────────────────────────────────────────────
    // NOTIFY ADMIN IF FLAGGED
    // ────────────────────────────────────────────────────────────────
    if (totalScore >= 75 && !screeningRecord.notificationSent) {
      const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL");
      await base44.asServiceRole.integrations.Core.SendEmail({
 to: adminEmail,      
       subject: `🚨 AML ALERT: High Risk Account Detected — ${riskLevel.toUpperCase()}`,
        body: `
          <h2>AML Screening Alert</h2>
          <p><strong>User:</strong> ${userEmail}</p>
          <p><strong>Risk Score:</strong> ${totalScore}/100 (${riskLevel})</p>
          <p><strong>Transaction:</strong> ${transactionType} $${amount}</p>
          
          <h3>Risk Indicators:</h3>
          <ul>
            ${indicators.map(ind => `<li><strong>${ind.type}:</strong> ${ind.description} (+${ind.score})</li>`).join('')}
          </ul>
          
          <h3>Action Required:</h3>
          <p>⚠️ Account flagged for manual review. Please investigate before releasing funds.</p>
          <p><a href="https://app.kriptoaman.com/admin">Go to Admin Panel</a></p>
        `
      });

      await base44.asServiceRole.entities.AMLScreening.update(screeningRecord.id, {
        notificationSent: true
      });
    }

    return Response.json({
      success: true,
      screeningId: screeningRecord.id,
      riskScore: totalScore,
      riskLevel,
      flagged: totalScore >= 75,
      indicators,
      recommendation: totalScore >= 75 ? 'BLOCK_AND_REVIEW' : totalScore >= 25 ? 'ALLOW_WITH_MONITORING' : 'APPROVE'
    });

  } catch (error) {
    console.error('[amlScreeningCheck] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
