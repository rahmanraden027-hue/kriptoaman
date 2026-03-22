import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all loans for this user
    const loans = await base44.asServiceRole.entities.P2PLoan.filter({
      $or: [{ lenderEmail: user.email }, { borrowerEmail: user.email }]
    });

    // Calculate metrics
    let totalBorrowed = 0;
    let totalRepaid = 0;
    let completedLoans = 0;
    let defaultedLoans = 0;
    let totalLoans = loans.length;

    for (const loan of loans) {
      if (loan.borrowerEmail === user.email) {
        totalBorrowed += loan.principalAmount;
        totalRepaid += loan.amountRepaid || 0;

        if (loan.status === 'completed') completedLoans++;
        if (loan.status === 'defaulted') defaultedLoans++;
      }
    }

    // Calculate credit score (0-1000)
    const repaymentRate = totalLoans > 0 ? (completedLoans / totalLoans) * 100 : 0;
    const defaultRate = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;
    
    let creditScore = 500; // base score
    creditScore += repaymentRate * 3; // +3 per % of on-time repayment
    creditScore -= defaultRate * 5; // -5 per % of default
    creditScore = Math.max(0, Math.min(1000, creditScore));

    // Calculate rating (0-5)
    const rating = (creditScore / 1000) * 5;

    // Update or create UserLendingRating
    let userRating = await base44.asServiceRole.entities.UserLendingRating.filter({
      userEmail: user.email
    });

    const ratingData = {
      userEmail: user.email,
      totalLoans,
      completedLoans,
      defaultedLoans,
      avgRepaymentRate: repaymentRate,
      creditScore: Math.round(creditScore),
      rating: Math.round(rating * 10) / 10,
      totalBorrowAmount: totalBorrowed,
      totalRepaidAmount: totalRepaid,
      lastUpdateAt: new Date().toISOString()
    };

    if (userRating.length > 0) {
      await base44.asServiceRole.entities.UserLendingRating.update(userRating[0].id, ratingData);
    } else {
      await base44.asServiceRole.entities.UserLendingRating.create(ratingData);
    }

    return Response.json({ success: true, metrics: ratingData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});