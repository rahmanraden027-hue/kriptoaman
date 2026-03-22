import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allProfits = await base44.asServiceRole.entities.AdminProfit.list();

    const totalProfit = allProfits.reduce((sum, p) => sum + p.amount, 0);
    const totalTransactions = allProfits.length;

    const byType = {};
    const byCurrency = {};
    const dailyProfit = {};

    allProfits.forEach(p => {
      byType[p.transactionType] = (byType[p.transactionType] || 0) + p.amount;
      byCurrency[p.currency] = (byCurrency[p.currency] || 0) + p.amount;

      const date = new Date(p.created_date).toISOString().split('T')[0];
      dailyProfit[date] = (dailyProfit[date] || 0) + p.amount;
    });

    const topUsers = {};
    allProfits.forEach(p => {
      topUsers[p.userEmail] = (topUsers[p.userEmail] || 0) + p.amount;
    });

    const topUsersList = Object.entries(topUsers)
      .map(([email, profit]) => ({ email, profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    return Response.json({
      success: true,
      totalProfit,
      totalTransactions,
      averagePerTransaction: totalTransactions > 0 ? totalProfit / totalTransactions : 0,
      byType,
      byCurrency,
      dailyProfit,
      topUsers: topUsersList
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});