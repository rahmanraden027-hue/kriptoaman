const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800, stale-if-error=7200',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const isoDate = date => date.toISOString().slice(0, 10);

const asText = value => value == null ? null : String(value).trim() || null;

export async function onRequestGet({ env }) {
  const requestId = crypto.randomUUID();
  const credential = String(env?.TRADING_ECONOMICS_CREDENTIAL || '').trim();

  if (!credential) {
    return json({
      status: 'not_configured',
      code: 'ECONOMIC_CALENDAR_NOT_CONFIGURED',
      message: 'Economic calendar provider is not configured.',
      events: [],
      requestId,
    }, 503, { 'Retry-After': '600' });
  }

  const from = new Date();
  const to = new Date(from.getTime() + (7 * 24 * 60 * 60 * 1000));
  const endpoint = new URL(`https://api.tradingeconomics.com/calendar/country/united%20states/${isoDate(from)}/${isoDate(to)}`);
  endpoint.searchParams.set('c', credential);
  endpoint.searchParams.set('f', 'json');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KriptoAman-Economic-Calendar/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return json({
        status: 'unavailable',
        code: `ECONOMIC_CALENDAR_HTTP_${response.status}`,
        events: [],
        requestId,
      }, 503, { 'Retry-After': '300' });
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      return json({ status: 'unavailable', code: 'ECONOMIC_CALENDAR_INVALID_RESPONSE', events: [], requestId }, 503);
    }

    const events = payload
      .map(item => ({
        id: item?.CalendarId ?? item?.CalendarID ?? null,
        date: asText(item?.Date),
        country: asText(item?.Country),
        event: asText(item?.Event),
        category: asText(item?.Category),
        importance: Number(item?.Importance) || 0,
        actual: asText(item?.Actual),
        forecast: asText(item?.Forecast),
        previous: asText(item?.Previous),
        unit: asText(item?.Unit),
      }))
      .filter(item => item.date && item.event && item.importance >= 2)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 24);

    return json({
      schemaVersion: '1.0',
      status: 'available',
      provider: 'Trading Economics',
      scope: 'United States · medium/high importance · next 7 days',
      events,
      attribution: {
        label: 'Economic calendar data: Trading Economics',
        url: 'https://tradingeconomics.com/calendar',
      },
      disclosure: 'Calendar events are informational and may be revised by the source provider.',
      requestId,
    }, 200, { 'X-KriptoAman-Economic-Calendar': 'trading-economics-v1' });
  } catch (error) {
    console.error('Economic calendar unavailable', { requestId, error });
    return json({ status: 'unavailable', code: 'ECONOMIC_CALENDAR_FAILED', events: [], requestId }, 503, { 'Retry-After': '300' });
  } finally {
    clearTimeout(timeout);
  }
}
