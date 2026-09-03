export const AI_WATCHLIST = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];

export function buildIntelligenceSnapshot(prices = {}) {
  return AI_WATCHLIST.map((symbol) => {
    const item = prices?.[symbol];
    if (!item || !Number.isFinite(Number(item.price))) return null;
    return {
      symbol,
      price: Number(item.price),
      change24h: Number.isFinite(Number(item.change24h)) ? Number(item.change24h) : null,
      high24h: Number.isFinite(Number(item.high24h)) ? Number(item.high24h) : null,
      low24h: Number.isFinite(Number(item.low24h)) ? Number(item.low24h) : null,
      volume24h: Number.isFinite(Number(item.volume24h)) ? Number(item.volume24h) : null,
    };
  }).filter(Boolean);
}

export function buildIntelligenceMetrics(snapshot = []) {
  const changes = snapshot.map((item) => item.change24h).filter(Number.isFinite);
  const average = changes.length ? changes.reduce((sum, value) => sum + value, 0) / changes.length : 0;
  const positive = changes.filter((value) => value > 0).length;
  const negative = changes.filter((value) => value < 0).length;
  const breadthPct = changes.length ? (positive / changes.length) * 100 : 0;
  const dispersion = changes.length > 1
    ? Math.sqrt(changes.reduce((sum, value) => sum + ((value - average) ** 2), 0) / changes.length)
    : 0;
  const ranges = snapshot
    .map((item) => {
      if (!Number.isFinite(item.high24h) || !Number.isFinite(item.low24h) || !Number.isFinite(item.price) || item.price <= 0) return null;
      return ((item.high24h - item.low24h) / item.price) * 100;
    })
    .filter(Number.isFinite);
  const volatilityProxyPct = ranges.length ? ranges.reduce((sum, value) => sum + value, 0) / ranges.length : null;
  const anomalySymbols = dispersion > 0
    ? snapshot.filter((item) => Number.isFinite(item.change24h) && Math.abs((item.change24h - average) / dispersion) >= 1.5).map((item) => item.symbol)
    : [];
  const strongestMover = snapshot
    .filter((item) => Number.isFinite(item.change24h))
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0] || null;
  const momentumBand = average > 1 ? 'positive' : average < -1 ? 'negative' : 'neutral';
  const riskScore = Math.min(100, Math.round((dispersion * 12) + ((volatilityProxyPct || 0) * 4)));
  const riskBand = riskScore >= 70 ? 'elevated' : riskScore >= 35 ? 'moderate' : 'contained';

  return {
    average,
    positive,
    negative,
    breadthPct,
    dispersion,
    volatilityProxyPct,
    anomalySymbols,
    strongestMover: strongestMover ? { symbol: strongestMover.symbol, change24h: strongestMover.change24h } : null,
    momentumBand,
    riskScore,
    riskBand,
    correlationStatus: 'history-required',
  };
}

export function deterministicIntelligence(snapshot = [], language = 'id', networkContext = null) {
  const metrics = buildIntelligenceMetrics(snapshot);
  if (!snapshot.length) {
    return {
      title: language === 'en' ? 'Waiting for verified market data' : 'Menunggu data pasar terverifikasi',
      body: language === 'en'
        ? 'KriptoAman will generate market intelligence after a verified price snapshot is available.'
        : 'KriptoAman akan menghasilkan market intelligence setelah snapshot harga terverifikasi tersedia.',
      sentiment: 'neutral',
      confidence: 'data-pending',
      metrics,
    };
  }

  const breadth = metrics.positive > metrics.negative ? 'positive' : metrics.negative > metrics.positive ? 'negative' : 'mixed';
  const sentiment = metrics.momentumBand;
  const networkText = networkContext?.verified
    ? language === 'en'
      ? ` Network health is ${networkContext.online}/${networkContext.total} live and KAM is ${networkContext.kamOperational ? 'operational' : 'not confirmed operational'}.`
      : ` Kesehatan jaringan ${networkContext.online}/${networkContext.total} live dan KAM ${networkContext.kamOperational ? 'operasional' : 'belum terkonfirmasi operasional'}.`
    : '';
  const anomalyText = metrics.anomalySymbols.length
    ? language === 'en'
      ? ` Cross-sectional anomaly flag: ${metrics.anomalySymbols.join(', ')}.`
      : ` Penanda anomali lintas aset: ${metrics.anomalySymbols.join(', ')}.`
    : '';

  return language === 'en'
    ? {
        title: `Market breadth is ${breadth} · risk ${metrics.riskBand}`,
        body: `${snapshot.length} major assets are verified. Average 24h change is ${metrics.average.toFixed(2)}%, with ${metrics.positive} advancing and ${metrics.negative} declining. Dispersion is ${metrics.dispersion.toFixed(2)}% and the descriptive risk score is ${metrics.riskScore}/100.${anomalyText}${networkText}`,
        sentiment,
        confidence: 'rules-based',
        metrics,
      }
    : {
        title: `Breadth pasar ${breadth === 'positive' ? 'positif' : breadth === 'negative' ? 'negatif' : 'campuran'} · risiko ${metrics.riskBand === 'elevated' ? 'tinggi' : metrics.riskBand === 'moderate' ? 'moderat' : 'terkendali'}`,
        body: `${snapshot.length} aset utama terverifikasi. Rata-rata perubahan 24 jam ${metrics.average.toFixed(2)}%, dengan ${metrics.positive} menguat dan ${metrics.negative} melemah. Dispersi ${metrics.dispersion.toFixed(2)}% dan skor risiko deskriptif ${metrics.riskScore}/100.${anomalyText}${networkText}`,
        sentiment,
        confidence: 'rules-based',
        metrics,
      };
}
